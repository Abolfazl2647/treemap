import styled from "@emotion/styled";
import { memo } from "react";

export default styled.div`
  overflow: hidden;
  height: 100%;
  width: 100%;

  #treemap {
    background-color: black;
    transform-origin: 0 0 0;
  }

  #treemap,
  .textLayer {
    height: 100%;
    width: 100%;
    overflow: hidden;
    transform-origin: 0 0 0;
    text-rendering: optimizeLegibility;
    backface-visibility: hidden;
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: none;
  }

  canvas.canvas {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
    height: 100%;
    width: 100%;
  }
`;

export const TextLayer = styled.div`
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  ${({ transform }) => {
    return `transform: translate3d(${transform.x}px, ${transform.y}px, 0px) scale(${transform.k})`;
  }}
`;

export const Sector = memo(styled.div`
  top: 0;
  left: 0;
  position: absolute;
  width: ${({ sector }) => sector.x1 - sector.x0}px;
  height: ${({ sector }) => sector.y1 - sector.y0}px;
  transform: ${({ sector }) =>
    `translate3d(${sector.x0}px, ${sector.y0}px, 0px)`};
  border: 2px solid black;
  box-sizing: border-box;

  .category-name {
    text-align: right;
    direction: rtl;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 100%;
    display: flex;
    color: white;
    max-width: 100%;
    padding: 2px;
    box-sizing: border-box;
    align-items: center;
    background-color: black;
    justify-content: flex-start;
    white-space: nowrap;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;

    ${({ transform, d }) => {
      const fontSize = Math.min(d * 10) / transform.k;
      return `font-size: ${Math.max(fontSize, 2)}px;line-height:${Math.max(
        fontSize,
        3
      )}px`;
    }}
  }

  &:hover {
    border: 2px solid #ffd84c;
    .category-name {
      color: black;
      background-color: #ffd84c;
    }
  }
`);

export const Tile = memo(styled.div`
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  shape-rendering: crispEdges;
  -webkit-font-smoothing: antialiased;
  width: ${({ tile }) => tile.x1 - tile.x0}px;
  height: ${({ tile }) => tile.y1 - tile.y0}px;
  text-shadow: rgba(50, 49, 54, 0.28) 0.015em 0.015em 0px;
  transform: ${({ tile, sector }) =>
    `translate3d(${tile.x0 - sector.x0}px, ${tile.y0 - sector.y0}px, 0px)`};

  .tile-name {
    color: white;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;

    ${({ tile }) => {
      const nodeWidth = tile.x1 - tile.x0;
      const nodeHeight = tile.y1 - tile.y0;
      const fontSize = Math.min(nodeWidth, nodeHeight) / 5;
      return `font-size:${fontSize}px;line-height:${fontSize}px`;
    }}
  }
`);
