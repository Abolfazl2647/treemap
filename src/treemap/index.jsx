import { useEffect } from "react";
import * as d3 from "d3";
import json from "../hooks/data.json";
import { convertDataForTreeMap } from "../hooks/useMarketMap";
import "./style.css";
// import useMarketMap from "../hooks/useMarketMap";
const data = convertDataForTreeMap(json);

export default function TreeMap() {
  useEffect(() => {
    if (!data) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // =========================================  create Heirarchy
    const root = d3
      .hierarchy(data, (node) => node.children)
      .sum((node) => node.totalValue)
      .sort((a, b) => b.totalValue - a.totalValue);
    const treemap = d3.treemap().size([width, height]).padding(2).round(false);
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

    const map = d3.select("#treemap");

    const canvas = map
      .append("canvas")
      .attr("class", "tile-layer")
      .attr("width", width)
      .attr("height", height);

    const svg = map
      .append("div")
      .attr("class", "text-layer")
      .attr("style", `width:${width}px;height:${height}px;`)
      .call(zoom);

    const context = canvas.node().getContext("2d");

    const div = svg.append("div").attr("class", "treemap-container");

    // =========================================  create Helpers
    // const color = d3.scaleOrdinal(d3.schemeCategory10);
    // const getColor = (d) => {
    //   while (d.depth > 1) d = d.parent;
    //   return color(d.data.name);
    // };

    const checkBoundaries = (item, transfrom) => {
      // 2 added because of the padding we set for treemap
      const widthB = item.x1 * transfrom.k + transfrom.x + 2 >= 0;
      const heightB = item.y1 * transfrom.k + transfrom.y + 2 >= 0;
      return widthB || heightB;
    };

    // draw tiles for canvas
    function drawLeaves() {
      leaves.forEach((leaf) => {
        context.save(); // For clipping the text
        context.globalAlpha = 0.7;
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
    }

    // draw text on top of canvas
    function drawTexts(transform = { x: 1, y: 1, k: 1 }) {
      const filteredLeaves = leaves.filter((item, i) => {
        const widthoftile = transform.k * (item.x1 - item.x0);

        return widthoftile > 50 && checkBoundaries(item, transform);
      });

      d3.select("div.treemap-container").selectAll("div").remove();
      // draw new one

      const tile = div
        .selectAll("div.tile")
        .data(filteredLeaves)
        .enter()
        .append("div")
        .attr("class", "tile")
        .attr(
          "style",
          (d) =>
            `left: ${d.x0}px;top:${d.y0}px;width:${d.x1 - d.x0}px;height:${
              d.y1 - d.y0
            }px;font-size: ${(d.x1 - d.x0) / 6}px`
        );

      tile
        .append("span")
        .attr("class", "tile-name")
        .text((node) => node.data.name);
    }

    function updateCanvas(transform) {
      context.save();
      context.clearRect(0, 0, width, height);
      context.translate(transform.x, transform.y);
      context.scale(transform.k, transform.k);
      drawLeaves();
      context.restore();
    }

    drawLeaves();
    drawTexts();

    // ======================================  Zoom start
    function zooming({ transform }) {
      updateCanvas(transform);
      // we add text layer transform here beacuse we want to show text nicly in zooming
      d3.select("div.treemap-container").attr(
        "style",
        `transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
      );
    }

    function zoomend({ transform }) {
      drawTexts(transform);
    }

    // function zoomstart({ transform }) {}
    // zoom.on("start", zoomstart);
    zoom.on("end", zoomend);
    zoom.on("zoom", zooming);
    // --------------------------------------  Zoom end

    //
  }, []);

  return <div id="treemap" />;
}
