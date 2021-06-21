// noinspection SpellCheckingInspection

import { Observable } from "rxjs";
import { PoseStreamEvent } from "../Components/Camera/types";
import {
  map,
  scan,
  filter,
  distinctUntilChanged,
  debounce,
  debounceTime,
} from "rxjs/operators";
import { Keypoint } from "@tensorflow-models/pose-detection";
import { get } from "lodash";

export type TimedKeypoint = {
  t: number;
  keypoint: Keypoint | null;
};

export type TimedMultipleKeypoints = {
  t: number;
  keypoints: Keypoint[];
};

class Dynamics {
  private _poseStream: Observable<PoseStreamEvent>;

  constructor(poseStream: Observable<PoseStreamEvent>) {
    this._poseStream = poseStream;
  }

  public static extractKeypointWithName(
    keyPtName: string,
    stream: Observable<PoseStreamEvent>
  ): Observable<TimedKeypoint> {
    const now = new Date().getTime();
    return stream.pipe(
      map((event) => {
        let pt = null;
        if (event.poses.length > 0) {
          pt = event.poses[0].keypoints.find((pt) => (pt.name = keyPtName));
          if (pt === undefined) {
            pt = null;
          }
        }
        return { keypoint: pt, t: now };
      })
    );
  }

  public static extractKeypointsWithNames(
    keyPtNames: string[],
    stream: Observable<PoseStreamEvent>
  ): Observable<TimedMultipleKeypoints> {
    return stream.pipe(
      map((event) => {
        const now = new Date().getTime();
        let keypoints: Keypoint[] = [];
        if (event.poses.length > 0) {
          keypoints = event.poses[0].keypoints.filter((pt) => {
            let result = false;
            keyPtNames.forEach((name) => {
              if (name === pt.name) result = true;
            });
            return result;
          });
        }
        return {
          t: now,
          keypoints,
        };
      })
    );
  }

  public static accumulatePts(
    maxTimeWindow: number,
    stream: Observable<TimedMultipleKeypoints>
  ): Observable<TimedMultipleKeypoints[]> {
    let latestTime = 0;
    return stream.pipe(
      scan((acc: TimedMultipleKeypoints[], curr: TimedMultipleKeypoints) => {
        const now = Math.max(curr.t, latestTime);
        const minTime = now - maxTimeWindow;
        acc.push(curr);
        acc = acc.filter((pts) => pts.t >= minTime);
        return acc;
      }, [])
    );
  }

  public static detectSwipe(stream: Observable<PoseStreamEvent>) {
    const maxTimeWindow = 600;
    const str2 = Dynamics.extractKeypointsWithNames(["right_wrist"], stream);
    const str3 = str2.pipe(
      filter((data) => {
        const score = get(data, "keypoints[0].score", 0);
        return score > 0.5;
      })
    );
    const str4 = Dynamics.accumulatePts(300, str3);
    const str5: Observable<null | number> = str4.pipe(
      map((data) => {
        if (data.length < 2) {
          return null;
        }

        let minX = 9000;
        let maxX = -9000;
        let minT = 0;
        let maxT = 0;
        for (let i = 0; i < data.length; i++) {
          const x = data[i].keypoints[0].x;
          const t = data[i].t;
          if (x < minX) {
            minX = x;
            minT = t;
          }
          if (x > maxX) {
            maxX = x;
            maxT = t;
          }
        }

        if (maxT === minT) return null;
        return (maxX - minX) / (minT - maxT);
      })
    );
    const threshold = 0.70;
    const str6 = str5.pipe(
      map((v) => {
        const t = new Date().getTime();
        if (v === null) return { action: "no swipe", t };
        if (v < -threshold) return { action: "swipe -", t };
        if (v > threshold) return { action: "swipe +", t };
        return { action: "no swipe", t };
      }),
      distinctUntilChanged((a, b) => a.action === b.action),
      filter((v) => v.action !== "no swipe"),
      debounceTime(500)
    );
    return str6;
  }

  public static calculateVelocities(
    stream: Observable<TimedMultipleKeypoints[]>
  ): Observable<TimedMultipleKeypoints> {
    return stream.pipe(
      map((value) => {
        if (value.length === 0) {
          return {
            t: new Date().getTime(),
            keypoints: [],
          };
        }
        if (value.length === 1) {
          const keypoints = value[0].keypoints.map((k: Keypoint) => ({
            x: 0,
            y: 0,
            score: -2,
            name: k.name,
          }));
          return {
            t: value[0].t,
            keypoints,
          };
        }
        const first = value[0];
        const last = value[value.length - 1];
        const t1 = first.t;
        const t2 = last.t;
        const dt = t2 - t1;
        const velocityKeypoints: Keypoint[] = [];
        for (let i in first.keypoints) {
          const firstKp = first.keypoints[i];
          const lastKp = last.keypoints[i];
          let kp: Keypoint;
          if (
            lastKp.score === undefined ||
            lastKp.score < 0.5 ||
            firstKp.score === undefined ||
            firstKp.score < 0.5
          ) {
            kp = { name: firstKp.name, x: 0, y: 0, score: -1 };
          } else {
            kp = {
              name: firstKp.name,
              x: (firstKp.x - lastKp.x) / dt,
              y: (firstKp.y - lastKp.y) / dt,
            };
          }
          velocityKeypoints.push(kp);
        }
        return { t: t2, keypoints: velocityKeypoints };
      }),
      filter((v) => v !== null)
    );
  }
}

export default Dynamics;
