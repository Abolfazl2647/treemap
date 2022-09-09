import * as d3 from "d3";

export const colorRange = [
  "#9d2f29",
  "#ba4a45",
  "#de7875",
  "#ababab",
  "#8cbf84",
  "#5c8456",
  "#315c32",
];

export function checknumbers(n) {
  if (n === 0) return 0;
  if (n > 0 && n <= 1) return 1;
  if (n > 1 && n <= 2) return 2;
  if (n > 2 && n <= 3) return 3;
  if (n > 3) return 3;
}

export function roundTo(n) {
  if (n >= 0) {
    return checknumbers(n);
  } else {
    const k = n * -1;
    return checknumbers(k) * -1;
  }
}

export function dementionStyle(d) {
  const width = d.x1 - d.x0;
  const height = d.y1 - d.y0;
  return `left: ${d.x0}px;top:${d.y0}px;width:${width}px;height:${height}px;`;
}

export function textLayerStyle(blur, width, height, transform) {
  if (blur) {
    return `will-change: transform;width:${width}px; height:${height}px;transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`;
  }
  return `width:${width}px; height:${height}px;`;
}

export function getSize(d) {
  const self = d;
  const parent = d.parent;
  const bbox = { width: self.x1 - self.x0, height: self.y1 - self.y0 };
  const cbbox = { width: parent.x1 - parent.x0, height: parent.y1 - parent.y0 };
  const scale = Math.min(cbbox.width / bbox.width, cbbox.height / bbox.height);
  console.log(cbbox.width / bbox.width, cbbox.height / bbox.height);
  d.scale = scale;
  return d;
}

export function isElementInViewport(window, leaf, transfrom) {
  const { k, x, y } = transfrom;
  const leafWidth = (leaf.x1 - leaf.x0) * k;
  const right = leaf.x1 * k;
  const bottom = leaf.y1 * k;
  const top = leaf.y0 * k;

  const Xdirection =
    right < Math.abs(x) + window.innerWidth + leafWidth && right + x > 0;

  const Ydirection =
    window.innerHeight + Math.abs(y) > top && Math.abs(y) < bottom;

  return Ydirection && Xdirection;
}

class TreeMap {
  constructor({
    ref,
    data,
    sortKey,
    width,
    height,
    onZoom,
    onZoomEnd,
    transform,
  }) {
    this.ref = ref;
    this.sortKey = sortKey;
    this.height = height;
    this.width = width;
    this.root = null;
    this.map = null;
    this.canvas = null;
    this.context = null;

    this.mainZoom = d3
      .zoom()
      .scaleExtent([1, 150])
      .translateExtent([
        [0, 0],
        [width, height],
      ]);

    d3.zoomIdentity.translate(transform.x, transform.y).scale(transform.k);

    this.colorScale = d3
      .scaleOrdinal()
      .domain([-3, -2, -1, 0, 1, 2, 3])
      .range(colorRange);

    // begining of everything
    if (data) {
      this.createHierarchy(data);
    }

    // get elements
    this.map = d3.select(this.ref).call(this.mainZoom);
    this.canvas = this.map
      .select("canvas.canvas")
      .attr("width", this.width)
      .attr("height", this.height);
    this.context = this.canvas.node().getContext("2d");

    // set zoom
    this.mainZoom.on("zoom", ({ transform }) => {
      this.transform = transform;
      this.map.attr("data-zoom", transform.k);
      this.updateCanvas(transform);
      d3.select("div.textLayer").attr(
        "style",
        `${textLayerStyle(
          true,
          window.innerWidth,
          window.innerHeight,
          transform
        )}`
      );
      if (onZoom) onZoom(transform);
    });

    this.mainZoom.on("end", ({ transform }) => {
      if (onZoomEnd) onZoomEnd(transform);
      d3.select("div.textLayer").attr(
        "style",
        `${textLayerStyle(
          false,
          window.innerWidth,
          window.innerHeight,
          transform
        )}`
      );
    });

    this.drewCanvas();
  }

  setDefaultZoom() {
    this.map.call(this.mainZoom.transform, d3.zoomIdentity);
  }

  createHierarchy(data) {
    this.root = d3
      .hierarchy(data, (node) => node.children)
      .sum((node) => node[this.sortKey])
      .sort((a, b) => b[this.sortKey] - a[this.sortKey]);

    const treemap = d3
      .treemap()
      .size([this.width, this.height])
      .padding(1)
      .paddingOuter(2)
      .round(true);
    // .nodeSize([10, 10]);

    this.root = treemap(this.root);
    return this.root;
  }

  getRoot() {
    return this.root;
  }

  drewCanvas() {
    const leaves = this.root.leaves();
    leaves.forEach((leaf) => {
      const change = (leaf.data.priceChange * 100) / leaf.data.lastPrice;
      const color = roundTo(change, 2);

      this.context.save(); // For clipping the text
      this.context.beginPath();
      this.context.rect(
        leaf.x0, // x
        leaf.y0, // y
        leaf.x1 - leaf.x0, // width
        leaf.y1 - leaf.y0 // height
      );
      this.context.fillStyle = this.colorScale(color);
      this.context.fill();
      this.context.clip(); // Generate the Clip Path
      this.context.restore(); // Restore so you can continue drawing
    });
  }

  // canvas drawing
  updateCanvas(transform) {
    this.context.save();
    this.context.clearRect(0, 0, this.width, this.height);
    this.context.translate(transform.x, transform.y);
    this.context.scale(transform.k, transform.k);
    this.drewCanvas();
    this.context.restore();
  }
}

export default TreeMap;
