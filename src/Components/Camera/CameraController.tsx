import Webcam from "./Webcam";
import { useEffect, useRef } from "react";
import PoseAnalysis from "./PoseAnalysis";

const CameraController = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  function handleVideo(video: HTMLVideoElement) {
    videoRef.current = video;
  }

  async function main() {
    if(canvasRef.current && videoRef.current) {
      const poseAnalysis = new PoseAnalysis(videoRef.current, canvasRef.current);
      poseAnalysis.app();
    }
  }

  useEffect(() => {
    if (canvasRef.current !== null && videoRef.current !== null) {
      main();
    }
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
      <Webcam videoCallback={handleVideo} />
    </div>
  );
};

export default CameraController;
