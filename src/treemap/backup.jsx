import { useEffect } from "react";
import * as d3 from "d3";
import json from "../hooks/data.json";
import { convertDataForTreeMap } from "../hooks/useMarketMap";
import "./style.css";
// import useMarketMap from "../hooks/useMarketMap";
const data = convertDataForTreeMap(json);

const createTable = (data) => {
  //   const margin = { top: 20, right: 20, bottom: 20, left: 20 };

  const width = window.innerWidth;
  const height = window.innerHeight;
  const padding = 2;

  // =========================================  create Heirarchy
  const root = d3
    .hierarchy(data, (node) => node.children)
    .sum((node) => node.totalValue)
    .sort((a, b) => b.totalValue - a.totalValue);
  const treemap = d3
    .treemap()
    .size([width, height])
    .padding(padding)
    .round(false);
  treemap(root);

  // const parent = root.descendants().filter((item) => item.depth === 1);
  const leaves = root.leaves();

  // =========================================  create Containers
  const zoom = d3
    .zoom()
    .scaleExtent([1, 150])
    .translateExtent([
      [0, 0],
      [width, height],
    ]);

  const renderZoom = d3
    .zoom()
    .scaleExtent([1, 150])
    .translateExtent([
      [0, 0],
      [width, height],
    ]);

  const map = d3.select("#treemap");

  const canvas = map
    .append("canvas")
    .attr("class", "canvas")
    .attr("width", width)
    .attr("height", height);

  const render = map
    .append("div")
    .attr("class", "render")
    .attr("style", `width:${width}px;height:${height}px;`);

  const amir = render.append("div").attr("class", "amir");

  //////////////////////////////////////////////////// Drawing
  map.call(zoom, d3.zoomIdentity);
  //   render.call(renderZoom, d3.zoomIdentity);

  const context = canvas.node().getContext("2d");

  // draw tiles for canvas
  const drawLeaves = () => {
    leaves.forEach((leaf) => {
      context.save(); // For clipping the text
      context.beginPath();
      context.rect(
        leaf.x0, // x
        leaf.y0, // y
        leaf.x1 - leaf.x0, // width
        leaf.y1 - leaf.y0 // height
      );
      context.fillStyle = leaf.data.priceChange > 0 ? "#7ec17e" : "#ed7171";
      context.fill();
      context.clip(); // Generate the Clip Path
      context.restore(); // Restore so you can continue drawing
    });
  };

  // update canvas with zoom
  const updateCanvas = (transform) => {
    context.save();
    context.clearRect(0, 0, width, height);
    context.translate(transform.x, transform.y);
    context.scale(transform.k, transform.k);
    drawLeaves();
    context.restore();
  };

  //   const updateAmir = (transform) => {
  //     render.attr(
  //       "style",
  //       `width:${width}px;height:${height}px;transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
  //     );
  //   };

  // make canvas drawing
  drawLeaves();

  //   const arash = { x: 10, y: 10, k: 5 };
  //   zoom.translateTo(map, arash.x, arash.y);
  //   zoom.scaleTo(map, arash.k);
  //   updateCanvas(arash);

  const zooming = ({ transform }) => {
    map.attr("data-zoom", transform.k);
    updateCanvas(transform);
    renderZoom.translateTo(render, transform.x, transform.y);
    renderZoom.scaleTo(render, transform.k);
  };

  const zoomend = ({ transform }) => {
    render.call(renderZoom.transform, d3.zoomIdentity);
    updateCanvas(transform);
    amir.attr(
      "style",
      `transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
    );
  };

  const renderZooming = ({ transform }) => {
    render.attr(
      "style",
      `width:${width}px;height:${height}px;transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
    );
  };

  renderZoom.on("zoom", renderZooming);
  zoom.on("zoom", zooming);
  zoom.on("end", zoomend);

  ///////////////////////////////////////////////////// ZOOM
};

export default function TreeMap() {
  useEffect(() => {
    if (!data) return;
    createTable(data);
  }, []);

  return <div id="treemap" />;
}
