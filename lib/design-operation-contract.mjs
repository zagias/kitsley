const keys=['width','height','depth','thickness','shelves','material','edgeThickness'];
export const designOperationSchema={
  "anyOf": [
    {
      "type": "null"
    },
    {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "builder",
        "target",
        "changes",
        "reason"
      ],
      "properties": {
        "builder": {
          "type": "string",
          "enum": [
            "bookcase.uniform-panels.v1"
          ]
        },
        "target": {
          "type": "string",
          "enum": [
            "whole-design"
          ]
        },
        "reason": {
          "type": "string"
        },
        "changes": {
          "type": "object",
          "additionalProperties": false,
          "required": [
            "width",
            "height",
            "depth",
            "thickness",
            "shelves",
            "material",
            "edgeThickness"
          ],
          "properties": {
            "width": {
              "type": [
                "number",
                "null"
              ]
            },
            "height": {
              "type": [
                "number",
                "null"
              ]
            },
            "depth": {
              "type": [
                "number",
                "null"
              ]
            },
            "thickness": {
              "type": [
                "number",
                "null"
              ]
            },
            "shelves": {
              "type": [
                "number",
                "null"
              ]
            },
            "material": {
              "type": [
                "string",
                "null"
              ],
              "enum": [
                "plywood",
                "mdf",
                "melamine-mdf",
                "melamine-particleboard",
                null
              ]
            },
            "edgeThickness": {
              "type": [
                "number",
                "null"
              ]
            }
          }
        }
      }
    }
  ]
};
// Extend the strict contract: omitted changes are null, never guessed.
const operation=designOperationSchema.anyOf[1];
operation.properties.builder.enum.push('bookcase.recessed-shelves.v1');
operation.properties.target.enum.push('interior-shelves');
operation.properties.changes.required.push('shelfInsets');
operation.properties.changes.properties.shelfInsets={type:['array','null'],items:{type:'number'}};
export const designOperationInstructions=` designOperation is null unless the user explicitly requests a supported change. Whole-design changes use bookcase.uniform-panels.v1 and target whole-design. Individual INTERIOR shelf DEPTH changes use bookcase.recessed-shelves.v1 and target interior-shelves, and change ONLY shelfInsets: one millimetre front setback per interior shelf, ordered bottom to top. All back edges remain aligned; core depth must remain at least 150 mm. Include unchanged shelf setbacks in that array. Never interpret ambiguous "narrower" as depth, or a top panel as an interior shelf: ask first. Never narrow an individual shelf width, invent joints, taper panels or change the intended use. When changing shelf count on a custom design, supply the corresponding shelfInsets array. Other change fields are null. This is a proposal; Kitsley validates and shows a review before application. Unsupported designs belong in technicalAssessment, never invented operations.`;
