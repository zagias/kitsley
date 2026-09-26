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
export const designOperationInstructions=` designOperation is null unless the user explicitly requests a change to the WHOLE existing supported bookcase. For that builder, supply only changed canonical millimetre values, shelf count or supported material/core; all other fields are null. Never reinterpret one shelf, a tapered/stepped shape, a custom joint or a different intended use as a whole-design dimension change. It is a proposal; Kitsley will compile and validate it and the user must review it before application. Unsupported designs belong in technicalAssessment, never invented operations.`;

