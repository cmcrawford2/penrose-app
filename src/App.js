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

  checkVertex = (vertex) => {
    var allowedVerts =
      ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'AA', 'AF', 'BD', 'BH',
        'CC', 'CG', 'DB', 'DE', 'EB', 'FD', 'FH', 'GC', 'GG', 'HA',
        'AAA', 'AAF', 'AFD', 'AFH', 'BHA', 'CCC', 'CCG', 'CGC', 'DBH', 'FDB', 'FHA', 'GCC', 'HAA', 'HAF',
        'AAAA', 'AAAF', 'AAFH', 'AFDB', 'AFHA', 'BHAF', 'CCCC', 'DBHA', 'FDBH', 'FHAA', 'FHAF', 'HAAA', 'HAAF', 'HAFD', 'HAFH',
        'AAAAF', 'AAAFH', 'AAFHA', 'AFHAA', 'AFHAF', 'FHAAA', 'FHAAF', 'FHAFH', 'HAAAA', 'HAAFH', 'HAFHA',
        'AAFHAF', 'AFHAAF', 'AFHAFH', 'FHAAFH', 'FHAFHA', 'HAAFHA', 'HAFHAA'];
    if ((allowedVerts.indexOf(vertex) === -1) && (completedVertex.indexOf(vertex) === -1)) {
      return true; // error
    }
    return false;
  }

  checkIntegrity = (points) => {
    var error = false;
    for (var i = 0; i < points.length; i++) {
      error = this.checkVertex(points[i].vertex);
      if (error === true) break;
    }
    return error;
  }

  addFatOrSkinny = (startId, vertexLetter, lines, points, BBox) => {
    if (("ABCD").indexOf(vertexLetter) > -1) {
      return this.addFatTile(startId, lines, points, BBox);
    }
    return this.addSkinnyTile(startId, lines, points, BBox);
  }

  traverseTiling = (startEdgeId, lineArray, pointArray, newBBox) => {
    // Check the start point of the start edge for incompleteness.
    var startEdge = lineArray[startEdgeId];

    // First check that the vertex isn't corrupted.
    // Given the vertex nature of the algorithm, This is an inevitable possibility.
    var startVertex = pointArray[startEdge.stPoint].vertex;
    var error = this.checkVertex(startVertex);
    if (error === true) {
      // TODO: don't do this.
      return startEdge.nextEdge;
    }

    var vertInfo = nextVertexTable[startVertex];
    if (vertInfo.next !== "") {
      return this.addFatOrSkinny(startEdgeId, vertInfo.next, lineArray, pointArray, newBBox);
    }
    else if (pointArray[startEdge.enPoint].vertex === "HAA") {
      // Special case where we always have to prepend "F" corner. There is only one such case.
      // Other vertices also have mandatory prepend corners, but also mandatory append, so table is enough.
      return this.addSkinnyTile(startEdgeId, lineArray, pointArray, newBBox);
    }
    // Go around the perimeter looking for incomplete vertices.
    var nextEdgeId = startEdge.nextLine;
    while (nextEdgeId !== startEdgeId) {
      var nextEdge = lineArray[nextEdgeId];
      startVertex = pointArray[nextEdge.stPoint].vertex;
      error = this.checkVertex(startVertex);
      if (error === false) {
        vertInfo = nextVertexTable[startVertex];
        if (vertInfo.next !== "") {
          return this.addFatOrSkinny(nextEdgeId, vertInfo.next, lineArray, pointArray, newBBox);
        }
        else if (pointArray[nextEdge.enPoint].vertex === "HAA") {
          return this.addSkinnyTile(nextEdgeId, lineArray, pointArray, newBBox);
        }
      }
      nextEdgeId = nextEdge.nextLine;
    }
    // IF we finish the while loop, we didn't find a vertex to complete.
    return startEdgeId;
  }

  // For debugging. Disable traversal in addFat and addSkinny, and add a button.
  traverseOnce = () => {
    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };

    var newTraverseEdge = this.traverseTiling(selectedId, lineArray, pointArray, newBBox);

    var error = this.checkIntegrity(pointArray);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newTraverseEdge,
      errorCondition: error,
    }
    this.setState(newState);
  }

  traverse20 = () => {
    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };

    for (var i = 0; i < 20; i++) {
      var newTraverseEdge = this.traverseTiling(selectedId, lineArray, pointArray, newBBox);
      if (newTraverseEdge === selectedId) {
        break;
      }
      selectedId = newTraverseEdge;
    }
    var error = this.checkIntegrity(pointArray);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newTraverseEdge,
      errorCondition: error,
    }
    this.setState(newState);
  }

  addFat = () => {
    // add one fat tile and modify copies of state data

    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };

    var newSelectedEdge = this.addFatTile(selectedId, lineArray, pointArray, newBBox);
    if (newSelectedEdge === -1) return;

    // traverse the outside of the tiling looking for incomplete vertices, until there are no more.
    if (!this.state.oneTileOnly) {
      var newTraverseEdge = this.traverseTiling(newSelectedEdge, lineArray, pointArray, newBBox);
      while (newTraverseEdge !== newSelectedEdge) {
        newSelectedEdge = newTraverseEdge;
        newTraverseEdge = this.traverseTiling(newSelectedEdge, lineArray, pointArray, newBBox);
        // For debugging
        // console.log(newTraverseEdge, lineArray[newTraverseEdge]);
        var error = this.checkIntegrity(pointArray);
        if (error === true) {
          break;
        }
      }
    }

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newSelectedEdge,
      errorCondition: error,
    }
    this.setState(newState);
  }

  addSkinny = () => {
    // add one skinny tile and modify copies of state data

    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines];  // We will add lines and modify existing.
    var pointArray = [...this.state.points];  // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };

    var newSelectedEdge = this.addSkinnyTile(selectedId, lineArray, pointArray, newBBox);
    if (newSelectedEdge === -1) return;

    // traverse the outside of the tiling looking for incomplete vertices, until there are no more.
    if (!this.state.oneTileOnly) {
      var newTraverseEdge = this.traverseTiling(newSelectedEdge, lineArray, pointArray, newBBox);
      while (newTraverseEdge !== newSelectedEdge) {
        newSelectedEdge = newTraverseEdge;
        newTraverseEdge = this.traverseTiling(newSelectedEdge, lineArray, pointArray, newBBox);
        // For debugging
        // console.log(newTraverseEdge, lineArray[newTraverseEdge]);
        var error = this.checkIntegrity(pointArray);
        if (error === true) {
          break;
        }
      }
    }

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newSelectedEdge,
      errorCondition: error,
    }
    this.setState(newState);
  }

  addFatTile = (selectedId, lineArray, pointArray, newBBox) => {
    // We're going to add a tile. This means at most adding three edges and two points.
    // Sometimes the new tile completes one or more vertices.
    // In this case we only create some edges and reassign the topology of others.

    var line = lineArray[selectedId];

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
    return this.addTile(lineArray, pointArray, selectedId, newV, newBBox);
  }

  addSkinnyTile = (selectedId, lineArray, pointArray, newBBox) => {
    // We're going to add a tile. This means at most adding three edges and two points.
    // Sometimes the new tile completes one or more vertices.
    // In this case we only create some edges and reassign the topology of others.

    var line = lineArray[selectedId];

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
    return this.addTile(lineArray, pointArray, selectedId, newV, newBBox);
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
      else {  // End point vertex is completed by this tile.
        // Look at the next edge.
        var nextSelLine = lineArray[line.nextLine];
        var nextComplete = this.prependVertex(newV[2], nextSelLine.enPoint, pointArray);
        if (nextComplete === -1) {
          // Add tile with two edges to selected edge.
          newSelectedEdge = this.addTileTwoEdges(lineArray, pointArray, selectedEdge, newV, newBBox)
        }
        else {
          // Update the vertex at the far end.
          var nextNextLine = lineArray[nextSelLine.nextLine];
          var nextNextComplete = this.prependVertex(newV[1], nextNextLine.enPoint, pointArray);
          if (nextNextComplete === -1) {
            // Just close a gap between two vertices.
            // Make sure the "selected edge" is the one in the middle. New line will have the same angle.
            newSelectedEdge = this.addTileOneEdge(lineArray, line.nextLine);
          }
          else {
            // If nextNextComplete is >= 0 then we have some kind of hole.
            // Two points have landed in the same place from different directions.
            // Close off the hole by joining two lines together and merging the points that touch.
            var joinStId = line.prevLine;
            var joinEnId = lineArray[nextNextLine.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(joinStId, joinEnId, lineArray, pointArray);
          }
        }
      }
    }
    else {
      // Vertex at the start of the edge is completed by this tile.
      // Back up one edge. First append newV[1] to previous start point.
      var prevSelLine = lineArray[line.prevLine];
      var prevComplete = this.appendVertex(newV[1], prevSelLine.stPoint, pointArray);

      if (prevComplete === -1) {
        if (v1Complete === -1) {
          // Previous edge will be new "selected" edge.
          this.rotateVerts(newV, 1);
          newSelectedEdge = this.addTileTwoEdges(lineArray, pointArray, line.prevLine, newV, newBBox);
        }
        else {
          // Look ahead to the next vertex.
          // Add newV[2] to endpoint of next edge.
          nextSelLine = lineArray[line.nextLine];
          nextComplete = this.prependVertex(newV[2], nextSelLine.enPoint, pointArray);
          if (nextComplete === -1) {
            // Add tile with one edge. Middle edge is the one that was selected.
            newSelectedEdge = this.addTileOneEdge(lineArray, selectedEdge);
          }
          else {
            // Two points have landed in the same place from different directions. We have a hole.
            // Close off the hole by joining two lines together and merging the points that touch.
            joinStId = prevSelLine.prevLine;
            joinEnId = lineArray[nextSelLine.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(joinStId, joinEnId, lineArray, pointArray);
          }
        }
      }
      else {
        // previous vertex is also complete.
        // Go back one more edge.
        var prevPrevLine = lineArray[prevSelLine.prevLine];
        var prevPrevComplete = this.appendVertex(newV[2], prevPrevLine.stPoint, pointArray);
        if (prevPrevComplete === -1) {
          if (v1Complete === -1) {
            // Add tile with one edge. Middle edge is the previous edge.
            newSelectedEdge = this.addTileOneEdge(lineArray, line.prevLine);
          }
          else {
            // We have a hole. The vertex at start of prevPrev touches the vertex at end of line.next.
            joinStId = prevPrevLine.prevLine;
            joinEnId = lineArray[line.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(joinStId, joinEnId, lineArray, pointArray);
          }
        }
        else {
          // Final case of hole. Start vertex of edge previous to prevPrev touches the vertex at end of line.
          joinStId = lineArray[prevPrevLine.prevLine].prevLine;
          joinEnId = line.nextLine;
          newSelectedEdge = this.mergeEndPoints(joinStId, joinEnId, lineArray, pointArray);
        }
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

  mergeEndPoints(stEdgeId, enEdgeId, lineArray, pointArray) {
    // We have encountered two points that are the same. Merge them to close the hole.
    // First connect the lines that are outside of the hole.
    lineArray[stEdgeId].nextLine = enEdgeId;
    lineArray[enEdgeId].prevLine = stEdgeId;

    // The vertex at the end was not modified by the calling function.
    // So we can just add them together.

    var stEdge = lineArray[stEdgeId];
    var enEdge = lineArray[enEdgeId];
    var newVertex = pointArray[stEdge.enPoint].vertex + pointArray[enEdge.stPoint].vertex;

    // Use the end point of the start edge as the connecting point.
    // We don't need to update removed point vertex because we only look at vertices on the outside of the tiling.
    pointArray[stEdge.enPoint].vertex = newVertex;
    lineArray[enEdgeId].stPoint = stEdge.enPoint;

    return enEdgeId;
  }

  moveSelection = () => {
    var newSelectedEdge = this.state.lines[this.state.selectedEdge].nextLine;
    this.setState( {selectedEdge: newSelectedEdge} );
  }

  renderLine = (line, index) => {
    // Todo: calculate transform in advance, accurately.
    // (0,0) is upper left of screen, and y points down.
    // var width = window.innerWidth;
    var xmin = this.state.boundingBox.xMin;
    var ymin = this.state.boundingBox.yMin;
    var xmax = this.state.boundingBox.xMax;
    var ymax = this.state.boundingBox.yMax;

    // The oscilloscope image background is 690x600 pixels with a 54 pixel margin.

    var yscale = 400 / (ymax - ymin);
    var xscale = 490 / (xmax - xmin);

    var scale = (xscale < yscale) ? xscale : yscale;

    var xOffset = 348 - 0.5 * scale * (xmin + xmax);
    var yOffset = 290 - 0.5 * scale * (ymin + ymax);

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

  toggleOneOnly = () => {
    this.setState({oneTileOnly: !this.state.oneTileOnly});
  }

  render() {
    return (
      <div className="App">
        <div>
          {this.state.lines.map(this.renderLine)}
        </div>
        <div className="App-container">
          <div className="Penrose-background">
            <img src="/oscilloscope.jpeg" alt="Oscilloscope"/>
          </div>
          <div className="Button-column">
            <h1>Penrose Laboratory</h1>
            <p>A Penrose tiling consists of wide and narrow diamonds. "Add" buttons attach a tile to the white line and fill in the tiling. "Move selection" moves the white line around the perimeter. "Toggle Auto-fill" disables automatic completion and provides more options. Start over by refreshing the browser page.</p>
            <div className="Button-box">
              <button className="SortButton" onClick={this.addFat}>
                Add Wide Tile
              </button>
              <button className="SortButton" onClick={this.addSkinny}>
                Add Narrow Tile
              </button>
            </div>
            <div className="Button-box">
              <button className="SortButton" onClick={this.moveSelection}>
                Move Selection
              </button>
              <button className="SortButton" onClick={this.toggleOneOnly}>
                Toggle Auto-fill
              </button>
            </div>
            { this.state.oneTileOnly === true &&
              <div className="Button-box">
                <button className="SortButton" onClick={this.traverse20}>
                  Traverse 20
                </button>
                <button className="SortButton" onClick={this.traverseOnce}>
                  Traverse Once
                </button>
              </div> }
          </div>
        </div>
        <div className="About-container">
          <h2>About Penrose Laboratory</h2>
          <p>Roger Penrose discovered a way to tile the infinite plane with pentagonal symmetry. The tiling can be expanded indefinitely, but it never repeats. The <a href="https://en.wikipedia.org/wiki/Penrose_tiling">Wikipedia article on Penrose tiles</a> is a good source of information. In my version, two diamonds are fitted together according to certain rules. These rules only allow eight different vertex configurations. After a tile is added, the code traverses the perimeter of the tiling, using a lookup table to find vertices that demand the addition of a specific tile. You can see how this works by disabling auto-fill and traversing the boundary one tile at a time.</p>
          <p>One of the properties of this way of tiling is that legal local modifications may create an illegal tiling at a distant location. You can see this effect by adding a narrow tile to the default white edge six times in a row. Then toggle auto-fill and force the program to traverse the perimeter until the flawed tiling is complete.</p>
          <p>You can also create your own illegal tilings by disabling auto-fill and adding tiles one by one.</p>
          <h2>Why is the tiling displayed on an oscilloscope?</h2>
          <p>I built a computer using a Motorola 68008 microprocessor in Tom Hayes' digital electronics class at the Harvard Extension school in 1997 (pictured below). Once I had the thing wired up properly, I programmed it in machine language to draw Penrose tiles on an oscilloscope, with a user interface consisting of the four buttons on the lower right. Later I refined the program using an assembly language interface that downloaded the code onto a RAM chip. The four buttons reset the display to a wide diamond, allowed the user to select an edge on the perimeter of the tiling, and added a wide or narrow diamond to the selected edge. Then the code filled in all the tiles that were determined by the rules. The program was basically a loop that drew a bunch of lines over and over, while the user buttons triggered interrupts and changed the data. My computer was so awesome that it achieved immortality, meaning I didn't have to disassemble it when the class was over.</p>
          <p>One of the best books I have ever read is <a href="https://secondkindofimpossible.org/">"The Second Kind of Impossible"</a> by Paul Steinhardt. He and others investigated the possibility of a physical crystalline structure based on Penrose tiles. The book describes how he and his collaborators then managed to actually find such a crystal in the far reaches of Siberia. You HAVE to read it.</p>
          <div>
            <img class="Computer-image" src="/breadboard-computer.jpeg" alt="Breadboard Computer" />
          </div>
          <p>Created by Cris Crawford</p>
          <p>This program is written in Javascript React using the same algorithm as the one I wrote 23 years ago. Lines are drawn using the open source react-lineto package.</p>
          <p>Oscilloscope image by Elborgo - Own work, CC BY 3.0, https://commons.wikimedia.org/w/index.php?curid=2841283</p>
        </div>
      </div>
    );
  }
}

export default App;


/*


         */