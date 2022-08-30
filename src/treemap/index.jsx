import { useEffect } from "react";
import * as d3 from "d3";
import json from "../hooks/data.json";
import { convertDataForTreeMap } from "../hooks/useMarketMap";
import "./style.css";
// import useMarketMap from "../hooks/useMarketMap";
const data = convertDataForTreeMap(json);

const createTable = (data) => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const padding = 1;

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
  // ==================================================================================
  //========================================= Create Containers
  const mainZoom = d3
    .zoom()
    .scaleExtent([1, 150])
    .translateExtent([
      [0, 0],
      [width, height],
    ]);

  const map = d3.select("#treemap").call(mainZoom);

  const canvas = map
    .append("canvas")
    .attr("class", "canvas")
    .attr("width", width)
    .attr("height", height);

  const context = canvas.node().getContext("2d");

  const textLayer = map
    .append("div")
    .attr("class", "textLayer")
    .attr("style", `width:${width}px;height:${height}px;`);

  // ========================================= Create Helpers

  const isElementInViewport = (leaf, transfrom) => {
    const { k, x, y } = transfrom;
    const right = leaf.x1 * k;
    const bottom = leaf.y1 * k;
    const top = leaf.y0 * k;

    const Xdirection =
      right <
        Math.abs(x) + textLayer.node().clientWidth + (leaf.x1 - leaf.x0) * k &&
      right + x > 0;

    const Ydirection =
      textLayer.node().clientHeight + Math.abs(y) > top && Math.abs(y) < bottom;

    return Ydirection && Xdirection;
  };

  // draw tiles
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

  //getBoundingClientRect
  function drawTexts(transform = { x: 1, y: 1, k: 1 }) {
    const filteredLeaves = leaves.filter((item, i) => {
      const widthoftile = transform.k * (item.x1 - item.x0);
      const inView = isElementInViewport(item, transform);

      return widthoftile > 50 && inView;
    });

    // empty the layer
    d3.select("div.textLayer").selectAll("div").remove();

    // draw new one
    const tile = textLayer
      .selectAll("div.tile")
      .data(filteredLeaves)
      .enter()
      .append("div")
      .attr("class", "tile")
      .attr("style", (d) => {
        return `left: ${d.x0}px;top:${d.y0}px;width:${d.x1 - d.x0}px;height:${
          d.y1 - d.y0
        }px;font-size: ${(d.x1 - d.x0) / 6}px`;
      });

    tile
      .append("span")
      .attr("class", "tile-name")
      .text((node) => node.data.name);
  }

  // zoom textlayer
  const updateChild = (transform) => {
    textLayer.attr(
      "style",
      `width:${width}px;height:${height}px;transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
    );
  };

  // ========================================= Drawing
  drawLeaves();
  drawTexts();

  // ========================================= Zooming

  const mainZooming = ({ transform }) => {
    map.attr("data-zoom", transform.k);
    updateCanvas(transform);
    updateChild(transform);
  };

  const mainZoomEnd = ({ transform }) => {
    drawTexts(transform);
  };

  mainZoom.on("end", mainZoomEnd);
  mainZoom.on("zoom", mainZooming);
};

export default function TreeMap() {
  useEffect(() => {
    if (!data) return;
    createTable(data);
  }, []);

  return <div id="treemap" />;
}
