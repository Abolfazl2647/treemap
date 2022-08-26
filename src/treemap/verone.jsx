import { useEffect, useRef } from "react";
import * as d3 from "d3";
import useMarketMap from "../hooks/useMarketMap";

export default function TreeMap() {
  const [data] = useMarketMap();
  const treemapref = useRef();

  useEffect(() => {
    if (!data) return;

    // const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    var margin = { top: 10, right: 10, bottom: 10, left: 10 },
      width = window.innerWidth - margin.left - margin.right,
      height = window.innerHeight - margin.top - margin.bottom;

    // =========================================  create Heirarchy
    const hierarchy = d3
      .hierarchy(data, (node) => node.children)
      .sum((node) => node.totalValue)
      .sort((a, b) => b.totalValue - a.totalValue);

    // =========================================  create TreeMap
    const treemap = d3
      .treemap()
      .size([width, height])
      .padding(2)
      .paddingTop(20)
      .round(false);

    treemap(hierarchy);
    // =========================================  create Tiles
    const leaves = hierarchy.leaves();
    const parent = hierarchy.descendants().filter((item) => item.depth === 1);
    // =========================================  create svg map

    // const xs = d3.scaleLinear().rangeRound([0, width]);
    // const ys = d3.scaleLinear().rangeRound([0, height]);

    const zoom = d3
      .zoom()
      .scaleExtent([1, 150])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("end", zoomed);

    // const color = d3
    //   .scaleOrdinal()
    //   .domain(["0", "1", "2", "3", "4", "5"])
    //   .range([
    //     "#3e3e3e",
    //     "#2e8c2b",
    //     "#34af1a",
    //     "#8FD175",
    //     "#be282d",
    //     "#a2484b",
    //   ]);

    const svg = d3
      .select("div#treemap")
      .append("div")
      .attr(
        "style",
        `position: relative;width:${width}px;height:${height}px;left: ${margin.left}px;top:${margin.top}px`
      )
      .call(zoom);

    const div = svg.append("div").attr("class", "treemap-container");

    function zoomed(event) {
      console.log("event", event);
      const { k, x, y } = event.transform;
      div.attr("style", `transform: translate(${x}px, ${y}px) scale(${k})`);
    }

    // ==================================== parent sector

    const sector = div
      .selectAll("div.sector")
      .data(parent)
      .enter()
      .append("div")
      .attr("class", "sector")
      .attr(
        "style",
        (d) =>
          `left: ${d.x0}px;top:${d.y0}px;width:${d.x1 - d.x0}px;height:${
            d.y1 - d.y0
          }px;font-size: ${(d.x1 - d.x0) / 12}px`
      );

    sector
      .append("span")
      .attr("class", "sector-name")
      .text((node) => node.data.name);

    sector.each((item, i, arr) => {
      const current = arr[i];
      const text = d3.select(current).select("span");
      const textnode = text.node();
      const textWidth = textnode.getBoundingClientRect().width;
      const tileWidth = current.getBoundingClientRect().width;

      if (i === 30) {
        console.log("textWidth", textWidth);
        console.log("tileWidth", tileWidth);
      }

      if (tileWidth > textWidth) {
        text.attr("style", `font-size: 15px`);
      } else {
        text.attr("style", `font-size: 1em`);
      }
    });

    // ==================================== create child sector
    const tile = div
      .selectAll("div.tile")
      .data(leaves)
      .enter()
      .append("div")
      .attr("class", (node) =>
        node.data.priceChange > 0 ? "tile green" : "tile red"
      )
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
      .text((node) => `${node.data.name}`);

    tile
      .append("span")
      .attr("class", "tile-value")
      .text((node) => {
        // console.log("node", node);
        return node.data.lastPrice;
      });
  }, [data]);

  return <div id="treemap" ref={treemapref} />;
}
