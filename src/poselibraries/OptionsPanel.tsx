import Params from "./params";
import "react-dat-gui/dist/index.css";
import DatGui, {
  DatBoolean,
  DatFolder,
  DatNumber,
  DatSelect,
} from "react-dat-gui";
import { useRef, useState } from "react";
import { SupportedModels } from "@tensorflow-models/pose-detection";
import OptionsManager from "./OptionsManager";

const OptionsPanel = () => {
  const optionManagerRef = useRef(new OptionsManager());

  const params = Params.getInstance();
  const modelOptions = ["Posenet", "Movenet", "Blazepose"];


  let typeOptions =  ["lightning", "thunder"] // typeOptionsFull[0];
  let backendOptions = params.MODEL_BACKEND_MAP[SupportedModels.MoveNet];
  let webglOptions = ["1", "2"];
  let glFlushOptions = [0, 1, 2, -1, 0.25];

  const [data, setData] = useState(optionManagerRef.current.optionSelection);

  function handleUpdate(updates: any) {
    optionManagerRef.current.handleOptionsChanged(updates);
    setData(updates);
  }

  return (
    <DatGui data={data} onUpdate={handleUpdate}>
      <DatFolder title={"Camera"} closed={false}>
        <DatNumber
          label="target FPS"
          min={1}
          max={90}
          step={1}
          path={"camera.targetFPS"}
        />
        <DatSelect
          label="size option"
          options={params.VIDEO_SIZE_ARRAY}
          path={"camera.sizeOption"}
        />
      </DatFolder>
      <DatFolder title={"Model"} closed={false}>
        <DatSelect label="model" options={modelOptions} path={"model"} />
        <DatSelect label="type" options={typeOptions} path={"type"} />
        <DatNumber
          label="score threshold"
          min={0}
          max={1}
          step={0.01}
          path={"modelConfig.scoreThreshold"}
        />
      </DatFolder>
      <DatFolder title={"Backend"} closed={false}>
        <DatSelect
          label="runtime-backend"
          options={backendOptions}
          path={"backend"}
        />
        <DatSelect
          label="webgl version"
          options={webglOptions}
          path={"webglVersion"}
        />
        <DatBoolean label="cpu forward" path={"cpuForward"} />
        <DatBoolean label="webgl pack" path={"webglPack"} />
        <DatBoolean label="enforce float16" path={"enforceFloat16"} />
        <DatBoolean label="enable float32" path={"enableFloat32"} />
        <DatSelect
          label="GL flush wait"
          options={glFlushOptions}
          path={"glFlushOptions"}
        />
      </DatFolder>
    </DatGui>
  );
};

export default OptionsPanel;
