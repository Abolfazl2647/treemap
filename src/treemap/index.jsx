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

    this.colorScale = d3
      .scaleOrdinal()
      .domain([-3, -2, -1, 0, 1, 2, 3])
      .range(colorRange);
  }

  componentDidMount() {
    this.renderTreemap();
  }

  componentDidUpdate(prevProps) {
    const { sortValue, data } = this.props;
    const { sortValue: prevSortvalue, data: prevData } = prevProps;
    if (sortValue !== prevSortvalue || data !== prevData) {
      this.renderTreemap();
    }
  }

  renderTreemap() {
    const self = this;
    const { transform } = this.state;
    const { sortValue, data } = this.props;

    const treemap = new TreeMap({
      data,
      transform,
      canvasRef: this.canvasRef.current,
      ref: this.mapRef.current,
      sortKey: sortValue,
      width: window.innerWidth,
      height: window.innerHeight,
      onZoomEnd: (transform) => {
        self.setState({ transform });
      },
    });

    this.setState({
      root: treemap.getRoot(),
    });
  }

  render() {
    const { onClick } = this.props;
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
                              onClick={onClick}
                              // onMouseOver={(e, info) => onChange(e, info)}
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

// import * as d3 from "d3";
// import React, { useEffect, useState } from "react";
// import TreeMap, { isElementInViewport, colorRange, getSize } from "./d3";
// import Styled, { TextLayer, Sector, Tile } from "./style";

// export default function Treemap({ sortValue, data, onClick }) {
//   const [root, setRoot] = useState();
//   const [transform, setTransform] = useState();
//   const mapRef = React.useRef();
//   const canvasRef = React.useRef();

//   useEffect(() => {
//     const treemap = new TreeMap({
//       data,
//       transform,
//       canvasRef: canvasRef.current,
//       ref: mapRef.current,
//       sortKey: sortValue,
//       width: window.innerWidth,
//       height: window.innerHeight,
//       onZoomEnd: (transform) => {
//         setTransform(transform);
//       },
//     });

//     setRoot(treemap.getRoot());
//   }, [sortValue, data, transform]);

//   return (
//     <Styled>
//       <div ref={mapRef} className="treemap" id="treemap">
//         <canvas ref={canvasRef} className="canvas" />
//         <TextLayer
//           className="textLayer"
//           transform={transform}
//           width={window.innerWidth}
//           height={window.innerHeight}
//         >
//           {root &&
//             root.children &&
//             root.children
//               .filter((item) => {
//                 const nodeWidth = item.x1 - item.x0;
//                 return (
//                   nodeWidth * transform.k > 30 &&
//                   isElementInViewport(window, item, transform)
//                 );
//               })
//               .map((sector) => {
//                 const { data, children, ...rest } = sector;
//                 const d = getSize(sector);
//                 return (
//                   <Sector
//                     key={data.code}
//                     sector={rest}
//                     d={d}
//                     transform={transform}
//                   >
//                     <span className="category-name">{data.name}</span>
//                     {children
//                       .filter((item) => {
//                         const nodeWidth = item.x1 - item.x0;
//                         return (
//                           nodeWidth * transform.k > 30 &&
//                           isElementInViewport(window, item, transform)
//                         );
//                       })
//                       .map((tile) => {
//                         const { data, ...restTile } = tile;
//                         const change =
//                           (data.priceChange * 100) / data.lastPrice;
//                         return (
//                           <Tile
//                             transform={transform}
//                             key={(data.category = data.name)}
//                             tile={restTile}
//                             sector={rest}
//                             name={data.name}
//                             onClick={onClick}
//                             // onMouseOver={(e, info) => onChange(e, info)}
//                           >
//                             <span className="tile-name">
//                               {data.name}
//                               <br />
//                               {change.toFixed(2)}
//                             </span>
//                           </Tile>
//                         );
//                       })}
//                   </Sector>
//                 );
//               })}
//         </TextLayer>
//       </div>
//     </Styled>
//   );
//}
