import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanCompletion,practiceHistory,completionLearning} from '../lib/project-learning.mjs';
import {companionFromEntities} from '../lib/companion-profile.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {safetyDecision} from '../lib/safety-policy.mjs';
const review={version:1,eventId:'completion-1',confirmed:true,designKey:'design-v1',outcome:'success',areas:['woodworking'],tools:{drill:'owned',saw:'borrowed',sander:'rented'},completedAt:'2026-09-26T12:00:00Z'};
const record={id:'p1',version:1,guideId:'bookcase',request:'Build a bookcase',answers:{},messages:[],completionReview:review};
test('required tools and checked steps alone confer neither ownership nor experience',()=>{
 assert.equal(cleanCompletion({...review,confirmed:false}),null);
 assert.deepEqual(practiceHistory([{...record,completionReview:null,done:[0,1,2]}]),[]);
 assert.deepEqual(completionLearning(review).owned,['drill']);
 assert.deepEqual(completionLearning(review).suggestedAreas,['woodworking']);
});
test('practice stays in the confirmed area, never auto-promotes experience or overrides experts',()=>{
 const context=companionFromEntities({'conversation:p1':record});assert.deepEqual(context.experience,[]);
 assert.equal(context.practice[0].id,'woodworking');assert.equal(context.practice.length,1);
 assert.deepEqual(completionLearning(review,[{id:'woodworking',level:'experienced'}]).suggestedAreas,[]);
 assert.deepEqual(completionLearning({...review,outcome:'needs-work'}).suggestedAreas,[]);
 assert.deepEqual(practiceHistory([{...record,completionReview:{...review,outcome:'needs-work'}}]),[]);
 assert.equal(cleanCompletion({...review,areas:['licensed-electrician']}),null);
});
test('completion corrections and copied projects do not multiply the learning evidence',()=>{
 const history=practiceHistory([record,{...record,id:'copy'}]);assert.equal(history[0].projects,1);
 assert.deepEqual(practiceHistory([{...record,completionReview:{...review,areas:[]}}]),[]);
 assert.equal(cleanCompletion({...review,tools:{'invented-tool':'owned'}}),null);
 assert.equal(cleanCompletion({...review,tools:{drill:'automatically-owned'}}),null);
});
test('confirmed practice survives backup and never relaxes electrical safeguards',()=>{
 const backup=validateBackup(makeBackup([record],[],[]));assert.deepEqual(backup.conversations[0].completionReview,review);
 const project={...record,request:'Replace electrical wiring'};
 assert.deepEqual(safetyDecision(project),safetyDecision({...project,completionReview:{...review,areas:['electrical']}}));
});
