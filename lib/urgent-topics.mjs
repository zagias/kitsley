// Immediate actions are kept together; no quiz or account is required to see them.
const topic=(title,icon,visual,actions,next,guide)=>({title,icon,visual,actions,next,guide});
export const emergencyNotice='Fire, smoke, suspected gas leak or immediate danger? Leave now. Call your local emergency number from a safe place (911 in the US/Canada).';
export const urgentTopics={
 'basement-flood':topic('Water or flooding','plumbing','flood',[
 ['Stay out of the water','Keep people and pets away. Water may be contaminated or touching live electrical equipment.'],
 ['Get the power made safe','Call the electric utility. Do not touch wet equipment or approach a panel through water.'],
 ['Stop the source only if safely reachable','Close a known water shutoff from a dry, safe place. Otherwise call an emergency plumber.']
 ],'Once the area is confirmed safe, contact your insurer and a restoration service. Photograph damage from safe access before cleanup.','basement-flood'),
 'burning-outlet':topic('Hot outlet, sparks or burning smell','electrical','power',[
 ['Smoke, sparks or burning? Leave','Call emergency services from outside. Never put water on an electrical fire.'],
 ['Keep away from the outlet','Do not touch hot, damaged or wet plugs, switches or covers. Keep others away.'],
 ['Have the circuit checked','Contact a qualified electrician. Leave the outlet out of use until the fault is repaired.']
 ],'Tell the electrician which outlet, what was connected and what you noticed. Do not remove the cover to investigate.','burning-outlet'),
 gas:topic('Gas smell or hissing','safety','exit',[
 ['Leave immediately','Get outside and away from the suspected leak.'],
 ['Do not operate anything inside','No switches, appliances, flames or phone calls indoors. Do not attempt the gas shutoff.'],
 ['Call from a safe place','Call your local emergency number and gas utility from outside, away from the leak.']
 ],'Stay out until emergency services or the gas utility says it is safe to return.',null),
 'ceiling-leak':topic('Water through the ceiling','drywall','ceiling',[
 ['Clear the space below','Keep people out of a room with a bulging, sagging or cracking ceiling. Do not poke it or stand beneath it.'],
 ['Keep clear of wet electrics','Do not touch wet switches or fixtures. For smoke or sparks, leave and call emergency services.'],
 ['Call for the source repair','Contact a plumber for plumbing leaks or a roofer for rain entry. Stay off the roof; reach a water shutoff only from safe, dry access.']
 ],'Only after the area is made safe, document the damage and arrange drying and ceiling assessment.','ceiling-leak'),
 'sewage-backup':topic('Sewage coming up a drain','plumbing','flood',[
 ['Keep everyone out','Avoid contact with sewage. If it may touch electrical equipment, call the electric utility and stay clear.'],
 ['Stop using water','Do not flush toilets or run taps, laundry or the dishwasher. These add water to the backup.'],
 ['Call the drain service','Contact a plumber or sewer utility, then your insurer. Arrange professional cleanup for contamination.']
 ],'Photograph from a safe, dry location. Do not mix cleaning products or start contaminated cleanup before the area is assessed.','sewage-backup'),
 'frozen-pipe':topic('A frozen or burst pipe','plumbing','faucet',[
 ['Check for a burst from safe access','If water is near electrical equipment, stay out and call the electric utility.'],
 ['Know the water shutoff','If a pipe has burst, close a known valve only if safely reachable from a dry location.'],
 ['Call a plumber if the freeze is hidden','Do not use a flame, torch or boiling water. Hidden, damaged or inaccessible pipework needs professional help.']
 ],'Record which taps have stopped, the last time water flowed and any visible leak. Do not force a seized valve.','frozen-pipe'),
 'water-damage-record':topic('Record damage after the danger has passed','maintenance','record',[
 ['Confirm safe access first','Do not enter floodwater or damaged rooms to take pictures. Wait for the relevant professionals to make them safe.'],
 ['Photograph before clearing up','Capture each affected area, water marks and item labels. Keep the original photos with their dates.'],
 ['Call your insurer','Ask what to keep, what to document and what work can begin. Record the claim number and keep receipts.']
 ],'Create an item list with location, description, approximate age and available purchase records. Keep a log of calls and agreed actions.','water-damage-record')
};
