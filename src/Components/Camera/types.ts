import {Pose} from "@tensorflow-models/pose-detection";

export type PoseStreamEvent = {
    poses: Pose[];
    modelName: string;
}
