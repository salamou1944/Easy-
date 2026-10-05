import assert from 'node:assert/strict';
import test from 'node:test';
import {classifyIntent,createSupportResolutionResolver} from '../src/support-resolution-resolver.mjs';

test('classifies delivery tickets deterministically',()=>{
 const result=classifyIntent('Where is my order? It is delayed');
 assert.equal(result.intent,'delivery'); assert.equal(result.confidence,0.95);
});

test('fails closed when order context is required but unavailable',async()=>{
 const resolve=createSupportResolutionResolver({contextProvider:async()=>null,policyProvider:async()=>({autoResolveIntents:['delivery'],maxConfidence:0.9})});
 const result=await resolve({message:'Where is my order?'});
 assert.equal(result.status,'human_review');
 assert.equal(result.reason,'missing_order_or_customer_context');
 assert.equal(result.evidenceBacked,false);
});

test('keeps risky intents human-reviewed even with context',async()=>{
 const resolve=createSupportResolutionResolver({contextProvider:async()=>({orderId:'1042',orderStatus:'processing'}),policyProvider:async()=>({autoResolveIntents:['refund'],maxConfidence:0.9})});
 const result=await resolve({message:'I want a refund'});
 assert.equal(result.status,'human_review');
 assert.equal(result.reason,'policy_requires_human_review');
});

test('allows only explicitly configured low-risk intent with evidence',async()=>{
 const resolve=createSupportResolutionResolver({contextProvider:async()=>({orderId:'1042',orderStatus:'shipped'}),policyProvider:async()=>({autoResolveIntents:['delivery'],maxConfidence:0.9})});
 const result=await resolve({message:'Where is my order?'});
 assert.equal(result.status,'auto_resolve_candidate');
 assert.equal(result.evidenceBacked,true);
 assert.match(result.draft.text,/1042/);
});