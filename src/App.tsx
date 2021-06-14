import React from "react";
import "./App.css";
import OptionsPanel from "./poselibraries/OptionsPanel";
import CameraController from "./Components/Camera/CameraController";

function App() {
  return (
    <div>
      <OptionsPanel />
      <CameraController />
    </div>
  );
}

export default App;
