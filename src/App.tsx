import React, { useState } from "react";
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

type GraphData = GraphDatum[];

function App() {
  function handleStreamCallback(stream: Observable<PoseStreamEvent>) {
    const str2 = Dynamics.extractKeypointsWithNames(["nose"], stream);
    const str3 = Dynamics.accumulatePts(100, str2);
    const str4 = Dynamics.calculateVelocities(str3);
    const str5 = Dynamics.accumulatePts(300, str4);

    str5.subscribe((data: TimedMultipleKeypoints[]) => {
      console.log(data);
      const newData: GraphData = data.map((value) => {
        const y = get(value, "keypoints[0].x", 0);
        return {
          x: value.t,
          y: y,
        };
      });
      // console.log(graphData)
    });
  }

  return (
    <div>
      <OptionsPanel />
      <CameraController streamCallback={handleStreamCallback} />
      <svg width={300} height={300}>
        <rect width={300} height={300} fill={"grey"} />{" "}
      </svg>
    </div>
  );
}

export default App;
