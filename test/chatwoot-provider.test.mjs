import assert from 'node:assert/strict';
import test from 'node:test';
import {createChatwootProvider,normalizeChatwootMessageWebhook,verifyChatwootWebhookSignature} from '../src/providers/chatwoot.mjs';

test('normalizes an incoming Chatwoot message into the support contract',()=>{
 const result=normalizeChatwootMessageWebhook({event:'message_created',conversation:{id:42,inbox:{channel:'Channel::WebWidget'}},contact:{id:7},message:{id:99,message_type:'incoming',content:'Where is order 1042?',created_at:1710000000}});
 assert.deepEqual(result,{source:'chatwoot',event:'message_created',conversationId:42,messageId:99,contactId:7,content:'Where is order 1042?',channel:'Channel::WebWidget',receivedAt:1710000000,eventId:'message_created:99'});
});
test('ignores outgoing Chatwoot messages to prevent reply loops',()=>{assert.equal(normalizeChatwootMessageWebhook({event:'message_created',conversation:{id:42},message:{id:99,message_type:'outgoing',content:'reply'}}),null)});
test('rejects malformed or unsigned webhook signatures',async()=>{
 assert.equal(await verifyChatwootWebhookSignature('payload','secret','bad'),false);
 assert.equal(await verifyChatwootWebhookSignature('payload','secret'),false);
});
test('accepts a valid Chatwoot HMAC signature',async()=>{
 const crypto=await import('node:crypto');
 const signature=crypto.createHmac('sha256','secret').update('payload','utf8').digest('hex');
 assert.equal(await verifyChatwootWebhookSignature('payload','secret',signature),true);
});
test('sends a reply through the Chatwoot application API',async()=>{
 let call;
 const provider=createChatwootProvider({baseUrl:'https://support.example/',apiToken:'secret',accountId:'12',fetchImpl:async(url,options)=>{call={url,options};return {ok:true,json:async()=>({id:123})}}});
 const result=await provider.sendMessage({conversationId:42,content:'Draft reply'});
 assert.equal(result.id,123); assert.equal(call.url,'https://support.example/api/v1/accounts/12/conversations/42/messages');
 assert.equal(call.options.headers.api_access_token,'secret');
 assert.deepEqual(JSON.parse(call.options.body),{content:'Draft reply',message_type:'outgoing',private:false});
});