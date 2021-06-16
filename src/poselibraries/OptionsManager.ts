import { ParamsState, VideoSizeOption } from "./types";
import { SupportedModels } from "@tensorflow-models/pose-detection";
import { cloneDeep } from "lodash";

type OptionSelection = {
  camera: {
    targetFPS: number;
    sizeOption: string;
  };
  backend: string;
  modelConfig: { scoreThreshold: number; maxPoses: number; type: string };
  model: string;
  cpuForward: boolean;
  webglPack: boolean;
  enforceFloat16: boolean;
  enableFloat32: boolean;
  webglVersion: number;
};

const modelOptions = ["Posenet", "Movenet", "Blazepose"];

const typeOptionsFull = [
  ["None"],
  ["lightning", "thunder"],
  ["lite", "full", "heavy"],
];

class OptionsManager {
  /**
   * Records each flag's default value under the runtime environment and is a
   * constant in runtime.
   */
  TUNABLE_FLAG_DEFAULT_VALUE_MAP: any;
  stringValueMap = {};

  private _state: ParamsState = {
    isModelChanged: false,
    camera: {
      targetFPS: 60,
      sizeOption: "640 X 480" as VideoSizeOption,
    },
    model: SupportedModels.MoveNet,
    flags: {
      WEBGL_VERSION: 2,
      WEBGL_CPU_FORWARD: true,
      WEBGL_PACK: true,
      WEBGL_RENDER_FLOAT32_CAPABLE: true,
      WEBGL_FLUSH_THRESHOLD: -1,
    },
    modelConfig: { scoreThreshold: 0.5, type: "lightning", maxPoses: 1 },
    backend: "tfjs-webgl",
  };
  private _optionSelection: OptionSelection = {
    camera: {
      targetFPS: 30,
      sizeOption: "640 X 480",
    },
    backend: "tfjs-webgl",
    modelConfig: { scoreThreshold: 0.5, type: "lightning", maxPoses: 1 },
    model: "Movenet",
    cpuForward: true,
    webglPack: true,
    enforceFloat16: false,
    enableFloat32: true,
    webglVersion: 2,
  };

  /*
        .isTargetFPSChanged = true;
        .isSizeOptionChanged



    async setupDatGui(modelChoice:string){

    }



 */

  handleOptionsChanged(incoming: OptionSelection) {
    const changes = {
      isTargetFPSChanged: false,
      isSizeOptionChanged: false,
    };

    const oldVersion = this._optionSelection;
    if (incoming.camera.targetFPS !== oldVersion.camera.targetFPS) {
      changes.isTargetFPSChanged = true;
    }

    const outgoing = cloneDeep(incoming);
    let modelIndex = modelOptions.findIndex((m) => m === incoming.model);
    if (modelIndex === -1) {
      modelIndex = 0;
      outgoing.model = modelOptions[0];
    }
    const typeOptions = typeOptionsFull[modelIndex];

    return {
      options: outgoing,
      typeOptions,
    };
  }

  get params() {
    return this._state;
  }

  get optionSelection() {
    return this._optionSelection;
  }
}

export default OptionsManager;
