const RISK_INTENTS=new Set(['refund','chargeback','payment','account_access','address_change','cancellation','complaint']);
const REQUIRED_CONTEXT=['orderId','orderStatus'];

function required(value,name){if(value===undefined||value===null||value==='')throw new Error(name+'_required');}
function normalizePolicy(policy={}){
  return {
    autoResolveIntents:Array.isArray(policy.autoResolveIntents)?policy.autoResolveIntents.map(String):[],
    maxConfidence:Number.isFinite(policy.maxConfidence)?policy.maxConfidence:0.92,
    requireOrderForIntents:Array.isArray(policy.requireOrderForIntents)?policy.requireOrderForIntents.map(String):['delivery','shipping','refund','cancellation','order_status']
  };
}

export function createSupportResolutionResolver({contextProvider,policyProvider,clock=()=>new Date().toISOString()}={}){
  if(typeof contextProvider!=='function')throw new Error('support_context_provider_required');
  if(policyProvider!==undefined&&typeof policyProvider!=='function')throw new Error('support_policy_provider_invalid');

  return async function resolve(ticket){
    required(ticket?.message,'support_ticket_message_required');
    const policy=normalizePolicy(await (policyProvider?.(ticket)||{}));
    const classification=classifyIntent(ticket.message);
    const needsOrder=policy.requireOrderForIntents.includes(classification.intent);
    let context=null;
    if(needsOrder||ticket.orderId||ticket.customerId){
      context=await contextProvider({ticket,classification});
    }
    if(needsOrder&&!context) return escalate(ticket,classification,'missing_order_or_customer_context',clock);
    const confidence=classification.confidence;
    const eligible=confidence>=policy.maxConfidence &&
      policy.autoResolveIntents.includes(classification.intent) &&
      !RISK_INTENTS.has(classification.intent) &&
      Boolean(context);
    const draft=buildDraft(ticket,classification,context);
    return {status:eligible?'auto_resolve_candidate':'human_review',ticket,classification,context,draft,confidence,evidenceBacked:Boolean(context),policy,reason:eligible?'policy_allows_auto_resolution':'policy_requires_human_review',createdAt:clock()};
  };
}

export function classifyIntent(message){
  const text=String(message).toLowerCase();
  const rules=[
    ['refund',['refund','money back','reimburse'],0.97],
    ['delivery',['where is my order','delivery','delayed','late','shipping','shipped'],0.95],
    ['order_status',['order status','track my order','tracking'],0.96],
    ['cancellation',['cancel my order','cancellation','cancel order'],0.98],
    ['payment',['charged','payment','card','paid twice','double charge'],0.97],
    ['account_access',['password','login','sign in','account'],0.94],
    ['complaint',['complaint','angry','terrible','bad experience'],0.93]
  ];
  const match=rules.find(([,terms])=>terms.some(term=>text.includes(term)));
  return match?{intent:match[0],confidence:match[2],matchedTerms:match[1].filter(term=>text.includes(term))}:{intent:'other',confidence:0.75,matchedTerms:[]};
}

function buildDraft(ticket,classification,context){
  if(!context)return {text:'Thanks for contacting us. A support specialist will review your request and get back to you.',basis:'human_review'};
  if(classification.intent==='delivery'||classification.intent==='order_status'){
    const status=context.orderStatus??'unknown';
    return {text:`Thanks for reaching out. Your order ${context.orderId??ticket.orderId??''} is currently ${status}. We are reviewing the latest tracking information and will update you if needed.`,basis:'order_context'};
  }
  return {text:'Thanks for contacting us. We reviewed the available order information and a support specialist will confirm the next step.',basis:'order_context'};
}

function escalate(ticket,classification,reason,clock){
  return {status:'human_review',ticket,classification,context:null,draft:buildDraft(ticket,classification,null),confidence:classification.confidence,evidenceBacked:false,policy:null,reason,createdAt:clock()};
}