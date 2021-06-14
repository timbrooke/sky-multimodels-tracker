import { useRef, FC, useEffect } from "react";
import styled from "styled-components";

import "@tensorflow/tfjs-backend-webgl";
import "@tensorflow/tfjs-backend-wasm";
import "@mediapipe/pose";

const StyledVid = styled.video`
  -webkit-transform: scaleX(-1);
  transform: scaleX(-1);
  visibility: hidden;
  width: auto;
  height: auto;
`;

export type WebCamProps = {
  videoCallback: (vid: HTMLVideoElement) => void;
};

const Webcam: FC<WebCamProps> = ({ videoCallback }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  useEffect(() => {
    if (videoRef.current !== null) {
      videoCallback(videoRef.current);
    }
  }, [videoRef, videoCallback]);

  return <StyledVid ref={videoRef} id="video" playsInline={true} />;
};

export default Webcam;
