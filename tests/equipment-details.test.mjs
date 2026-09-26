import test from 'node:test';import assert from 'node:assert/strict';
import {equipmentPolicy,equipmentLabel} from '../lib/equipment-details.mjs';
import {validEquipment,cleanCompanion} from '../lib/companion-profile.mjs';
import {makeBackup,validateBackup} from '../lib/workspace-backup.mjs';
import {validateEntities} from '../lib/workspace-sync.mjs';
test('basic tools ask for type and size; equipment and specialist systems need identifiers',()=>{
 for(const id of ['screwdriver','claw-hammer','utility-knife','caulk-gun','tape','handsaw'])assert.equal(equipmentPolicy(id).modelRelevant,false,id);
 for(const id of ['nailer','sprayer','drill','saw','sander','stud-finder','pocket-jig','hinge-jig','respirator','glue'])assert.equal(equipmentPolicy(id).modelRelevant,true,id);
 assert(equipmentPolicy('screwdriver',{variant:'torque screwdriver'}).modelRelevant);assert(equipmentPolicy('caulk-gun',{variant:'battery powered'}).modelRelevant);
});
test('size-only hand-tool records survive validation, sync, backup and advice context',()=>{
 const t={id:'driver-1',toolId:'screwdriver',make:'',model:'',variant:'Robertson #2',accessories:'',source:'user',updatedAt:'2026-09-26'};
 assert(validEquipment(t));assert.equal(equipmentLabel(t),'Robertson #2');validateEntities({'equipment:driver-1':t});assert.deepEqual(validateBackup(makeBackup([],['screwdriver'],[],[t])).equipment,[t]);
 assert.equal(cleanCompanion([t],[],['screwdriver']).equipment[0].identification,'type-and-size');assert.equal(cleanCompanion([t],[],[]).equipment.length,0);
 assert(!validEquipment({...t,variant:''}));assert(!validEquipment({...t,toolId:'sprayer'}));assert(validEquipment({...t,make:'Existing brand',model:'Existing model'}));
});
