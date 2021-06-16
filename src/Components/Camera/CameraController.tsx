import Webcam from "./Webcam";
import { useEffect, useRef } from "react";
import PoseAnalysis from "./PoseAnalysis";
import { PoseStreamEvent } from "./types";
import { Observable } from "rxjs";

type CameraControllerProps = {
  streamCallback?: (stream: Observable<PoseStreamEvent>) => void;
};

const CameraController: React.FC<CameraControllerProps> = ({
  streamCallback,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const poseAnalysisRef = useRef<PoseAnalysis>(null);

  function handleVideo(video: HTMLVideoElement) {
    videoRef.current = video;
  }

  useEffect(() => {
    async function prepare() {
      if (poseAnalysisRef.current) {
        if (streamCallback) {
          streamCallback(poseAnalysisRef.current.poseDataStream);
        }
      } else {
        if (canvasRef.current !== null && videoRef.current !== null) {
          if (canvasRef.current && videoRef.current) {
            const poseAnalysis = new PoseAnalysis(
              videoRef.current,
              canvasRef.current
            );
            await poseAnalysis.initialize();
            // @ts-ignore
            poseAnalysisRef.current = poseAnalysis;
            if (streamCallback) {
              streamCallback(poseAnalysis.poseDataStream);
            }
          }
        }
      }
    }
    prepare();
  }, [canvasRef, videoRef, streamCallback]);

  return (
    <div>
      <canvas ref={canvasRef} />
      <Webcam videoCallback={handleVideo} />
    </div>
  );
};

export default CameraController;
