import { SupportedModels } from "@tensorflow-models/pose-detection";
import { Flags } from "@tensorflow/tfjs-core/dist/environment";

export enum VideoSizeOption {
  "640 X 480" = "640 X 480",
  "640 X 360" = "640 X 360",
  "360 X 270" = "360 X 270",
}

export type VideoSizeList = {
  [key in VideoSizeOption]: { width: number; height: number };
};

export type CameraParams = {
  targetFPS: number;
  sizeOption: VideoSizeOption;
};

export type ParamsState = {
  isModelChanged: boolean;
  camera: CameraParams;
  backend: string;
  flags: Flags;
  modelConfig: { scoreThreshold: number, type:string, maxPoses:number };
  model: SupportedModels;
};

export enum TUNABLE_FLAG {
  WEBGL_VERSION = "WEBGL_VERSION",
  WASM_HAS_SIMD_SUPPORT = "WASM_HAS_SIMD_SUPPORT",
  WASM_HAS_MULTITHREAD_SUPPORT = "WASM_HAS_MULTITHREAD_SUPPORT",
  WEBGL_CPU_FORWARD = "WEBGL_CPU_FORWARD",
  WEBGL_PACK = "WEBGL_PACK",
  WEBGL_FORCE_F16_TEXTURES = "WEBGL_FORCE_F16__TEXTURES",
  WEBGL_RENDER_FLOAT32_CAPABLE = "WEBGL_RENDER_FLOAT32__CAPABLE",
  WEBGL_FLUSH_THRESHOLD = "WEBGL_FLUSH_THRESHOLD",
  CHECK_COMPUTATION_FOR_ERRORS = "CHECK_COMPUTATION_FOR_ERRORS",
}
