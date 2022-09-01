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
    "#333236",
    "#8cbf84",
    "#5c8456",
    "#315c32",
  ];

  const colorScale = d3
    .scaleOrdinal()
    .domain([-3, -2, -1, 0, 1, 2, 3])
    .range(colorRange);

  // =========================================  create Heirarchy
  const root = d3
    .hierarchy(data, (node) => node.children)
    .sum((node) => node.totalValue)
    .sort((a, b) => b.totalValue - a.totalValue);

  const treemap = d3
    .treemap()
    .size([width, height])
    .padding(1)
    .paddingOuter(2)
    .round(true);
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

  const checknumbers = (n) => {
    if (n === 0) return 0;
    if (n > 0 && n <= 1) return 1;
    if (n > 1 && n <= 2) return 2;
    if (n > 2 && n <= 3) return 3;
    if (n > 3) return 2;
  };

  function roundTo(n) {
    if (n >= 0) {
      return checknumbers(n);
    } else {
      const k = n * -1;
      return checknumbers(k) * -1;
    }
  }

  const dementionStyle = (d) => {
    const width = d.x1 - d.x0;
    const height = d.y1 - d.y0;
    return `left: ${d.x0}px;top:${d.y0}px;width:${width}px;height:${height}px;`;
  };

  const isElementInViewport = (leaf, transfrom) => {
    const { k, x, y } = transfrom;
    const leafWidth = (leaf.x1 - leaf.x0) * k;
    const right = leaf.x1 * k;
    const bottom = leaf.y1 * k;
    const top = leaf.y0 * k;

    const Xdirection =
      right < Math.abs(x) + textLayer.node().clientWidth + leafWidth &&
      right + x > 0;

    const Ydirection =
      textLayer.node().clientHeight + Math.abs(y) > top && Math.abs(y) < bottom;

    return Ydirection && Xdirection;
  };

  // draw tiles
  const drawLeaves = () => {
    leaves.forEach((leaf) => {
      const change = (leaf.data.priceChange * 100) / leaf.data.lastPrice;
      const color = roundTo(change, 2);

      context.save(); // For clipping the text
      context.beginPath();
      context.rect(
        leaf.x0, // x
        leaf.y0, // y
        leaf.x1 - leaf.x0, // width
        leaf.y1 - leaf.y0 // height
      );
      context.fillStyle = colorScale(color);
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

  function getSize(d) {
    var bbox = this.getBoundingClientRect(),
      cbbox = this.parentNode.getBoundingClientRect(),
      scale = Math.min(cbbox.width / bbox.width, cbbox.height / bbox.height);
    console.log(d.data.name, cbbox.width / bbox.width);
    return (d.scale = scale);
  }

  //getBoundingClientRect
  function drawTexts(transform = { x: 1, y: 1, k: 1 }) {
    const filteredLeaves = leaves.filter((item, i) => {
      const widthoftile = transform.k * (item.x1 - item.x0);
      const inView = isElementInViewport(item, transform);
      return widthoftile > 30 && inView;
    });

    // empty the layer
    d3.select("div.textLayer").selectAll("div").remove();

    // ------------- sector tile
    const sector = textLayer
      .selectAll("div.sector")
      .data(parent)
      .enter()
      .append("div")
      .attr("class", "sector")
      .attr("style", (d) => {
        return `${dementionStyle(d)};`;
      });

    // sectorname
    sector
      .append("span")
      .each(getSize)
      .attr("class", "sector-name")
      .text((node) => {
        console.log(node.data.name, node.scale);
        return `${node.data.name}`;
      })
      .attr("style", (d) => `font-size: ${d.scale * 10}px`);

    // ---------------- tile
    const tile = textLayer
      .selectAll("div.tile")
      .data(filteredLeaves)
      .enter()
      .append("div")
      .attr("class", "tile")
      .attr("style", (node) => {
        return `${dementionStyle(node)};`;
      });

    tile
      .append("span")
      .attr("class", "tile-name")
      .text((node) => node.data.name)
      .attr("style", (d) => {
        const nodeWidth = d.x1 - d.x0;
        const nodeHeight = d.y1 - d.y0;
        return `font-size:${Math.min(nodeWidth, nodeHeight) / 5}px;`;
      });

    tile
      .append("span")
      .attr("class", "tile-change")
      .attr("style", (d) => {
        const nodeWidth = d.x1 - d.x0;
        const nodeHeight = d.y1 - d.y0;
        return `font-size:${Math.min(nodeWidth, nodeHeight) / 5}px;`;
      })
      .text(
        (node) =>
          `${((node.data.priceChange * 100) / node.data.lastPrice).toFixed(2)}%`
      );
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
