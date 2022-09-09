import { isElementInViewport } from "./d3";
import { Sector, Tile } from "./style";

export default function ChildMap({ childs, transform, onChange }) {
  return childs
    .filter((item) => {
      const nodeWidth = item.x1 - item.x0;
      return (
        nodeWidth * transform.k > 30 &&
        isElementInViewport(window, item, transform)
      );
    })
    .map((sector) => {
      const { data, children, ...rest } = sector;
      return (
        <Sector key={data.code} sector={rest} transform={transform}>
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
              const change = (data.priceChange * 100) / data.lastPrice;
              return (
                <Tile
                  key={(data.category = data.name)}
                  tile={restTile}
                  sector={rest}
                  transform={transform}
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
    });
}
