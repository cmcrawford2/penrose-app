import React from "react";
import initialData from "./initial_data.js";
import { Line } from "react-lineto";
import "./style.css";
import Tiling from "./Tiling.js";

class App extends React.Component {
  state = initialData;

  dump = () => {
    // For debugging.
    for (var i = 0; i < this.state.lines.length; i++) {
      console.log("edge", i, ":", this.state.lines[i]);
    }
    for (i = 0; i < this.state.points.length; i++) {
      console.log("point", i, ":", this.state.points[i]);
    }
  };

  // For debugging from the UI.
  traverseOnce = () => {
    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines]; // We will add lines and modify existing.
    var pointArray = [...this.state.points]; // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    const tiling = new Tiling();

    var newTraverseEdge = tiling.traverseTiling(
      selectedId,
      lineArray,
      pointArray,
      newBBox
    );

    var error = tiling.checkIntegrity(pointArray);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newTraverseEdge,
      errorCondition: error,
    };
    this.setState(newState);
  };

  traverse20 = () => {
    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines]; // We will add lines and modify existing.
    var pointArray = [...this.state.points]; // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    const tiling = new Tiling();

    for (var i = 0; i < 20; i++) {
      var newTraverseEdge = tiling.traverseTiling(
        selectedId,
        lineArray,
        pointArray,
        newBBox
      );
      if (newTraverseEdge === selectedId) {
        break;
      }
      selectedId = newTraverseEdge;
    }
    var error = tiling.checkIntegrity(pointArray);

    var newState = {
      ...this.state,
      lines: lineArray,
      points: pointArray,
      boundingBox: newBBox,
      selectedEdge: newTraverseEdge,
      errorCondition: error,
    };
    this.setState(newState);
  };

  addFat = () => {
    // add one fat tile and modify copies of state data

    console.log("adding fat tile");
    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines]; // We will add lines and modify existing.
    var pointArray = [...this.state.points]; // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    const tiling = new Tiling();

    var newSelectedEdge = tiling.addFatTile(
      selectedId,
      lineArray,
      pointArray,
      newBBox
    );
    if (newSelectedEdge === -1) return;

    // traverse the outside of the tiling looking for incomplete vertices, until there are no more.
    if (!this.state.oneTileOnly) {
      var newTraverseEdge = tiling.traverseTiling(
        newSelectedEdge,
        lineArray,
        pointArray,
        newBBox
      );
      while (newTraverseEdge !== newSelectedEdge) {
        newSelectedEdge = newTraverseEdge;
        newTraverseEdge = tiling.traverseTiling(
          newSelectedEdge,
          lineArray,
          pointArray,
          newBBox
        );
        // For debugging
        // console.log(newTraverseEdge, lineArray[newTraverseEdge]);
        var error = tiling.checkIntegrity(pointArray);
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
    };
    this.setState(newState);
  };

  addSkinny = () => {
    // add one skinny tile and modify copies of state data

    var selectedId = this.state.selectedEdge;
    var lineArray = [...this.state.lines]; // We will add lines and modify existing.
    var pointArray = [...this.state.points]; // We will update vertex of affected points.
    var newBBox = { ...this.state.boundingBox };
    const tiling = new Tiling();

    var newSelectedEdge = tiling.addSkinnyTile(
      selectedId,
      lineArray,
      pointArray,
      newBBox
    );
    if (newSelectedEdge === -1) return;

    // traverse the outside of the tiling looking for incomplete vertices, until there are no more.
    if (!this.state.oneTileOnly) {
      var newTraverseEdge = tiling.traverseTiling(
        newSelectedEdge,
        lineArray,
        pointArray,
        newBBox
      );
      while (newTraverseEdge !== newSelectedEdge) {
        newSelectedEdge = newTraverseEdge;
        newTraverseEdge = tiling.traverseTiling(
          newSelectedEdge,
          lineArray,
          pointArray,
          newBBox
        );
        // For debugging
        // console.log(newTraverseEdge, lineArray[newTraverseEdge]);
        var error = tiling.checkIntegrity(pointArray);
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
    };
    this.setState(newState);
  };

  moveSelection = () => {
    var newSelectedEdge = this.state.lines[this.state.selectedEdge].nextLine;
    this.setState({ selectedEdge: newSelectedEdge });
  };

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

    var scale = xscale < yscale ? xscale : yscale;

    var xOffset = 348 - 0.5 * scale * (xmin + xmax);
    var yOffset = 290 - 0.5 * scale * (ymin + ymax);

    var x0t = scale * this.state.points[line.stPoint].x + xOffset;
    var x1t = scale * this.state.points[line.enPoint].x + xOffset;
    var y0t = scale * this.state.points[line.stPoint].y + yOffset;
    var y1t = scale * this.state.points[line.enPoint].y + yOffset;

    var lineColor = "lime";
    if (index === this.state.selectedEdge) lineColor = "white";

    return (
      <Line
        key={index.toString()}
        x0={x0t}
        y0={y0t}
        x1={x1t}
        y1={y1t}
        borderWidth={2}
        borderColor={lineColor}
      />
    );
  };

  toggleOneOnly = () => {
    this.setState({ oneTileOnly: !this.state.oneTileOnly });
  };

  render() {
    return (
      <div className="App">
        <div>{this.state.lines.map(this.renderLine)}</div>
        <div className="App-container">
          <div className="Penrose-background">
            <img src="/oscilloscope.jpeg" alt="Oscilloscope" />
          </div>
          <div className="Button-column">
            <h1>Penrose Laboratory</h1>
            <p>
              A Penrose tiling consists of wide and narrow diamonds. "Add"
              buttons attach a tile to the white line and fill in the tiling.
              "Move selection" moves the white line around the perimeter.
              "Toggle Auto-fill" disables automatic completion and provides more
              options. Start over by refreshing the browser.
            </p>
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
            {this.state.oneTileOnly === true && (
              <div className="Button-box">
                <button className="SortButton" onClick={this.traverse20}>
                  Traverse 20
                </button>
                <button className="SortButton" onClick={this.traverseOnce}>
                  Traverse Once
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
