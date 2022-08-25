import { useEffect, useRef } from "react";
import * as d3 from "d3";
import useMarketMap from "../hooks/useMarketMap";

export default function TreeMap() {
  const [data] = useMarketMap();
  const treemapref = useRef();

  useEffect(() => {
    if (!data) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvas = d3
      .select("#treemap")
      .append("canvas")
      .attr("width", width)
      .attr("height", height);
    const context = canvas.node().getContext("2d");

    // =========================================  create Heirarchy
    const root = d3
      .hierarchy(data, (node) => node.children)
      .sum((node) => node.totalValue)
      .sort((a, b) => b.totalValue - a.totalValue);

    const treemap = d3.treemap().size([width, height]).padding(2).round(false);
    treemap(root);

    // const color = d3.scaleOrdinal(d3.schemeCategory10);
    // const getColor = (d) => {
    //   while (d.depth > 1) d = d.parent;
    //   return color(d.data.name);
    // };

    const leaves = root.leaves();

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
      context.fillStyle = "#333";
      context.fill();
      context.clip(); // Generate the Clip Path

      context.font = "10px sans-serif";
      const textData = leaf.data.name.split(/(?=[A-Z][^A-Z])/g);

      context.globalAlpha = 1;
      textData.forEach((d, i, nodes) => {
        let offsetY = 12; // Some simple logic to set the y of the text
        if (i > 0) {
          offsetY += i * 12;
        }

        context.fillStyle = "black";
        context.fillText(d, leaf.x0, leaf.y0 + offsetY);
      });

      context.restore(); // Restore so you can continue drawing
    });

    // function zoomed(transform) {
    //   context.clearRect(0, 0, width, height);
    //   context.save();
    //   if (transform) {
    //     context.translate(transform.x, transform.y);
    //     context.scale(transform.k, transform.k);
    //   }
    //   context.beginPath();
    //   context.stroke(path2D);
    //   context.restore();
    // }

    // d3.select(context.canvas).call(
    //   d3
    //     .zoom()
    //     .scaleExtent([1, 150])
    //     .translateExtent([
    //       [0, 0],
    //       [width, height],
    //     ])
    //     .on("zoom", ({ transform }) => zoomed(transform))
    // );

    // zoomed(d3.zoomIdentity);

    //
  }, [data]);

  return <div id="treemap" ref={treemapref} />;
}
