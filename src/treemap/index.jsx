import * as d3 from "d3";
import React from "react";
import TreeMap, { isElementInViewport, colorRange, getSize } from "./d3";
import Styled, { TextLayer, Sector, Tile } from "./style";

class Treemap extends React.PureComponent {
  constructor(props) {
    super(props);

    this.mapRef = React.createRef();
    this.canvasRef = React.createRef();

    this.state = {
      root: null,
      transform: d3.zoomIdentity,
    };

    this.placeHolderRender = null;
    this.zoomingFlag = false;

    this.colorScale = d3
      .scaleOrdinal()
      .domain([-3, -2, -1, 0, 1, 2, 3])
      .range(colorRange);
  }

  componentDidMount() {
    const { sortValue, data } = this.props;
    this.renderTreemap(sortValue, data);

    this.resize = window.addEventListener("resize", this.handleResize);
  }

  componentDidUpdate(prevProps) {
    const { sortValue, data } = this.props;
    const { sortValue: prevSortvalue, data: prevData } = prevProps;
    if (sortValue !== prevSortvalue || data !== prevData) {
      // if not zooming render regulary
      if (!this.zoomingFlag) {
        this.renderTreemap(sortValue, data);
        return;
      }

      this.watingForZoomFinished();
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleResize);
  }

  handleResize = () => {
    const { sortValue, data } = this.props;
    this.renderTreemap(sortValue, data);
  };

  watingForZoomFinished = () => {
    // how many times update occurs dose not matter
    // becuase we need the least update (so we dont use placeHolderRender as array)
    const { sortValue, data } = this.props;
    this.placeHolderRender = {
      sort: sortValue,
      data,
    };
  };

  proccessPlaceHolder = () => {
    const { sort, data } = this.placeHolderRender;
    this.renderTreemap(sort, data);
    this.placeHolderRender = null;
  };

  handleMouseOver = (sector) => {
    if (!this.zoomingFlag) {
      this.treemap.updateSectorColor(sector, "#ffd84c");
    }
  };

  renderTreemap(sortValue, data) {
    const self = this;
    const { transform } = this.state;

    this.treemap = new TreeMap({
      data,
      transform,
      canvasRef: this.canvasRef.current,
      ref: this.mapRef.current,
      sortKey: sortValue,
      width: window.innerWidth,
      height: window.innerHeight,
      onZoomEnd: (transform) => {
        this.zoomingFlag = false;
        self.setState({ transform }, () => {
          if (self.placeHolderRender) {
            self.proccessPlaceHolder();
          }
        });
      },
      onZoom: (transform) => {
        self.zoomingFlag = true;
      },
    });

    this.setState({
      root: this.treemap.getRoot(),
    });
  }

  render() {
    const { onChange, onClick } = this.props;
    const { root, transform } = this.state;

    return (
      <Styled>
        <div ref={this.mapRef} className="treemap" id="treemap">
          <canvas ref={this.canvasRef} className="canvas" />
          <TextLayer
            className="textLayer"
            transform={transform}
            width={window.innerWidth}
            height={window.innerHeight}
          >
            {root &&
              root.children &&
              root.children
                .filter((item) => {
                  const nodeWidth = item.x1 - item.x0;
                  return (
                    nodeWidth * transform.k > 30 &&
                    isElementInViewport(window, item, transform)
                  );
                })
                .map((sector) => {
                  const { data, children, ...rest } = sector;
                  const d = getSize(sector);
                  return (
                    <Sector
                      key={data.code}
                      sector={rest}
                      d={d}
                      transform={transform}
                      onClick={onClick}
                      onMouseOver={() => this.handleMouseOver(sector)}
                    >
                      <span className="category-name">{data.name}</span>
                      {children
                        .filter((item) => {
                          const nodeWidth = item.x1 - item.x0;
                          return (
                            nodeWidth * transform.k > 30 &&
                            isElementInViewport(window, item, transform)
                          );
                        })
                        .map((tile) => {
                          const { data, ...restTile } = tile;
                          const change =
                            (data.priceChange * 100) / data.lastPrice;
                          return (
                            <Tile
                              transform={transform}
                              key={(data.category = data.name)}
                              tile={restTile}
                              sector={rest}
                              name={data.name}
                              onMouseOver={(e, info) => onChange(e, info)}
                            >
                              <span className="tile-name">
                                {data.name}
                                <br />
                                {change.toFixed(2)}
                              </span>
                            </Tile>
                          );
                        })}
                    </Sector>
                  );
                })}
          </TextLayer>
        </div>
      </Styled>
    );
  }
}

export default Treemap;
