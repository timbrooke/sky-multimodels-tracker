import React, { useEffect, useRef } from "react";
import "./App.css";
import { get } from "lodash";
import OptionsPanel from "./poselibraries/OptionsPanel";
import CameraController from "./Components/Camera/CameraController";
import { Observable } from "rxjs";
import { PoseStreamEvent } from "./Components/Camera/types";
import Dynamics, { TimedMultipleKeypoints } from "./Dynamics/Dynamics";

type GraphDatum = {
  x: number;
  y: number;
};

type MinMaxValues = {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
};

type GraphData = GraphDatum[];

function calcMinMax(data: GraphData): {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
} {
  let xMin = Number.MAX_VALUE;

  let xMax = Number.MIN_VALUE;

  data.forEach(({ x, y }) => {
    xMin = Math.min(x, xMin);

    xMax = Math.max(x, xMax);
  });
  return { xMin, yMin: -2, xMax: xMin + 3000, yMax: 2 };
}

function toGraph(
  minMax: MinMaxValues,
  graphWidth: number,
  graphHeight: number,
  data: GraphData
): GraphData {
  const xs = minMax.xMin;
  const ys = minMax.yMin;
  let lx = minMax.xMax - xs;
  let ly = minMax.yMax - ys;
  if (lx === 0) {
    lx = 1;
  }
  if (ly === 0) {
    ly = 1;
  }
  return data.map(({ x, y }) => ({
    x: (graphWidth * (x - xs)) / lx,
    y: (graphHeight * (y - ys)) / ly,
  }));
}

function createGraph(graphData: GraphData) {
  const element: HTMLElement | null = document.getElementById("graphArea");

  const minMax = calcMinMax(graphData);
  const graphCoords = toGraph(minMax, 600, 300, graphData);
  const htmlString = graphCoords
    .map(({ x, y }, idx) => {
      const xx = graphData[idx].x;
      const yy = graphData[idx].y;
      let colour = Math.abs(yy) > 0.2 ? "green" : "blue";
      if (Math.abs(yy) > 0.4) {
        colour = "orange";
      }
      return `<circle cx="${x}" cy="${y}" r="3" fill="${colour}" />`;
    })
    .join("");

  if (element) {
    element.innerHTML = htmlString; // `<circle cx="150" cy="150" r="5" fill="orangered"/>`;
  }
}

type AccType = {
  mode: string;
  inactive: number;
  total: number;
};

function App() {
  const printFlag = useRef<boolean>(false);

  function handleStreamCallback(stream: Observable<PoseStreamEvent>) {
    const str2 = Dynamics.extractKeypointsWithNames(["right_wrist"], stream);
    const str3 = Dynamics.accumulatePts(75, str2);
    const str4 = Dynamics.calculateVelocities(str3);
    const str5 = Dynamics.accumulatePts(3000, str4);
    const str6 = Dynamics.detectSwipe(stream);

    str6.subscribe((next) => {
      console.log("swipe", next);
    });

    str5.subscribe((data: TimedMultipleKeypoints[]) => {
      const newData: GraphData = data.map((value) => {
        const y = get(value, "keypoints[0].x", 0);
        return {
          x: value.t,
          y: y,
        };
      });

      createGraph(newData);
    });
  }

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      console.log(e);
      if (e.key === " ") {
        console.log("SPACE");
        printFlag.current = true;
      }
    });
  }, []);

  return (
    <div>
      <OptionsPanel />
      <CameraController streamCallback={handleStreamCallback} />
      <svg width={600} height={300}>
        <rect width={600} height={300} fill={"grey"} /> <g id="graphArea" />
      </svg>
    </div>
  );
}

export default App;
