import {createSalamou31LeadQualificationProvider} from './providers/salamou31-lead-qualification.mjs';

export function createLeadQualificationWorkflow({provider=null}={}){
  const configuredProvider=provider||(
    process.env.EASY_PRODUCT_CONTENT_API_URL&&process.env.EASY_PRODUCT_CONTENT_API_KEY
      ? createSalamou31LeadQualificationProvider()
      : null
  );
  return async function run(input){
    if(!configuredProvider)throw new Error('lead_qualification_provider_not_configured');
    if(!input||typeof input!=='object'||typeof input.message!=='string'||!input.message.trim())throw new Error('lead_message_required');
    const result=await configuredProvider.qualify(input);
    return {version:1,status:'qualified',lead:result.lead,qualification:result.qualification,provider:result.provider,nextAction:result.qualification.next_action};
  };
}
