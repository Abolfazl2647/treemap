import React, { useEffect } from "react";
import Treemap from "./d3Class";
import "./style.css";

export default function TreeMap({ data, onHover }) {
  const mapRef = React.useRef();

  useEffect(() => {
    console.log("re create d3");
    const treemap = new Treemap({
      width: window.innerWidth,
      height: window.innerHeight,
      ref: mapRef.current,
      sortKey: "totalValue",
      data,
    });
  }, [data, onHover]);

  return (
    <div id="treemap" ref={mapRef}>
      <canvas className="canvas" />
      <div className="textLayer" />
    </div>
  );
}
