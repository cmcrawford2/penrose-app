const initialData = {

  // User will be able to change selected edge by moving around the perimeter.
  selectedEdge: 1,

  // For debugging, we add a button that changes oneTileOnly to true.

  oneTileOnly: false,

  errorCondition: false,  // TODO: Expand this to be great.

  // Start with the four points of a fat tile.
  // Coordinates will not change, but the vertex will change when more tiles are added.
  // The start and end lines are for open vertices only.
  // They are clockwise around the inside of the pattern.
  points: [
    { vertex: "A", x: 0.0, y: 0.0 },
    { vertex: "B", x: -0.587785, y: 0.809017 },
    { vertex: "C", x: 0.0, y: 1.618034 },
    { vertex: "D", x: 0.587785, y: 0.809017 },
  ],

  boundingBox: {
    xMin: -0.587785,
    xMax: 0.587785,
    yMin: 0,
    yMax: 1.618034,
  },

  // "next" of line will be updated to be the next line on the outside of the pattern.
  // Start and end points will not change.
  lines: [
    { stPoint: 0, enPoint: 1, prevLine: 3, nextLine: 1, angle: 126 },
    { stPoint: 1, enPoint: 2, prevLine: 0, nextLine: 2, angle: 54 },
    { stPoint: 2, enPoint: 3, prevLine: 1, nextLine: 3, angle: -54 },
    { stPoint: 3, enPoint: 0, prevLine: 2, nextLine: 0, angle: -126 },
  ],
  
  // Todo: table of partial vertex possibilities and possible tile point additions.

  // Counterclockwise tile points of "fat" diamond are A, B, C, D.
  // A is the vertex at the two single arrows at the 72° angle, which point out. 
  // Counterclockwise tile points of "skinny" diamond are E, F, G, H.
  // E is the vertex at the two single arrows at the 108° angle, which point in.

  // The 8 allowed vertices are: AAAAA, AAAAFH, AAFHAFH, AFDBH, BDE, CCCCC, CCCG, CGG.
  // These are in clockwise order.
};

export default initialData;