import { completedVertex } from "./completed.js";
import { nextVertexTable } from "./vertex-table.js";
import { allowedVerts } from "./allowed.js";

export default class Tiling {
  addFatTile(selectedId, lineArray, pointArray, newBBox) {
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
    var newV = ["A", "B", "C", "D"];
    if (newV0 === "B") {
      this.rotateVerts(newV, 1);
    } else if (newV0 === "C") {
      this.rotateVerts(newV, 2);
    } else if (newV0 === "D") {
      this.rotateVerts(newV, 3);
    }
    return this.addTile(lineArray, pointArray, selectedId, newV, newBBox);
  }

  addSkinnyTile(selectedId, lineArray, pointArray, newBBox) {
    // We're going to add a tile. This means at most adding three edges and two points.
    // Sometimes the new tile completes one or more vertices.
    // In this case we only create some edges and reassign the topology of others.

    var line = lineArray[selectedId];

    // The "vertex" is a string of letters that represent the specific tile angles at a point.
    var vertInfo = nextVertexTable[pointArray[line.stPoint].vertex];
    var newV0 = vertInfo.skinnyAdd; // Only vertices that can be expanded two ways are on the outside.
    // Default for newV0 === "E"
    var newV = ["E", "F", "G", "H"];
    if (newV0 === "F") {
      this.rotateVerts(newV, 1);
    } else if (newV0 === "G") {
      this.rotateVerts(newV, 2);
    } else if (newV0 === "H") {
      this.rotateVerts(newV, 3);
    }
    return this.addTile(lineArray, pointArray, selectedId, newV, newBBox);
  }

  addTile(lineArray, pointArray, selectedEdge, newV, newBBox) {
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
        newSelectedEdge = this.addTileThreeEdges(
          lineArray,
          pointArray,
          selectedEdge,
          newV,
          newBBox
        );
      } else {
        // End point vertex is completed by this tile.
        // Look at the next edge.
        var nextSelLine = lineArray[line.nextLine];
        var nextComplete = this.prependVertex(
          newV[2],
          nextSelLine.enPoint,
          pointArray
        );
        if (nextComplete === -1) {
          // Add tile with two edges to selected edge.
          newSelectedEdge = this.addTileTwoEdges(
            lineArray,
            pointArray,
            selectedEdge,
            newV,
            newBBox
          );
        } else {
          // Update the vertex at the far end.
          var nextNextLine = lineArray[nextSelLine.nextLine];
          var nextNextComplete = this.prependVertex(
            newV[1],
            nextNextLine.enPoint,
            pointArray
          );
          if (nextNextComplete === -1) {
            // Just close a gap between two vertices.
            // Make sure the "selected edge" is the one in the middle. New line will have the same angle.
            newSelectedEdge = this.addTileOneEdge(lineArray, line.nextLine);
          } else {
            // If nextNextComplete is >= 0 then we have some kind of hole.
            // Two points have landed in the same place from different directions.
            // Close off the hole by joining two lines together and merging the points that touch.
            var joinStId = line.prevLine;
            var joinEnId = lineArray[nextNextLine.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(
              joinStId,
              joinEnId,
              lineArray,
              pointArray
            );
          }
        }
      }
    } else {
      // Vertex at the start of the edge is completed by this tile.
      // Back up one edge. First append newV[1] to previous start point.
      var prevSelLine = lineArray[line.prevLine];
      var prevComplete = this.appendVertex(
        newV[1],
        prevSelLine.stPoint,
        pointArray
      );

      if (prevComplete === -1) {
        if (v1Complete === -1) {
          // Previous edge will be new "selected" edge.
          this.rotateVerts(newV, 1);
          newSelectedEdge = this.addTileTwoEdges(
            lineArray,
            pointArray,
            line.prevLine,
            newV,
            newBBox
          );
        } else {
          // Look ahead to the next vertex.
          // Add newV[2] to endpoint of next edge.
          nextSelLine = lineArray[line.nextLine];
          nextComplete = this.prependVertex(
            newV[2],
            nextSelLine.enPoint,
            pointArray
          );
          if (nextComplete === -1) {
            // Add tile with one edge. Middle edge is the one that was selected.
            newSelectedEdge = this.addTileOneEdge(lineArray, selectedEdge);
          } else {
            // Two points have landed in the same place from different directions. We have a hole.
            // Close off the hole by joining two lines together and merging the points that touch.
            joinStId = prevSelLine.prevLine;
            joinEnId = lineArray[nextSelLine.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(
              joinStId,
              joinEnId,
              lineArray,
              pointArray
            );
          }
        }
      } else {
        // previous vertex is also complete.
        // Go back one more edge.
        var prevPrevLine = lineArray[prevSelLine.prevLine];
        var prevPrevComplete = this.appendVertex(
          newV[2],
          prevPrevLine.stPoint,
          pointArray
        );
        if (prevPrevComplete === -1) {
          if (v1Complete === -1) {
            // Add tile with one edge. Middle edge is the previous edge.
            newSelectedEdge = this.addTileOneEdge(lineArray, line.prevLine);
          } else {
            // We have a hole. The vertex at start of prevPrev touches the vertex at end of line.next.
            joinStId = prevPrevLine.prevLine;
            joinEnId = lineArray[line.nextLine].nextLine;
            newSelectedEdge = this.mergeEndPoints(
              joinStId,
              joinEnId,
              lineArray,
              pointArray
            );
          }
        } else {
          // Final case of hole. Start vertex of edge previous to prevPrev touches the vertex at end of line.
          joinStId = lineArray[prevPrevLine.prevLine].prevLine;
          joinEnId = line.nextLine;
          newSelectedEdge = this.mergeEndPoints(
            joinStId,
            joinEnId,
            lineArray,
            pointArray
          );
        }
      }
    }
    return newSelectedEdge;
  }

  addTileOneEdge(lines, selectedLineInd) {
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

  addTileTwoEdges(lines, points, selectedLineInd, newVerts, newBBox) {
    // lines: array of lines, copy, to be modified.
    // points: array of points copy, to be modified.
    // newVerts: The letters corresponding to the four corners of the new tile.
    // newBBox: bounding box copy, to be modified.

    // The two new lines, in order from start to end, are newStLine and newMidLine.
    // To avoid extra code, calls are set up so that we never have newMidLine and newEnLine only.

    var line = lines[selectedLineInd];

    // Compute the angle of the new start line.
    var newStLineAngle = this.adjustAngle(
      line.angle + this.tileAngle(newVerts[0])
    );
    var xOffset = Math.cos((newStLineAngle * Math.PI) / 180);
    var yOffset = Math.sin((newStLineAngle * Math.PI) / 180);

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
    newStLine.enPoint = newStPointIndex; // Start is the same as selected line.
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

  addTileThreeEdges(lines, points, selectedLineInd, newVerts, newBBox) {
    // lines: array of lines, copy, to be modified.
    // points: array of points copy, to be modified.
    // newVerts: The letters corresponding to the four corners of the new tile.
    // newBBox: bounding box copy, to be modified.

    // The three new lines, in order from start to end, are newStLine, newMidLine, and newEnLine.

    var line = lines[selectedLineInd];

    // Compute the angle of the new start line.
    var newStLineAngle = this.adjustAngle(
      line.angle + this.tileAngle(newVerts[0])
    );
    var xOffset = Math.cos((newStLineAngle * Math.PI) / 180);
    var yOffset = Math.sin((newStLineAngle * Math.PI) / 180);

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
    newStLine.enPoint = newStPointIndex; // Start is the same as selected line.
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
    newEnLine.stPoint = newEnPointIndex; // End is the same as selected line.
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

  addFatOrSkinny(startId, vertexLetter, lines, points, BBox) {
    if ("ABCD".indexOf(vertexLetter) > -1) {
      return this.addFatTile(startId, lines, points, BBox);
    }
    return this.addSkinnyTile(startId, lines, points, BBox);
  }

  traverseTiling(startEdgeId, lineArray, pointArray, newBBox) {
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
      return this.addFatOrSkinny(
        startEdgeId,
        vertInfo.next,
        lineArray,
        pointArray,
        newBBox
      );
    } else if (pointArray[startEdge.enPoint].vertex === "HAA") {
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
          return this.addFatOrSkinny(
            nextEdgeId,
            vertInfo.next,
            lineArray,
            pointArray,
            newBBox
          );
        } else if (pointArray[nextEdge.enPoint].vertex === "HAA") {
          return this.addSkinnyTile(nextEdgeId, lineArray, pointArray, newBBox);
        }
      }
      nextEdgeId = nextEdge.nextLine;
    }
    // IF we finish the while loop, we didn't find a vertex to complete.
    return startEdgeId;
  }

  prependVertex(tileVertex, pointIndex, pointArray) {
    var newVertex = tileVertex + pointArray[pointIndex].vertex;
    pointArray[pointIndex].vertex = newVertex;
    return completedVertex.indexOf(newVertex);
  }

  appendVertex(tileVertex, pointIndex, pointArray) {
    var newVertex = pointArray[pointIndex].vertex + tileVertex;
    pointArray[pointIndex].vertex = newVertex;
    return completedVertex.indexOf(newVertex);
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
    var newVertex =
      pointArray[stEdge.enPoint].vertex + pointArray[enEdge.stPoint].vertex;

    // Use the end point of the start edge as the connecting point.
    // We don't need to update removed point vertex because we only look at vertices on the outside of the tiling.
    pointArray[stEdge.enPoint].vertex = newVertex;
    lineArray[enEdgeId].stPoint = stEdge.enPoint;

    return enEdgeId;
  }

  rotateVerts(vArray, n) {
    var tempArr = [];
    for (var i = 0; i < 4; i++) {
      tempArr[i] = vArray[(i + n) % 4];
    }
    for (i = 0; i < 4; i++) {
      vArray[i] = tempArr[i];
    }
  }

  expandBoundingBox(x, y, bbox) {
    if (x < bbox.xMin) {
      bbox.xMin = x;
    } else if (x > bbox.xMax) {
      bbox.xMax = x;
    }
    if (y < bbox.yMin) {
      bbox.yMin = y;
    } else if (y > bbox.yMax) {
      bbox.yMax = y;
    }
  }

  tileAngle(vertex) {
    if (vertex === "A" || vertex === "C") return 72;
    else if (vertex === "B" || vertex === "D") return 108;
    else if (vertex === "E" || vertex === "G") return 144;
    // (vertex === "F" || vertex === "H")
    else return 36;
  }

  adjustAngle(angle) {
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

  checkVertex(vertex) {
    if (
      allowedVerts.indexOf(vertex) === -1 &&
      completedVertex.indexOf(vertex) === -1
    ) {
      return true; // error
    }
    return false;
  }

  checkIntegrity(points) {
    var error = false;
    for (var i = 0; i < points.length; i++) {
      error = this.checkVertex(points[i].vertex);
      if (error === true) break;
    }
    return error;
  }
}
