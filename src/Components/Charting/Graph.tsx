import { FC } from "react";

export type GraphData = { x: number; y: number }[];

type GraphProps = {
  width: number;
  height: number;
  data: GraphData;
};

function calcMinMax(data: GraphData) {
  let xMin = Number.MAX_VALUE;
  let yMin = Number.MAX_VALUE;
  let xMax = Number.MIN_VALUE;
  let yMax = Number.MIN_VALUE;
  data.forEach(({ x, y }) => {
    xMin = Math.min(x, xMin);
    yMin = Math.min(y, yMin);
    xMax = Math.max(x, xMax);
    yMax = Math.max(y, yMax);
  });
}

const Graph: FC<GraphProps> = ({ width, height, data }) => {
  return (
    <svg width={width} height={height}>
      <rect width={width} height={height} fill="lightgrey" />
    </svg>
  );
};

export default Graph;
