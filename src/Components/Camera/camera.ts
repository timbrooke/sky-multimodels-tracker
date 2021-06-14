import { CameraParams } from "../../poselibraries/types";
import Params from "../../poselibraries/params";
import { isMobile } from "../../poselibraries/util";
import * as posedetection from "@tensorflow-models/pose-detection";
import { Keypoint, Pose } from "@tensorflow-models/pose-detection";

export class Camera {
  private readonly _video: HTMLVideoElement;
  private _canvas: HTMLCanvasElement;
  private readonly _ctx: CanvasRenderingContext2D | null;

  constructor(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
    this._video = video;
    this._canvas = canvas;
    this._ctx = this._canvas.getContext("2d");
  }

  static async initCamera(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    cameraParam: CameraParams
  ) {
    const params = Params.getInstance();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        "Browser API navigator.mediaDevices.getUserMedia not available"
      );
    }

    const { targetFPS, sizeOption } = cameraParam;
    const $size: { width: number; height: number } =
      params.VIDEO_SIZE[sizeOption];

    console.log("$size", $size, params, params.VIDEO_SIZE);

    const videoConfig = {
      video: {
        facingMode: "user",
        // Only setting the video to a specified size for large screen, on
        // mobile devices accept the default size.
        width: isMobile() ? params.VIDEO_SIZE["360 X 270"].width : $size.width,
        height: isMobile()
          ? params.VIDEO_SIZE["360 X 270"].height
          : $size.height,
        frameRate: {
          ideal: targetFPS,
        },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

    const camera = new Camera(video, canvas);
    camera._video.srcObject = stream;

    await new Promise((resolve) => {
      camera._video.onloadedmetadata = () => {
        resolve(video);
      };
    });

    camera._video.play();

    const videoWidth = camera._video.videoWidth;
    const videoHeight = camera._video.videoHeight;
    // Must set below two lines, otherwise video element doesn't show.
    camera._video.width = videoWidth;
    camera._video.height = videoHeight;

    camera._canvas.width = videoWidth;
    camera._canvas.height = videoHeight;
    // const canvasContainer = document.querySelector('.canvas-wrapper');
    // canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px`;

    // Because the image from camera is mirrored, need to flip horizontally.
    if (camera._ctx !== null) {
      camera._ctx.translate(camera._video.videoWidth, 0);
      camera._ctx.scale(-1, 1);
    }

    return camera;
  }
  drawCtx() {
    if (this._ctx === null) return;
    this._ctx.drawImage(
      this._video,
      0,
      0,
      this._video.videoWidth,
      this._video.videoHeight
    );
  }

  clearCtx() {
    if (this._ctx === null) return;
    this._ctx.clearRect(0, 0, this._video.videoWidth, this._video.videoHeight);
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param poses A list of poses to render.
   */
  drawResults(poses: Pose[]) {
    for (const pose of poses) {
      this.drawResult(pose);
    }
  }

  /**
   * Draw the keypoints and skeleton on the video.
   * @param pose A pose with keypoints to render.
   */
  drawResult(pose: Pose) {
    if (pose.keypoints != null) {
      this.drawKeypoints(pose.keypoints);
      this.drawSkeleton(pose.keypoints);
    }
  }

  /**
   * Draw the keypoints on the video.
   * @param keypoints A list of keypoints.
   */
  drawKeypoints(keypoints: Keypoint[]) {
    const params = Params.getInstance();
    if (this._ctx === null) return;
    const keypointInd = posedetection.util.getKeypointIndexBySide(
      params.STATE.model
    );
    this._ctx.fillStyle = "White";
    this._ctx.strokeStyle = "White";
    this._ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

    for (const i of keypointInd.middle) {
      this.drawKeypoint(keypoints[i]);
    }

    this._ctx.fillStyle = "Green";
    for (const i of keypointInd.left) {
      this.drawKeypoint(keypoints[i]);
    }

    this._ctx.fillStyle = "Orange";
    for (const i of keypointInd.right) {
      this.drawKeypoint(keypoints[i]);
    }
  }

  drawKeypoint(keypoint: Keypoint) {
    const params = Params.getInstance();

    if (this._ctx === null) return;

    // If score is null, just show the keypoint.
    const score = keypoint.score != null ? keypoint.score : 1;
    const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

    if (score >= scoreThreshold) {
      const circle = new Path2D();
      circle.arc(keypoint.x, keypoint.y, params.DEFAULT_RADIUS, 0, 2 * Math.PI);
      this._ctx.fill(circle);
      this._ctx.stroke(circle);
    }
  }

  /**
   * Draw the skeleton of a body on the video.
   * @param keypoints A list of keypoints.
   */
  drawSkeleton(keypoints: Keypoint[]) {
    const params = Params.getInstance();
    if (this._ctx === null) return;
    this._ctx.fillStyle = "White";
    this._ctx.strokeStyle = "White";
    this._ctx.lineWidth = params.DEFAULT_LINE_WIDTH;

    posedetection.util
      .getAdjacentPairs(params.STATE.model)
      .forEach(([i, j]) => {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        // If score is null, just show the keypoint.
        const score1 = kp1.score != null ? kp1.score : 1;
        const score2 = kp2.score != null ? kp2.score : 1;
        const scoreThreshold = params.STATE.modelConfig.scoreThreshold || 0;

        if (
          score1 >= scoreThreshold &&
          score2 >= scoreThreshold &&
          this._ctx !== null
        ) {
          this._ctx.beginPath();
          this._ctx.moveTo(kp1.x, kp1.y);
          this._ctx.lineTo(kp2.x, kp2.y);
          this._ctx.stroke();
        }
      });
  }

  get video(): HTMLVideoElement {
    return this._video;
  }
}
