import assert from 'node:assert/strict';
import test from 'node:test';
import {createLeadQualificationWorkflow} from '../src/lead-qualification-workflow.mjs';

test('qualifies an inbound lead through the reusable provider',async()=>{const workflow=createLeadQualificationWorkflow({provider:{async qualify(lead){return {provider:'test-provider',lead,qualification:{score:88,priority:'high',intent:'purchase',summary:'Ready',reasons:['Clear need'],next_action:'Contact within one business day'}}}}});const result=await workflow({company:'Acme',message:'We need automation now'});assert.equal(result.status,'qualified');assert.equal(result.qualification.score,88);assert.equal(result.nextAction,'Contact within one business day')});

test('requires a lead message',async()=>{const workflow=createLeadQualificationWorkflow({provider:{async qualify(){throw new Error('should_not_run')}}});await assert.rejects(()=>workflow({company:'Acme'}),/lead_message_required/)});
