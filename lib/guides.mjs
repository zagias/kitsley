const step=(title,body,tip)=>({title,body,tip});
export const guides={
'cabinet-doors':[
step('Measure the opening, then the door','Record each opening separately. Choose your hinges and confirm their overlay, door thickness and required clearances before making a cut list.','Label every opening. Similar-looking cabinets may have different measurements.'),
step('Lay out and cut the panels','Mark the finished door sizes on your material. Support the panel and offcuts, clamp your cutting guide, and follow your saw’s instructions for the cut. Use dust extraction and suitable protection.','Test the blade and guide on an offcut before cutting a finished door.'),
step('Test the hinge positions','Use the hinge manufacturer’s boring pattern. Set the compatible jig and depth stop on a scrap of the same thickness, then check fit before drilling the doors.','A 35 mm cup is common, but boring depth and edge offsets are hinge-specific.'),
step('Prepare the faces and edges','Ease sharp edges and sand only as needed for the coating system. Remove dust. For MDF, use a compatible sealer or primer on the absorbent edges.','Edges usually need more attention than the flat faces. Inspect them under side lighting.'),
step('Finish, cure, and fit','Follow the finish label for coats and curing. Mount the hinges, support each door while hanging it, and adjust the reveals using the hinge instructions.','Dry to the touch does not mean fully cured. Wait before fitting handles or heavy use.')],
shelves:[
step('Plan the shelf and its load','Measure the space and decide what the shelf will hold. Select a proven span, thickness and bracket system for that load.','Long spans and heavy books need a different design from a small display shelf.'),
step('Locate suitable wall supports','Identify the wall construction and check for concealed services. Select fixings rated for the substrate and the bracket system.','A stud finder is a starting point; verify the support before drilling.'),
step('Cut and finish the shelf','Mark and support the material, cut with a clamped guide, and prepare the edges. Apply your chosen compatible finish.','Finish the underside too before mounting.'),
step('Install and check','Follow the bracket and fixing instructions, level the supports, secure the shelf, and check the installation before loading it.','Keep the intended load within the lowest-rated part of the complete system.')],
bookcase:[
step('Choose a dimensioned design','Use a tested bookcase design. Confirm shelf spans, material thickness and the back-panel construction, then make a cut list.','Include the actual panel thickness in your measurements.'),
step('Cut and label the parts','Cut supported panels with a guide and suitable dust controls. Label the sides, shelves, top, bottom and back.','Cut matching parts using the same setup for consistency.'),
step('Dry-fit and assemble','Check the joints and diagonals before fastening. Assemble with the joint method and fasteners specified by your design.','Check for square before the glue sets.'),
step('Finish and anchor','Prepare and finish the surfaces. Secure the bookcase to appropriate wall structure using a suitable anti-tip system.','Install the anchor before loading the shelves.')],
workbench:[
step('Pick a tested bench design','Choose dimensions and joinery suitable for the tasks and loads you expect. Make a cut list from the design.','Check working height against the kind of work you do.'),
step('Prepare the components','Support and cut the parts using the tool instructions. Label mating components and mark the joinery.','You need stable work supports before the new bench is assembled.'),
step('Assemble the base','Dry-fit, check square, and complete the joints in the order specified by your design.','A flat assembly surface makes twist easier to spot.'),
step('Fit the top and check stability','Attach the top as designed, allowing for timber movement where needed. Level the bench and inspect every joint before use.','Do not assume the bench is safe for standing on.')],
refinish:[
step('Identify the existing surface','Check whether the piece is solid wood, veneer or a laminate. Identify the coating before disturbing it; unknown old coatings may need professional testing.','Thin veneer can be permanently damaged by aggressive sanding.'),
step('Clean and make a test patch','Use a surface-compatible cleaner as directed. Test your proposed preparation and coating on an inconspicuous area.','Grease and wax can prevent a new finish from adhering.'),
step('Prepare only as needed','Follow the new coating system’s preparation guidance. Control dust and avoid cutting through veneer or softening crisp details.','A dust respirator does not automatically protect against coating vapors.'),
step('Apply the finish and let it cure','Apply compatible coats with the specified ventilation and protection. Follow the label for drying, curing and applicator disposal.','Keep the piece out of service until the finish is ready for use.')],
drawers:[
step('Choose slides before sizing the box','Measure the opening and get the selected slide system’s side, rear and vertical clearance requirements.','Different slides need different clearances; do not guess.'),
step('Cut the box components','Follow a dimensioned drawer design. Cut matching sides, front, back and bottom, and label them.','Check the bottom-panel groove or support detail before cutting.'),
step('Assemble square','Dry-fit the box, check matching diagonals, then assemble using the specified joinery and fasteners.','A square drawer is much easier to align on its slides.'),
step('Install and adjust','Fit the slides using their instructions. Test travel and alignment before adding the drawer front and loading the drawer.','Respect the slide rating and verify all mounting screws.')],
trim:[
step('Measure and plan the joints','Identify inside corners, outside corners and straight runs. Check the actual corner angles and mark each piece.','Walls are not always square; test the fit with offcuts.'),
step('Cut and dry-fit','Secure the trim in your miter box or use a suitable saw according to its instructions. Dry-fit each joint before installation.','Leave labels on the back so similar pieces do not get mixed up.'),
step('Fasten to suitable backing','Check for concealed wiring and pipes, then use an appropriate fixing method for the trim and substrate.','Confirm fastener length before driving it.'),
step('Fill and finish','Fill visible holes with a compatible filler, prepare the surface and apply the finish.','Inspect joints in daylight before the final coat.')],
planter:[
step('Choose an outdoor design','Use an exterior planter design that accounts for wet soil loads and drainage. Select timber and hardware suitable for the intended use.','MDF is not suitable for this outdoor project.'),
step('Cut and prepare the timber','Measure and cut the pieces with supported work and appropriate dust controls. Follow any timber-treatment handling instructions.','Sort the pieces before assembly to keep the best faces visible.'),
step('Assemble and provide drainage','Follow the design’s joint and drainage details. Use corrosion-resistant fasteners compatible with the timber.','Standing water shortens the life of the planter.'),
step('Finish and position','Use a suitable exterior finish if required, let it cure, and place the planter on a stable surface that can support the filled weight.','Check suitability of materials and liners if you plan to grow food.')],
pegboard:[
step('Plan the panel and the load','Lay out your tools and check the panel and hook ratings. Mark a position with comfortable access.','Leave room for the tools you use most often.'),
step('Find the mounting structure','Identify the wall substrate and concealed services. Choose suitable fasteners and backing for the complete load.','Heavy tool storage should not rely on unsuitable drywall fixings.'),
step('Mount with rear clearance','Install the spacers or frame required by the panel system. Level and secure the panel following its instructions.','Hooks need space behind the panel to engage properly.'),
step('Arrange and check the tools','Fit compatible hooks, check their engagement, and add tools within the system’s load limits.','Put heavier tools lower down and keep sharp edges protected.')],
'paint-cabinets':[
step('Check the surface and coating','Identify the cabinet material and existing finish. Check the new coating system’s compatibility and any testing needed before sanding old paint.','Try the full coating system on a hidden area first.'),
step('Remove hardware and clean','Label doors and hardware, protect the surrounding area, and clean the surfaces with a compatible cleaner as directed.','Keep hardware for each door in a labeled container.'),
step('Prepare and prime','Follow the coating manufacturer’s sanding and priming instructions. Collect dust and use the required protection and ventilation.','Bare MDF edges and previously coated faces may need different preparation.'),
step('Paint and allow curing','Apply the specified coats and respect the recoat and cure times. Refit the hardware and adjust the doors once the finish is ready.','A light coat applied correctly is easier to control than a heavy coat.')]
};
export const materialTips={mdf:'MDF edges absorb finish readily. Plan for a compatible edge-sealing system and effective dust collection.',plywood:'Check the face veneer before sanding. Use a test cut to assess tear-out and decide whether exposed edges need banding.',solid:'Allow for wood movement in the design. Check that the timber is suitable for the project and its environment.'};
