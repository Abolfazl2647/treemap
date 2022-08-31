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
  const padding = 0.5;

  // scales
  const mainZoom = d3
    .zoom()
    .scaleExtent([1, 150])
    .translateExtent([
      [0, 0],
      [width, height],
    ]);

  // const colorDomain = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
  const colorRange = [
    "#9d2f29",
    "#ba4a45",
    "#de7875",
    "#ababab",
    "#333236",
    "#dcdcdc",
    "#8cbf84",
    "#5c8456",
    "#315c32",
  ];

  const color = d3.scaleOrdinal(colorRange);

  console.log("color", color(5000));

  // =========================================  create Heirarchy
  const root = d3
    .hierarchy(data, (node) => node.children)
    .sum((node) => node.totalVolume)
    .sort((a, b) => b.totalVolume - a.totalVolume);

  const treemap = d3
    .treemap()
    .size([width, height])
    .padding(padding)
    .paddingTop(15)
    .round(false);
  treemap(root);

  const parent = root.descendants().filter((item) => item.depth === 1);
  const leaves = root.leaves();
  // ==================================================================================
  //========================================= Create Containers

  const map = d3.select("#treemap").call(mainZoom);

  const canvas = map
    .select("canvas.canvas")
    .attr("width", width)
    .attr("height", height);

  const context = canvas.node().getContext("2d");

  const textLayer = map
    .select("div.textLayer")
    .attr("style", `width:${width}px;height:${height}px;`);

  // ========================================= Create Helpers

  const dementionStyle = (d) => {
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return `left: ${d.x0}px;top:${d.y0}px;width:${width}px;height:${height}px;`;
  };

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
      return widthoftile > 30 && inView;
    });

    // empty the layer
    d3.select("div.textLayer").selectAll("div").remove();

    const sector = textLayer
      .selectAll("div.tile")
      .data(parent)
      .enter()
      .append("div")
      .attr("class", "sector")
      .attr("style", (d) => {
        return `${dementionStyle(d)};`;
      });

    sector
      .append("span")
      .attr("class", "sector-name")
      .attr("style", (node) => {
        // const fontsize = 10 / transform.k;
        return `font-size: 1em`;
      })
      .text((node) => {
        return `${node.data.name}`;
      });

    // draw new one
    const tile = textLayer
      .selectAll("div.tile")
      .data(filteredLeaves)
      .enter()
      .append("div")
      .attr("class", "tile")
      .attr("style", (d) => {
        const width = (d.x1 - d.x0) / transform.k;
        // const height = (fy * (d.y1 - d.y0)) / transform.k;
        // const fontsize = Math.max(
        //   Math.min(
        //     width / 5,
        //     height / 2,
        //     Math.sqrt(width * width + height * height) / 10
        //   ),
        //   9
        // );
        return `${dementionStyle(d)};font-size: ${width / 2}px`;
      });

    tile
      .append("span")
      .attr("class", "tile-name")
      .text((node) => {
        // const { lastClosePrice, closePrice } = node.data;
        // const change = Math.round(lastClosePrice / closePrice);
        return `${node.data.name}`;
      });
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

  return (
    <div id="treemap">
      <canvas className="canvas" />
      <div className="textLayer" />
    </div>
  );
}
