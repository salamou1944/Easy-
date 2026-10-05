function required(value,name){if(!value)throw new Error(name+'_required');}
function normalizeBase(value){return String(value).replace(/\/$/,'');}

export function createChatwootProvider({baseUrl=process.env.EASY_CHATWOOT_BASE_URL,apiToken=process.env.EASY_CHATWOOT_API_TOKEN,accountId=process.env.EASY_CHATWOOT_ACCOUNT_ID,fetchImpl=globalThis.fetch}={}){
  required(baseUrl,'chatwoot_base_url'); required(apiToken,'chatwoot_api_token'); required(accountId,'chatwoot_account_id');
  if(typeof fetchImpl!=='function')throw new Error('fetch_unavailable');
  async function request(path,{method='GET',body}={}){
    const response=await fetchImpl(normalizeBase(baseUrl)+path,{method,headers:{Accept:'application/json','Content-Type':'application/json',api_access_token:apiToken},...(body===undefined?{}:{body:JSON.stringify(body)})});
    let payload=null; try{payload=await response.json()}catch{}
    if(!response.ok){const error=new Error('chatwoot_request_failed');error.status=response.status;error.payload=payload;throw error}
    return payload;
  }
  return {provider:'chatwoot',
    async sendMessage({conversationId,content,messageType='outgoing',privateMessage=false}){
      if(!conversationId)throw new Error('chatwoot_conversation_id_required');
      if(!content||typeof content!=='string')throw new Error('chatwoot_message_content_required');
      return request('/api/v1/accounts/'+encodeURIComponent(accountId)+'/conversations/'+encodeURIComponent(conversationId)+'/messages',{method:'POST',body:{content,message_type:messageType,private:privateMessage}});
    },
    async setConversationStatus({conversationId,status}){
      if(!conversationId)throw new Error('chatwoot_conversation_id_required');
      if(!['open','pending','resolved','snoozed'].includes(status))throw new Error('chatwoot_invalid_status');
      return request('/api/v1/accounts/'+encodeURIComponent(accountId)+'/conversations/'+encodeURIComponent(conversationId),{method:'PATCH',body:{status}});
    }
  };
}

export function normalizeChatwootMessageWebhook(payload){
  if(!payload||typeof payload!=='object')throw new Error('chatwoot_webhook_invalid_payload');
  if(payload.event!=='message_created')return null;
  const message=payload.message||{};
  if(message.message_type!=='incoming')return null;
  const content=typeof message.content==='string'?message.content.trim():'';
  if(!content)return null;
  return {source:'chatwoot',event:'message_created',conversationId:payload.conversation?.id??payload.conversation_id??null,messageId:message.id??null,contactId:payload.contact?.id??null,content,channel:payload.conversation?.inbox?.channel??null,receivedAt:message.created_at??payload.created_at??null};
}