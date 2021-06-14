import * as posedetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';

import * as params from './params';

class OptionsManager {

    /**
     * Records each flag's default value under the runtime environment and is a
     * constant in runtime.
     */
    TUNABLE_FLAG_DEFAULT_VALUE_MAP;
    stringValueMap = {}

    async setupDatGui(modelChoice:string){

    }

}

export default OptionsManager;
