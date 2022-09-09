import * as d3 from "d3";

const colorRange = [
  "#9d2f29",
  "#ba4a45",
  "#de7875",
  "#ababab",
  "#8cbf84",
  "#5c8456",
  "#315c32",
];

function checknumbers(n) {
  if (n === 0) return 0;
  if (n > 0 && n <= 1) return 1;
  if (n > 1 && n <= 2) return 2;
  if (n > 2 && n <= 3) return 3;
  if (n > 3) return 3;
}

function roundTo(n) {
  if (n >= 0) {
    return checknumbers(n);
  } else {
    const k = n * -1;
    return checknumbers(k) * -1;
  }
}

function dementionStyle(d) {
  const width = d.x1 - d.x0;
  const height = d.y1 - d.y0;
  return `left: ${d.x0}px;top:${d.y0}px;width:${width}px;height:${height}px;`;
}

function getSize(d) {
  var bbox = this.getBoundingClientRect(),
    cbbox = this.parentNode.getBoundingClientRect(),
    scale = Math.min(cbbox.width / bbox.width, cbbox.height / bbox.height);
  return (d.scale = scale);
}

class TreeMap {
  constructor({ ref, data, sortKey, width, height }) {
    this.data = data;
    this.ref = ref;
    this.sortKey = sortKey;
    this.height = height;
    this.width = width;
    this.root = null;
    this.map = null;
    this.canvas = null;
    this.context = null;
    this.textLayer = null;
    this.transform = d3.zoomIdentity;
    this.target = null;

    this.mainZoom = d3
      .zoom()
      .scaleExtent([1, 150])
      .translateExtent([
        [0, 0],
        [width, height],
      ]);

    this.colorScale = d3
      .scaleOrdinal()
      .domain([-3, -2, -1, 0, 1, 2, 3])
      .range(colorRange);

    // begining of everything
    this.init(data);
  }

  init(data) {
    this.creteaHierarchy(data);

    this.map = d3.select(this.ref).call(this.mainZoom);

    this.canvas = this.map
      .select("canvas.canvas")
      .attr("width", this.width)
      .attr("height", this.height);

    this.context = this.canvas.node().getContext("2d");

    this.textLayer = this.map
      .select("div.textLayer")
      .attr("style", `width:${this.width}px;height:${this.height}px;`);

    this.drewCanvas();
    this.drawTexts();

    this.mainZoom.on("end", ({ transform }) => {
      this.drawTexts(transform);
    });

    this.mainZoom.on("zoom", ({ transform }) => {
      this.transform = transform;
      this.map.attr("data-zoom", transform.k);
      this.updateCanvas(transform);
      this.updateTextLayer(transform);
    });
  }

  creteaHierarchy(data) {
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

    this.root = treemap(this.root);
  }

  // canvas drawing
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

  // this.textLayer used
  isElementInViewport = (leaf, transfrom) => {
    const { k, x, y } = transfrom;
    const leafWidth = (leaf.x1 - leaf.x0) * k;
    const right = leaf.x1 * k;
    const bottom = leaf.y1 * k;
    const top = leaf.y0 * k;

    const Xdirection =
      right < Math.abs(x) + this.textLayer.node().clientWidth + leafWidth &&
      right + x > 0;

    const Ydirection =
      this.textLayer.node().clientHeight + Math.abs(y) > top &&
      Math.abs(y) < bottom;

    return Ydirection && Xdirection;
  };

  drawTexts(transform = { x: 1, y: 1, k: 1 }) {
    const parent = this.root.descendants().filter((item) => item.depth === 1);
    const leaves = this.root.leaves();

    const filteredLeaves = leaves.filter((item, i) => {
      const widthoftile = transform.k * (item.x1 - item.x0);
      const inView = this.isElementInViewport(item, transform);
      return widthoftile > 30 && inView;
    });

    // empty the layer
    this.textLayer.selectAll("div").remove();

    // ------------- sector tile
    const sector = this.textLayer
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
        return `${node.data.name}`;
      })
      .attr("style", (d) => {
        const fontSize = Math.min(d.scale * 10) / transform.k;
        return `font-size: ${Math.max(fontSize, 3)}px;line-height:${Math.max(
          fontSize,
          3
        )}px`;
      });

    // ---------------- tile
    const tile = this.textLayer
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
        return `font-size:${Math.min(nodeWidth, nodeHeight) / 8}px;`;
      })
      .text(
        (node) =>
          `${((node.data.priceChange * 100) / node.data.lastPrice).toFixed(2)}%`
      );

    this.tiles = tile;
    this.sectors = sector;
  }

  updateTextLayer = (transform) => {
    this.textLayer.attr(
      "style",
      `width:${this.width}px;height:${this.height}px;transform: translate(${transform.x}px, ${transform.y}px) scale(${transform.k})`
    );
  };
}

export default TreeMap;
