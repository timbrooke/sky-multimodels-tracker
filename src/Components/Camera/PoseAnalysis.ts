import { Camera } from "./camera";
import { setBackendAndEnvFlags } from "../../poselibraries/util";
import { ParamsState, VideoSizeOption } from "../../poselibraries/types";
import {
  PoseDetector,
  SupportedModels,
} from "@tensorflow-models/pose-detection";
import * as posedetection from "@tensorflow-models/pose-detection";

import {Observable, Subject} from "rxjs";
import { PoseStreamEvent } from "./types";

class PoseAnalysis {
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

  private _dataStream: Subject<PoseStreamEvent> = new Subject();

  private readonly _video: HTMLVideoElement;
  private readonly _canvas: HTMLCanvasElement;
  private _detector: PoseDetector | null = null;
  private _camera: Camera | null = null;
  private _startInferenceTime: number = 0;

  private _numInferences = 0;
  private _inferenceTimeSum = 0;
  private _lastPanelUpdate = 0;
  private _rafId = 0;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this._video = video;
    this._canvas = canvas;
    this.initialize();
  }

  async createDetector(): Promise<PoseDetector | null> {
    switch (this._state.model) {
      case posedetection.SupportedModels.PoseNet:
        return posedetection.createDetector(this._state.model, {
          quantBytes: 4,
          architecture: "MobileNetV1",
          outputStride: 16,
          inputResolution: { width: 500, height: 500 },
          multiplier: 0.75,
        });

      case posedetection.SupportedModels.BlazePose:
        let runtime = this._state.backend.split("-")[0];
        if (runtime === "mediapipe") {
          return posedetection.createDetector(this._state.model, {
            runtime,
            modelType: this._state.modelConfig.type,
            solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/pose",
          });
        } else if (runtime === "tfjs") {
          return posedetection.createDetector(this._state.model, {
            runtime,
            modelType: this._state.modelConfig.type,
          });
        } else {
          // TODO Not sure what to do here???
          // This possibility seemed to have been missed
          return null;
        }

      case posedetection.SupportedModels.MoveNet:
        const modelType =
          this._state.modelConfig.type === "lightning"
            ? posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING
            : posedetection.movenet.modelType.SINGLEPOSE_THUNDER;
        return posedetection.createDetector(this._state.model, { modelType });
    }
  }

  beginEstimatePosesStats() {
    this._startInferenceTime = (performance || Date).now();
  }

  endEstimatePosesStats() {
    const endInferenceTime = (performance || Date).now();
    this._inferenceTimeSum += endInferenceTime - this._startInferenceTime;
    ++this._numInferences;

    const panelUpdateMilliseconds = 1000;
    if (endInferenceTime - this._lastPanelUpdate >= panelUpdateMilliseconds) {
      // const averageInferenceTime = this._inferenceTimeSum / this._numInferences;
      this._inferenceTimeSum = 0;
      this._numInferences = 0;
      // TODO add stats GUI back in
      //stats.customFpsPanel.update(
      //    1000.0 / averageInferenceTime, 120 /* maxValue */);
      this._lastPanelUpdate = endInferenceTime;
    }
  }

  async renderResult() {
    if (this._camera !== null) {
      if (this._camera.video.readyState < 2) {
        await new Promise((resolve, error) => {
          if (this._camera) {
            this._camera.video.onloadeddata = () => {
              if (this._camera) {
                resolve(this._camera.video);
              } else {
                error("Camera no longer exists");
              }
            };
          }
        });
      }
    }

    // FPS only counts the time it takes to finish estimatePoses.
    this.beginEstimatePosesStats();

    if (!this._camera || !this._detector) return;
    const poses = await this._detector.estimatePoses(this._camera.video, {
      maxPoses: this._state.modelConfig.maxPoses,
      flipHorizontal: false,
    });

    this.endEstimatePosesStats();

    this._dataStream.next({ poses: poses, modelName: "movenet" });

    this._camera.drawCtx();

    // The null check makes sure the UI is not in the middle of changing to a
    // different model. If during model change, the result is from an old model,
    // which shouldn't be rendered.
    if (poses.length > 0 && !this._state.isModelChanged) {
      this._camera.drawResults(poses);
    }
  }

  async renderPrediction() {
    // await checkGuiUpdate();

    if (!this._state.isModelChanged) {
      await this.renderResult();
    }

    this._rafId = requestAnimationFrame(this.renderPrediction.bind(this));
  }

  async initialize() {
    this._camera = await Camera.initCamera(
      this._video,
      this._canvas,
      this._state.camera
    );

    await setBackendAndEnvFlags(this._state.flags, this._state.backend);

    this._detector = await this.createDetector();

    if (this._detector === null) {
      console.log("DISASTER IT FELL THROUGH THE CRACKS");
      return;
    }

    this.renderPrediction();
  }

  get poseDataStream():Observable<PoseStreamEvent>{
    return this._dataStream as Observable<PoseStreamEvent>
  }
}

export default PoseAnalysis;
