import React from "react";
import initialData from './initial_data.js';
import { Line } from 'react-lineto';
import { completedVertex } from './completed.js';
import nextVertexTable from './vertex-table.js';
import "./style.css";

class App extends React.Component {
  // Initialize the state with structures representing 147 colors, useful palettes,
  // and an array of active palette IDs.

  state = initialData;

  rotateVerts = (vArray, n) => {
    var tempArr = [];
    for (var i = 0; i < 4; i++) {
      tempArr[i] = vArray[(i+n)%4];
    }
    for (i = 0; i < 4; i++) {
      vArray[i] = tempArr[i];
    }
  }

  adjustAngle = (angle) => {
    // Angle is in degrees between -180 and +180.
    // For the purposes of this app, we probably don't need to do this,
    // but it will help to debug to have the angle be what we think it should be.
    if (angle < -180) {
      return angle + 360;
    }
    if (angle > 180) {
      return angle - 360;
    }
    return angle;
  }

  expandBoundingBox = (x, y, bbox) => {
    if (x < bbox.xMin) {
      bbox.xMin = x;
    }
    else if (x > bbox.xMax) {
      bbox.xMax = x;
    }
    if (y < bbox.yMin) {
      bbox.yMin = y;
    }
    else if (y > bbox.yMax) {
      bbox.yMax = y;
    }
  }
  
  dump = () => {
    // For debugging.
    for (var i = 0; i < this.state.lines.length; i++) {
      console.log("edge", i, ":", this.state.lines[i]);
    }
    for (i = 0; i < this.state.points.length; i++) {
      console.log("point", i, ":", this.state.points[i]);
    }
  }

  /* TODO:

  addFat = () => {
    add one fat tile
    traverse the outside of the tiling looking for incomplete vertices, until there are no more.
  }

  addSkinny = () => {
    add one skinny tile.
    traverse the outside of the tiling looking for incomplete vertices, until there are no more.
  }
  */

  addFat = () => {
    // We're going to add a tile. This means at most adding three edges and two points.
    // Sometimes the new tile completes one or more vertices.
    // In this case we only create some edges and reassign the topology of others.

    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    var line = lineArray[this.state.selectedEdge];

    // The "vertex" is a string of letters that represent the specific tile angles at a point.
    var vertInfo = nextVertexTable[pointArray[line.stPoint].vertex];
    if (vertInfo === "") {
      return;
    }
    var newV0 = vertInfo.fatAdd; // Only vertices that can be expanded two ways are on the outside.
    // Default for newV0 === "E"
    var newV = ['A', 'B', 'C', 'D'];
    if (newV0 === 'B') {
      this.rotateVerts(newV, 1);
    }
    else if (newV0 === "C") {
      this.rotateVerts(newV, 2);
    }
    else if (newV0 === "D") {
      this.rotateVerts(newV, 3);
    }
    var newSelectedEdge = this.addTile(lineArray, pointArray, this.state.selectedEdge, newV, newBBox);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newSelectedEdge,
    }
    this.setState(newState);
  }

  addSkinny = () => {
    // We're going to add a tile. This means at most adding three edges and two points.
    // Sometimes the new tile completes one or more vertices.
    // In this case we only create some edges and reassign the topology of others.

    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    var line = lineArray[this.state.selectedEdge];

    // The "vertex" is a string of letters that represent the specific tile angles at a point.
    var vertInfo = nextVertexTable[pointArray[line.stPoint].vertex];
    var newV0 = vertInfo.skinnyAdd; // Only vertices that can be expanded two ways are on the outside.
    // Default for newV0 === "E"
    var newV = ['E', 'F', 'G', 'H'];
    if (newV0 === 'F') {
      this.rotateVerts(newV, 1);
    }
    else if (newV0 === "G") {
      this.rotateVerts(newV, 2);
    }
    else if (newV0 === "H") {
      this.rotateVerts(newV, 3);
    }
    var newSelectedEdge = this.addTile(lineArray, pointArray, this.state.selectedEdge, newV, newBBox);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newSelectedEdge,
    }
    this.setState(newState);
  }

  prependVertex = (tileVertex, pointIndex, pointArray) => {
    var newVertex = tileVertex + pointArray[pointIndex].vertex;
    pointArray[pointIndex].vertex = newVertex;
    return completedVertex.indexOf(newVertex);
  }

  appendVertex = (tileVertex, pointIndex, pointArray) => {
    var newVertex = pointArray[pointIndex].vertex + tileVertex;
    pointArray[pointIndex].vertex = newVertex;
    return completedVertex.indexOf(newVertex);
  }

  addTile = (lineArray, pointArray, selectedEdge, newV, newBBox) => {
    // Top level: Examine vertex data to see what will happen to tiling
    // when we add the tile represented by the four vertices in newV.
    // Then update the vertices at this level before adding points and edges.
    // This is because whether or not adding the tile completes a vertex
    // determines how many new points and edges have to be created.
    // Output is new and modified geometry in the input arrays.

    var newSelectedEdge = -1;
    var line = lineArray[selectedEdge];

    // Modify the vertex descriptors at the start and end of the line.

    var v0Complete = this.appendVertex(newV[0], line.stPoint, pointArray);
    var v1Complete = this.prependVertex(newV[3], line.enPoint, pointArray);

    if (v0Complete === -1) {
      // Angle at start point will not close off a vertex.
      if (v1Complete === -1) {
        // Add tile with three edges.
        newSelectedEdge = this.addTileThreeEdges(lineArray, pointArray, selectedEdge, newV, newBBox);
      }
      else {
        // Look at the next edge.
        var nextSelLine = lineArray[line.nextLine];
        var isNextComplete = this.prependVertex(newV[2], nextSelLine.enPoint, pointArray);
        if (isNextComplete === -1) {
          // Add tile with two edges to selected edge.
          newSelectedEdge = this.addTileTwoEdges(lineArray, pointArray, selectedEdge, newV, newBBox)
        }
        else {
          // We will close a gap by connecting three existing edges with a new line.
          // First make sure the vertex at the far end is updated.
          var nextNextLine = lineArray[nextSelLine.nextLine];
          var nextNextComplete = this.prependVertex(newV[1], nextNextLine.enPoint, pointArray);
          if (nextNextComplete === -1) {
            // Make sure the "selected edge" is the one in the middle. New line will have the same angle.
            newSelectedEdge = this.addTileOneEdge(lineArray, line.nextLine);
          }
          // If nextNextComplete is >= 0 then we have some kind of hole,
          // in which case start vertex (0) should also be complete. So likely a bug.
        }
      }
    }
    else {
      // Back up one edge. First append newV[1] to previous start point.
      var prevSelLine = lineArray[line.prevLine];
      var completedIndex = this.appendVertex(newV[1], prevSelLine.stPoint, pointArray);

      if (completedIndex === -1) {
        // Previous edge will be new "selected" edge.
        if (v1Complete === -1) {
          this.rotateVerts(newV, 1);
          newSelectedEdge = this.addTileTwoEdges(lineArray, pointArray, line.prevLine, newV, newBBox);
        }
        else {
          // Move to next edge.
          // Add newV[2] to endpoint of next edge.
          completedIndex = this.prependVertex(newV[2], lineArray[line.nextLine].enPoint, pointArray);
          if (completedIndex === -1) {
            // Add tile with one edge. Middle edge is the one that was selected.
            newSelectedEdge = this.addTileOneEdge(lineArray, selectedEdge);
          }
          // Again, three completed edges would be a problem.
        }
      }
      else {
        // We've found two completed vertices.
        var prevPrevLine = lineArray[prevSelLine.prevLine];
        var prevPrevComplete = this.appendVertex(newV[2], prevPrevLine.stPoint, pointArray);
        if (prevPrevComplete === -1) {
          // Middle edge is the previous to selected edge.
          newSelectedEdge = this.addTileOneEdge(lineArray, line.prevLine);
        }
        // The else here is the same problem.
      }
    }
    return newSelectedEdge;
  }

  tileAngle = (vertex) => {
    if (vertex === "A" || vertex === "C")
      return 72;
    else if (vertex === "B" || vertex === "D")
      return 108;
    else if (vertex === "E" || vertex === "G")
      return 144;
    else // (vertex === "F" || vertex === "H")
      return 36;
  }

  addTileThreeEdges = (lines, points, selectedLineInd, newVerts, newBBox) => {
    // lines: array of lines, copy, to be modified.
    // points: array of points copy, to be modified.
    // newVerts: The letters corresponding to the four corners of the new tile.
    // newBBox: bounding box copy, to be modified.

    // The three new lines, in order from start to end, are newStLine, newMidLine, and newEnLine.
  
    var line = lines[selectedLineInd];

    // Compute the angle of the new start line.
    var newStLineAngle = this.adjustAngle(line.angle + this.tileAngle(newVerts[0]));
    var xOffset = Math.cos(newStLineAngle * Math.PI / 180);
    var yOffset = Math.sin(newStLineAngle * Math.PI / 180);

    // Add a line with a new endpoint.
    var newStPoint = { ...points[line.stPoint] };
    newStPoint.x += xOffset;
    newStPoint.y += yOffset;
    newStPoint.vertex = newVerts[1];
    var newStPointIndex = points.length;
    points.push(newStPoint);
    this.expandBoundingBox(newStPoint.x, newStPoint.y, newBBox);

    var newStLine = { ...line };
    newStLine.angle = newStLineAngle;
    newStLine.enPoint = newStPointIndex;  // Start is the same as selected line.
    var newStLineIndex = lines.length;
    lines.push(newStLine);

    // End edge of new tile has a new start point.
    var newEnPoint = { ...points[line.enPoint] };
    newEnPoint.x += xOffset;
    newEnPoint.y += yOffset;
    newEnPoint.vertex = newVerts[2];
    var newEnPointIndex = points.length;
    points.push(newEnPoint);
    this.expandBoundingBox(newEnPoint.x, newEnPoint.y, newBBox);

    var newEnLine = { ...line };
    newEnLine.angle = this.adjustAngle(newStLineAngle + 180);
    newEnLine.stPoint = newEnPointIndex;  // End is the same as selected line.
    var newEnLineIndex = lines.length;
    lines.push(newEnLine);

    // Now the middle edge. Make it the new "selected" edge.
    var newMidLine = { ...line }; // angle is the same.
    newMidLine.stPoint = newStPointIndex;
    newMidLine.enPoint = newEnPointIndex;
    var newSelectedEdge = lines.length;
    lines.push(newMidLine);

    // Link all the lines in order.
    lines[line.prevLine].nextLine = newStLineIndex;
    lines[newStLineIndex].nextLine = newSelectedEdge;
    lines[newSelectedEdge].nextLine = newEnLineIndex;
    // End line points to same next line as selected edge.

    lines[line.nextLine].prevLine = newEnLineIndex;
    lines[newEnLineIndex].prevLine = newSelectedEdge;
    lines[newSelectedEdge].prevLine = newStLineIndex;
    // Start line has same previous edge as selected edge.

    return newSelectedEdge;
  }

  addTileTwoEdges = (lines, points, selectedLineInd, newVerts, newBBox) => {
    // lines: array of lines, copy, to be modified.
    // points: array of points copy, to be modified.
    // newVerts: The letters corresponding to the four corners of the new tile.
    // newBBox: bounding box copy, to be modified.

    // The two new lines, in order from start to end, are newStLine and newMidLine.
    // To avoid extra code, calls are set up so that we never have newMidLine and newEnLine only.

    var line = lines[selectedLineInd];

    // Compute the angle of the new start line.
    var newStLineAngle = this.adjustAngle(line.angle + this.tileAngle(newVerts[0]));
    var xOffset = Math.cos(newStLineAngle * Math.PI / 180);
    var yOffset = Math.sin(newStLineAngle * Math.PI / 180);

    // Add a line with a new endpoint, and point previous edge to it.
    var newStPoint = { ...points[line.stPoint] };
    newStPoint.x += xOffset;
    newStPoint.y += yOffset;
    newStPoint.vertex = newVerts[1];
    var newStPointIndex = points.length;
    points.push(newStPoint);
    this.expandBoundingBox(newStPoint.x, newStPoint.y, newBBox);

    var newStLine = { ...line };
    newStLine.angle = newStLineAngle;
    newStLine.enPoint = newStPointIndex;  // Start is the same as selected line.
    var newStLineIndex = lines.length;
    lines.push(newStLine);

    // The new middle edge will connect to the end of the selected edge's next edge.
    var selNextLine = lines[line.nextLine];

    var newMidLine = { ...line }; // angle is the same.
    newMidLine.stPoint = newStPointIndex;
    newMidLine.enPoint = selNextLine.enPoint;
    var newMidLineIndex = lines.length;
    lines.push(newMidLine);

    // Connect the lines in order.
    lines[line.prevLine].nextLine = newStLineIndex;
    lines[newStLineIndex].nextLine = newMidLineIndex;
    lines[newMidLineIndex].nextLine = selNextLine.nextLine;

    // Start line previous is the same as selected line previous.
    lines[newMidLineIndex].prevLine = newStLineIndex;
    lines[selNextLine.nextLine].prevLine = newMidLineIndex;

    return newMidLineIndex;
  }

  addTileOneEdge = (lines, selectedLineInd) => {
    // lines: array of lines, copy, to be modified.
    // Three existing lines will be joined by a fourth.
    // No points will be added and bounding box will stay the same.
    // Make sure "selectedLineInd" is the index of the middle of the three lines.

    var line = lines[selectedLineInd];
    var prevLine = lines[line.prevLine];
    var nextLine = lines[line.nextLine];

    var newLineIndex = lines.length;

    var newLine = { ...line }; // angle is the same.

    newLine.stPoint = prevLine.stPoint;
    newLine.enPoint = nextLine.enPoint;

    newLine.prevLine = prevLine.prevLine;
    newLine.nextLine = nextLine.nextLine;
    lines[prevLine.prevLine].nextLine = newLineIndex;
    lines[nextLine.nextLine].prevLine = newLineIndex;

    lines.push(newLine);

    return newLineIndex;
  }

  moveSelection = () => {
    var newSelectedEdge = this.state.lines[this.state.selectedEdge].nextLine;
    this.setState( {selectedEdge: newSelectedEdge} );
  }

  renderLine = (line, index) => {
    // Todo: calculate transform in advance, accurately.
    // (0,0) is upper left of screen, and y points down.
    // var width = window.innerWidth;
    var scale = 400 / ( this.state.boundingBox.xMax -
                        this.state.boundingBox.xMin );
    // For now scale to 100px and offset 100px in from origin.
    var xOffset = 50 - scale * this.state.boundingBox.xMin;
    var yOffset = 150 - scale * this.state.boundingBox.yMin;

    var x0t = scale * this.state.points[line.stPoint].x + xOffset;
    var x1t = scale * this.state.points[line.enPoint].x + xOffset;
    var y0t = scale * this.state.points[line.stPoint].y + yOffset;
    var y1t = scale * this.state.points[line.enPoint].y + yOffset;
    
    var lineColor = "lime";
    if (index === this.state.selectedEdge) lineColor = "white";

    return(
      <Line key={index.toString()} x0={x0t} y0={y0t} x1={x1t} y1={y1t} borderWidth={2} borderColor={lineColor}/>
    );
  }

  render() {
    return (
      <div className="App">
        <button className="SortButton" onClick={this.moveSelection}>
          Move Selection
        </button>
        <button className="SortButton" onClick={this.addFat}>
          Add Fat Tile
        </button>
        <button className="SortButton" onClick={this.addSkinny}>
          Add Skinny Tile
        </button>
        <header className="App-header">
          <p>
            Penrose Sandbox
          </p>
        </header>
        <div>
          { this.state.lines.map(this.renderLine) }
        </div>

      </div>
    );
  }
}

export default App;
