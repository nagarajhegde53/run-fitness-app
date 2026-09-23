const API_URL = "https://run-fitness-app.onrender.com";

// ======================================================
// DOM ELEMENTS
// ======================================================

const goalCard =
document.getElementById("goalCard");

const workoutCard =
document.getElementById("workoutCard");

const successCard =
document.getElementById("successCard");

const goalButtons =
document.querySelectorAll(".goal-option");

const customGoalBtn =
document.getElementById("customGoalBtn");

const customGoalBox =
document.getElementById("customGoalBox");

const customGoalInput =
document.getElementById("customGoalInput");

const setCustomGoalBtn =
document.getElementById("setCustomGoalBtn");

const startWorkoutBtn =
document.getElementById("startWorkoutBtn");

const selectedGoalElement =
document.getElementById("selectedGoal");

const targetBadge =
document.getElementById("targetBadge");

const targetReps =
document.getElementById("targetReps");

const pushupCount =
document.getElementById("pushupCount");

const repProgressFill =
document.getElementById("repProgressFill");

const progressPercent =
document.getElementById("progressPercent");

const aiStatus =
document.getElementById("aiStatus");

const aiStatusCard =
document.getElementById("aiStatusCard");

const cameraPlaceholder =
document.getElementById("cameraPlaceholder");

const cameraContainer =
document.getElementById("cameraContainer");

const cameraVideo =
document.getElementById("cameraVideo");

const openCameraBtn =
document.getElementById("openCameraBtn");

const closeCameraBtn =
document.getElementById("closeCameraBtn");

const pauseBtn =
document.getElementById("pauseBtn");

const pauseIcon =
document.getElementById("pauseIcon");

const pauseText =
document.getElementById("pauseText");

const stopSaveBtn =
document.getElementById("stopSaveBtn");

const finalCount =
document.getElementById("finalCount");

const finalTarget =
document.getElementById("finalTarget");

const successMessage =
document.getElementById("successMessage");

const newWorkoutBtn =
document.getElementById("newWorkoutBtn");

const recentActivities =
document.getElementById("recentActivities");

const refreshActivitiesBtn =
document.getElementById("refreshActivitiesBtn");

const backToMenuBtn =
document.getElementById("backToMenuBtn");

// ======================================================
// WORKOUT STATE
// ======================================================

let selectedGoal = 50;

let currentReps = 0;

let workoutFinished = false;

let workoutRunning = false;

let workoutPaused = false;

let stream = null;

// ======================================================
// AI STATE
// ======================================================

let detector = null;

let classifier = null;

let animationFrameId = null;

let aiRunning = false;

let modelLoading = false;

// ======================================================
// REP STATE MACHINE
// ======================================================

// A valid rep must be:
//
// UP
//  ↓
// DOWN
//  ↓
// UP
//
// Only then do we count +1.

let repState = "WAITING_FOR_UP";

let lastClassifierState = null;

let classifierStateFrames = 0;

let lastRepTime = 0;


// Minimum stable frames required before
// accepting a new UP/DOWN phase.
const REQUIRED_STATE_FRAMES = 8;


// Safety cooldown between completed reps.
const MIN_REP_INTERVAL = 1000;

// ======================================================
// AI SETTINGS
// ======================================================

const MIN_KEYPOINT_SCORE = 0.35;

// ======================================================
// INITIAL UI
// ======================================================

function initializeUI() {


selectedGoalElement.textContent =
    selectedGoal;

targetReps.textContent =
    selectedGoal;

targetBadge.textContent =
    `Goal: ${selectedGoal}`;

pushupCount.textContent =
    "0";

progressPercent.textContent =
    "0";

repProgressFill.style.width =
    "0%";

workoutCard.hidden = true;

successCard.hidden = true;

goalCard.hidden = false;

if (customGoalBox) {
    customGoalBox.hidden = true;
}

if (cameraContainer) {
    cameraContainer.hidden = true;
}

if (cameraPlaceholder) {
    cameraPlaceholder.hidden = false;
}

if (closeCameraBtn) {
    closeCameraBtn.hidden = true;
}

if (openCameraBtn) {
    openCameraBtn.hidden = false;
}

if (pauseBtn) {
    pauseBtn.disabled = true;
}

if (stopSaveBtn) {
    stopSaveBtn.disabled = true;
}

setAIStatus(
    "Choose a target to begin."
);


}

// ======================================================
// GOAL BUTTONS
// ======================================================
//
// IMPORTANT:
// Your HTML uses:
//
// .goal-option
//
// NOT:
//
// .goal-btn
//
// ======================================================

goalButtons.forEach(button => {


button.addEventListener(
    "click",
    () => {

        // Custom has its own handler below.
        // Don't treat it as a numeric goal.

        if (
            button.id ===
            "customGoalBtn"
        ) {
            return;
        }


        const goal =
            Number(
                button.dataset.goal
            );


        if (
            !Number.isFinite(goal) ||
            goal <= 0
        ) {
            return;
        }


        selectedGoal =
            goal;


        goalButtons.forEach(btn => {

            btn.classList.remove(
                "active"
            );

        });


        button.classList.add(
            "active"
        );


        selectedGoalElement.textContent =
            selectedGoal;


        targetReps.textContent =
            selectedGoal;


        targetBadge.textContent =
            `Goal: ${selectedGoal}`;


        if (customGoalBox) {
            customGoalBox.hidden = true;
        }


        setAIStatus(
            `Target selected: ${selectedGoal} reps`
        );

    }
);


});

// ======================================================
// CUSTOM GOAL BUTTON
// ======================================================

if (customGoalBtn) {


customGoalBtn.addEventListener(
    "click",
    () => {

        goalButtons.forEach(btn => {

            btn.classList.remove(
                "active"
            );

        });


        customGoalBtn.classList.add(
            "active"
        );


        if (customGoalBox) {

            customGoalBox.hidden =
                !customGoalBox.hidden;

        }


        if (customGoalBox &&
            !customGoalBox.hidden) {

            customGoalInput.focus();

            setAIStatus(
                "Enter your custom target."
            );

        }

    }
);


}

// ======================================================
// SET CUSTOM GOAL
// ======================================================

if (setCustomGoalBtn) {


setCustomGoalBtn.addEventListener(
    "click",
    setCustomGoal
);


}

function setCustomGoal() {


const value =
    Number(
        customGoalInput.value
    );


if (
    !Number.isFinite(value) ||
    value < 1 ||
    value > 10000
) {

    alert(
        "Enter a goal between 1 and 10000."
    );

    customGoalInput.focus();

    return;
}


selectedGoal =
    Math.floor(value);


goalButtons.forEach(btn => {

    btn.classList.remove(
        "active"
    );

});


customGoalBtn.classList.add(
    "active"
);


selectedGoalElement.textContent =
    selectedGoal;


targetReps.textContent =
    selectedGoal;


targetBadge.textContent =
    `Goal: ${selectedGoal}`;


customGoalBox.hidden =
    true;


setAIStatus(
    `Custom target set: ${selectedGoal} reps`
);


}

// ======================================================
// ENTER KEY FOR CUSTOM GOAL
// ======================================================

if (customGoalInput) {


customGoalInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Enter"
        ) {

            setCustomGoal();

        }

    }
);


}

// ======================================================
// START WORKOUT BUTTON
// ======================================================

if (startWorkoutBtn) {


startWorkoutBtn.addEventListener(
    "click",
    startWorkout
);


}

// ======================================================
// START WORKOUT
// ======================================================

async function startWorkout() {


if (workoutRunning) {
    return;
}


workoutRunning = true;

workoutPaused = false;

workoutFinished = false;

currentReps = 0;


// Reset rep state.

resetRepState();


// Update UI.

goalCard.hidden = true;

workoutCard.hidden = false;

successCard.hidden = true;


pushupCount.textContent =
    "0";

targetReps.textContent =
    selectedGoal;

targetBadge.textContent =
    `Goal: ${selectedGoal}`;

progressPercent.textContent =
    "0";

repProgressFill.style.width =
    "0%";


pauseBtn.disabled = false;

stopSaveBtn.disabled = false;


pauseIcon.textContent =
    "⏸";

pauseText.textContent =
    "Pause";


setAIStatus(
    "Workout started. Open your camera."
);


// Load AI models.

try {

    await initializeAI();

}

catch (error) {

    console.error(
        "AI initialization failed:",
        error
    );


    setAIStatus(
        "AI failed to load. Check the console."
    );


    workoutRunning = false;

    pauseBtn.disabled = true;

    stopSaveBtn.disabled = true;

}


}

// ======================================================
// AI INITIALIZATION
// ======================================================

async function initializeAI() {


if (
    detector &&
    classifier
) {

    return;

}


if (modelLoading) {

    while (modelLoading) {

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    100
                )
        );

    }

    return;

}


modelLoading = true;


try {

    setAIStatus(
        "Loading AI models..."
    );


    // ==================================================
    // MOVENET
    // ==================================================

    const detectorConfig = {

        modelType:
            poseDetection.movenet.modelType.SINGLEPOSE_THUNDER,

        enableSmoothing: true

    };


    detector =
        await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            detectorConfig
        );


    // ==================================================
    // TFLITE CLASSIFIER
    // ==================================================

    if (
        typeof tflite ===
        "undefined"
    ) {

        throw new Error(
            "TensorFlow Lite runtime is not loaded."
        );

    }


    classifier =
        await tflite.loadTFLiteModel(
            "models/pose_classifier.tflite"
        );


    console.log(
        "MoveNet detector loaded."
    );

    console.log(
        "TFLite classifier loaded."
    );


    console.log(
        "Classifier inputs:",
        classifier.inputs
    );


    console.log(
        "Classifier outputs:",
        classifier.outputs
    );


    setAIStatus(
        "AI ready. Open your camera."
    );

}

finally {

    modelLoading = false;

}


}

// ======================================================
// OPEN CAMERA
// ======================================================

if (openCameraBtn) {


openCameraBtn.addEventListener(
    "click",
    openCamera
);


}

async function openCamera() {


if (!workoutRunning) {

    setAIStatus(
        "Start a workout first."
    );

    return;

}


if (stream) {
    return;
}


try {

    setAIStatus(
        "Requesting camera..."
    );


    stream =
        await navigator.mediaDevices.getUserMedia({

            video: {

                facingMode: "user",

                width: {
                    ideal: 640
                },

                height: {
                    ideal: 480
                },

                frameRate: {
                    ideal: 30,
                    max: 30
                }

            },

            audio: false

        });


    cameraVideo.srcObject =
        stream;


    await cameraVideo.play();


    cameraPlaceholder.hidden =
        true;


    cameraContainer.hidden =
        false;


    openCameraBtn.hidden =
        true;


    closeCameraBtn.hidden =
        false;


    setAIStatus(
        "Camera active. Get into plank position."
    );


    startAI();

}

catch (error) {

    console.error(
        "Camera error:",
        error
    );


    setAIStatus(
        "Camera permission was denied or unavailable."
    );


    alert(
        "Could not open the camera. Please allow camera permission."
    );

}


}

// ======================================================
// CLOSE CAMERA
// ======================================================

if (closeCameraBtn) {


closeCameraBtn.addEventListener(
    "click",
    closeCamera
);


}

function closeCamera() {


stopAI();


if (stream) {

    stream
        .getTracks()
        .forEach(
            track =>
                track.stop()
        );

}


stream = null;

cameraVideo.srcObject =
    null;


cameraContainer.hidden =
    true;


cameraPlaceholder.hidden =
    false;


openCameraBtn.hidden =
    false;


closeCameraBtn.hidden =
    true;


setAIStatus(
    "Camera closed."
);


}

// ======================================================
// START AI LOOP
// ======================================================

function startAI() {


if (aiRunning) {
    return;
}


if (!detector) {

    setAIStatus(
        "Pose model is not ready."
    );

    return;

}


if (!classifier) {

    setAIStatus(
        "Push-up classifier is not ready."
    );

    return;

}


aiRunning = true;


processFrame();


}

// ======================================================
// STOP AI LOOP
// ======================================================

function stopAI() {


aiRunning = false;


if (animationFrameId) {

    cancelAnimationFrame(
        animationFrameId
    );

    animationFrameId =
        null;

}


}

// ======================================================
// AI FRAME LOOP
// ======================================================

async function processFrame() {


if (
    !aiRunning ||
    !workoutRunning ||
    workoutPaused ||
    workoutFinished
) {

    return;

}


try {

    const poses =
        await detector.estimatePoses(
            cameraVideo,
            {
                flipHorizontal: true
            }
        );


    if (
        !poses ||
        poses.length === 0
    ) {

        setAIStatus(
            "No person detected."
        );

    }

    else {

        const pose =
            poses[0];


        await processPose(
            pose
        );

    }

}

catch (error) {

    console.error(
        "AI frame error:",
        error
    );

}


if (
    aiRunning &&
    workoutRunning &&
    !workoutPaused &&
    !workoutFinished
) {

    animationFrameId =
        requestAnimationFrame(
            processFrame
        );

}


}

// ======================================================
// PROCESS POSE
// ======================================================

async function processPose(pose) {


const keypoints =
    pose.keypoints;


if (
    !keypoints ||
    keypoints.length < 17
) {

    setAIStatus(
        "Body not fully detected."
    );

    resetClassifierTracking();

    return;

}


// ==================================================
// PLANK POSITION GATE
// ==================================================
//
// This gate does NOT classify the rep.
//
// It only decides whether the detected body
// resembles a usable push-up position.
//
// The actual UP/DOWN classification is still
// performed by the pretrained TFLite classifier.
//
// ==================================================

const plankResult =
    evaluatePushupPosition(
        keypoints
    );


if (!plankResult.valid) {

    setAIStatus(
        plankResult.message
    );


    resetClassifierTracking();

    return;

}


// ==================================================
// CLASSIFIER
// ==================================================

const classifierResult =
    await classifyPose(
        keypoints
    );


if (!classifierResult) {

    setAIStatus(
        "Analyzing push-up..."
    );

    return;

}


const state =
    classifierResult.state;


const confidence =
    classifierResult.confidence;


if (
    confidence < 0.50
) {

    setAIStatus(
        "Hold your push-up position..."
    );


    return;

}


setAIStatus(
    state === "down"
        ? "DOWN"
        : "UP"
);


// ==================================================
// TEMPORAL REP STATE MACHINE
// ==================================================

processRepState(
    state
);


}

// ======================================================
// PLANK POSITION GATE
// ======================================================

function evaluatePushupPosition(
keypoints
) {


const nose =
    getKeypoint(
        keypoints,
        "nose"
    );

const leftShoulder =
    getKeypoint(
        keypoints,
        "left_shoulder"
    );

const rightShoulder =
    getKeypoint(
        keypoints,
        "right_shoulder"
    );

const leftHip =
    getKeypoint(
        keypoints,
        "left_hip"
    );

const rightHip =
    getKeypoint(
        keypoints,
        "right_hip"
    );

const leftAnkle =
    getKeypoint(
        keypoints,
        "left_ankle"
    );

const rightAnkle =
    getKeypoint(
        keypoints,
        "right_ankle"
    );


const requiredPoints = [

    nose,

    leftShoulder,

    rightShoulder,

    leftHip,

    rightHip,

    leftAnkle,

    rightAnkle

];


const missingPoint =
    requiredPoints.some(
        point =>
            !point ||
            point.score <
            MIN_KEYPOINT_SCORE
    );


if (missingPoint) {

    return {

        valid: false,

        message:
            "Keep your full body visible."

    };

}


const shoulder =
    midpoint(
        leftShoulder,
        rightShoulder
    );


const hip =
    midpoint(
        leftHip,
        rightHip
    );


const ankle =
    midpoint(
        leftAnkle,
        rightAnkle
    );


const bodyLength =
    distance2D(
        shoulder,
        ankle
    );


if (
    bodyLength < 0.05
) {

    return {

        valid: false,

        message:
            "Move farther from the camera."

    };

}


// Vector from shoulder to ankle.

const dx =
    ankle.x -
    shoulder.x;

const dy =
    ankle.y -
    shoulder.y;


const bodyAngle =
    Math.abs(
        Math.atan2(
            dy,
            dx
        ) *
        180 /
        Math.PI
    );


const normalizedAngle =
    bodyAngle > 90
        ? 180 - bodyAngle
        : bodyAngle;


// A push-up plank should be relatively
// horizontal rather than vertical.


if (
    normalizedAngle > 45
) {

    return {

        valid: false,

        message:
            "You're not in plank position. Get into plank position."

    };

}


// Check that hips are not dramatically
// separated from the shoulder/ankle line.

const lineDistance =
    pointToLineDistance(
        hip,
        shoulder,
        ankle
    );


const normalizedDeviation =
    lineDistance /
    bodyLength;


if (
    normalizedDeviation > 0.35
) {

    return {

        valid: false,

        message:
            "Keep your body straight in plank position."

    };

}


return {

    valid: true,

    message:
        "Plank position detected."

};


}

// ======================================================
// GET KEYPOINT
// ======================================================

function getKeypoint(
keypoints,
name
) {


return keypoints.find(
    point =>
        point.name === name
);


}

// ======================================================
// MIDPOINT
// ======================================================

function midpoint(
a,
b
) {


return {

    x:
        (a.x + b.x) / 2,

    y:
        (a.y + b.y) / 2,

    score:
        Math.min(
            a.score,
            b.score
        )

};


}

// ======================================================
// 2D DISTANCE
// ======================================================

function distance2D(
a,
b
) {


return Math.sqrt(

    Math.pow(
        b.x - a.x,
        2
    ) +

    Math.pow(
        b.y - a.y,
        2
    )

);


}

// ======================================================
// POINT TO LINE DISTANCE
// ======================================================

function pointToLineDistance(
point,
lineStart,
lineEnd
) {


const dx =
    lineEnd.x -
    lineStart.x;

const dy =
    lineEnd.y -
    lineStart.y;


const denominator =
    Math.sqrt(
        dx * dx +
        dy * dy
    );


if (
    denominator === 0
) {

    return 0;

}


return Math.abs(

    dy * point.x -

    dx * point.y +

    lineEnd.x *
    lineStart.y -

    lineEnd.y *
    lineStart.x

) / denominator;


}

// ======================================================
// CLASSIFIER PREPROCESSING
// ======================================================
//
// The classifier expects 17 keypoints × 3 values:
//
// x
// y
// confidence
//
// This is the classifier input used by the
// current implementation.
//
// ======================================================

function prepareClassifierInput(
keypoints
) {


const values = [];


for (
    const point of keypoints
) {

    values.push(
        point.x
    );

    values.push(
        point.y
    );

    values.push(
        point.score ?? 0
    );

}


return values;


}

// CLASSIFY POSE
// ======================================================

async function classifyPose(keypoints) {

    if (!classifier) {
        return null;
    }

    try {

        const values =
            prepareClassifierInput(keypoints);


        const inputTensor =
            tf.tensor2d(
                [values],
                [1, values.length],
                "float32"
            );


        const outputs =
            classifier.outputs;


        if (
            !outputs ||
            outputs.length === 0
        ) {

            inputTensor.dispose();

            return null;
        }


        // Run classifier ONCE
        const result =
            classifier.predict(
                inputTensor
            );


        let outputTensor;


        // Some TFLite versions return
        // an array of tensors.

        if (
            Array.isArray(result)
        ) {

            outputTensor = result[0];

        }

        else {

            outputTensor = result;

        }


        const outputData =
            await outputTensor.data();


        const valuesArray =
            Array.from(
                outputData
            );


        inputTensor.dispose();


        if (
            outputTensor &&
            typeof outputTensor.dispose ===
            "function"
        ) {

            outputTensor.dispose();

        }


        if (
            valuesArray.length === 0
        ) {

            return null;

        }


        let state;
        let confidence;


        // Repository labels:
        //
        // index 0 = down
        // index 1 = up
        //
        // If the model returns two outputs,
        // choose whichever score is higher.

        if (
            valuesArray.length >= 2
        ) {

            const downScore =
                valuesArray[0];

            const upScore =
                valuesArray[1];


            if (
                upScore >
                downScore
            ) {

                state = "up";

                confidence =
                    upScore;

            }

            else {

                state = "down";

                confidence =
                    downScore;

            }

        }

        else {

            // Single-output sigmoid model.

            const score =
                valuesArray[0];


            if (
                score >= 0.5
            ) {

                state = "up";

                confidence =
                    score;

            }

            else {

                state = "down";

                confidence =
                    1 - score;

            }

        }


        return {
            state,
            confidence
        };

    }

    catch (error) {

        console.error(
            "Classifier error:",
            error
        );

        return null;

    }

}



// ======================================================
// REP BUBBLE STATE MACHINE
// ======================================================
//
// Valid repetition:
//
//     UP
//      ↓
//    DOWN
//      ↓
//     UP
//      ↓
//   COUNT +1
//
// The entire UP → DOWN → UP cycle
// represents ONE repetition.
// ======================================================

function processRepState(state) {

    // --------------------------------------------------
    // 1. Track how many consecutive frames have the
    //    same classifier state.
    // --------------------------------------------------

    if (state !== lastClassifierState) {

        lastClassifierState = state;

        classifierStateFrames = 1;

        return;
    }


    classifierStateFrames++;


    // Don't accept a state until it has been stable
    // for enough frames.
    if (
        classifierStateFrames <
        REQUIRED_STATE_FRAMES
    ) {

        return;
    }


    // --------------------------------------------------
    // 2. WAITING FOR UP
    // --------------------------------------------------
    //
    // We intentionally DO NOT allow:
    //
    // READY → DOWN → UP
    //
    // to count.
    //
    // The user must first establish the UP position.
    // --------------------------------------------------

    if (
        repState ===
        "WAITING_FOR_UP"
    ) {

        if (
            state ===
            "up"
        ) {

            repState =
                "UP_PHASE";

            console.log(
                "REP: UP phase started"
            );

        }

        return;
    }


    // --------------------------------------------------
    // 3. UP → DOWN
    // --------------------------------------------------

    if (
        repState ===
        "UP_PHASE" &&
        state ===
        "down"
    ) {

        repState =
            "DOWN_PHASE";

        console.log(
            "REP: DOWN phase started"
        );

        return;
    }


    // --------------------------------------------------
    // 4. DOWN → UP
    //
    // This closes the bubble.
    //
    // UP → DOWN → UP = ONE REP
    // --------------------------------------------------

    if (
        repState ===
        "DOWN_PHASE" &&
        state ===
        "up"
    ) {

        const now =
            Date.now();


        // Safety protection against extremely
        // fast duplicate counts.

        if (
            now -
            lastRepTime <
            MIN_REP_INTERVAL
        ) {

            return;
        }


        lastRepTime =
            now;


        // ----------------------------------------------
        // REP COMPLETED
        // ----------------------------------------------

        currentReps++;


        console.log(
            "REP COMPLETED:",
            currentReps
        );


        updateRepUI();


        // ----------------------------------------------
        // TARGET COMPLETION
        // ----------------------------------------------

        if (
            currentReps >=
            selectedGoal
        ) {

            finishWorkout();

            return;
        }


        // ----------------------------------------------
        // IMPORTANT:
        //
        // The UP that completed the previous rep
        // becomes the starting UP phase for the next
        // repetition.
        // ----------------------------------------------

        repState =
            "UP_PHASE";

        console.log(
            "REP BUBBLE CLOSED → NEXT REP STARTED"
        );

    }

}


// ======================================================
// RESET REP STATE
// ======================================================

function resetRepState() {

    repState =
        "WAITING_FOR_UP";

    lastClassifierState =
        null;

    classifierStateFrames =
        0;

    lastRepTime =
        0;

}

// ======================================================
// RESET CLASSIFIER TRACKING
// ======================================================

function resetClassifierTracking() {


lastClassifierState =
    null;

classifierStateFrames =
    0;


}

// ======================================================
// UPDATE REP UI
// ======================================================

function updateRepUI() {


pushupCount.textContent =
    currentReps;


const percentage =
    Math.min(

        (
            currentReps /
            selectedGoal
        ) * 100,

        100

    );


progressPercent.textContent =
    Math.round(
        percentage
    );


repProgressFill.style.width =
    `${percentage}%`;


}

// ======================================================
// AI STATUS
// ======================================================

function setAIStatus(
message
) {


if (aiStatus) {

    aiStatus.textContent =
        message;

}


}

// ======================================================
// FINISH WORKOUT
// ======================================================
//
// IMPORTANT:
// Reaching the target does NOT automatically save
// to Django.
//
// It only finishes the AI workout.
// The user still presses Stop & Save.
//
// ======================================================

function finishWorkout() {


if (workoutFinished) {
    return;
}


workoutFinished =
    true;

workoutRunning =
    false;


stopAI();


if (pauseBtn) {
    pauseBtn.disabled =
        true;
}


setAIStatus(
    `Target complete! ${currentReps}/${selectedGoal} reps. Press Stop & Save.`
);


if (stopSaveBtn) {

    stopSaveBtn.disabled =
        false;

}


}

// ======================================================
// PAUSE BUTTON
// ======================================================

if (pauseBtn) {


pauseBtn.addEventListener(
    "click",
    togglePause
);


}

function togglePause() {


if (!workoutRunning) {
    return;
}


workoutPaused =
    !workoutPaused;


if (workoutPaused) {

    stopAI();


    pauseIcon.textContent =
        "▶";

    pauseText.textContent =
        "Resume";


    setAIStatus(
        "Workout paused."
    );

}

else {

    pauseIcon.textContent =
        "⏸";

    pauseText.textContent =
        "Pause";


    setAIStatus(
        "Workout resumed."
    );


    startAI();

}


}

// ======================================================
// STOP & SAVE
// ======================================================

if (stopSaveBtn) {


stopSaveBtn.addEventListener(
    "click",
    stopAndSaveWorkout
);


}

async function stopAndSaveWorkout() {


if (
    !workoutRunning &&
    !workoutFinished
) {

    return;

}


stopAI();


workoutRunning =
    false;


workoutPaused =
    false;


if (pauseBtn) {

    pauseBtn.disabled =
        true;

}


if (stopSaveBtn) {

    stopSaveBtn.disabled =
        true;

}


closeCamera();


try {

    setAIStatus(
        "Saving workout..."
    );


    const csrfToken =
        await getCSRFToken();


    const response =
        await fetch(
            `${API_URL}/api/pushups/`,
            {

                method: "POST",

                credentials:
                    "include",

                headers: {

                    "Content-Type":
                        "application/json",

                    "X-CSRFToken":
                        csrfToken

                },

                body:
                    JSON.stringify({

                        target_reps:
                            selectedGoal,

                        actual_reps:
                            currentReps

                    })

            }
        );


    if (!response.ok) {

        const errorText =
            await response.text();


        console.error(
            "Save failed:",
            response.status,
            errorText
        );


        throw new Error(
            `Save failed: ${response.status}`
        );

    }


    const data =
        await response.json();


    console.log(
        "Workout saved:",
        data
    );


    showSuccess();


}

catch (error) {

    console.error(
        "Workout save error:",
        error
    );


    setAIStatus(
        "Workout could not be saved."
    );


    if (stopSaveBtn) {

        stopSaveBtn.disabled =
            false;

    }

}


}

// ======================================================
// CSRF TOKEN
// ======================================================

async function getCSRFToken() {


const response =
    await fetch(
        `${API_URL}/api/csrf/`,
        {

            method: "GET",

            credentials:
                "include"

        }
    );


if (!response.ok) {

    throw new Error(
        "Could not get CSRF token."
    );

}


const data =
    await response.json();


return data.csrfToken;


}

// ======================================================
// SUCCESS SCREEN
// ======================================================

function showSuccess() {


workoutCard.hidden =
    true;

goalCard.hidden =
    true;

successCard.hidden =
    false;


finalCount.textContent =
    currentReps;


finalTarget.textContent =
    selectedGoal;


if (currentReps >= selectedGoal) {

    successMessage.textContent =
        `Great work! You completed ${currentReps} pushups.`;

}

else {

    successMessage.textContent =
        `Workout saved: ${currentReps}/${selectedGoal} pushups.`;

}


setAIStatus(
    "Workout saved."
);


loadRecentActivities();


}

// ======================================================
// NEW WORKOUT
// ======================================================

if (newWorkoutBtn) {


newWorkoutBtn.addEventListener(
    "click",
    newWorkout
);


}

function newWorkout() {


closeCamera();


workoutRunning =
    false;

workoutPaused =
    false;

workoutFinished =
    false;


currentReps =
    0;


resetRepState();


goalCard.hidden =
    false;

workoutCard.hidden =
    true;

successCard.hidden =
    true;


pauseBtn.disabled =
    true;

stopSaveBtn.disabled =
    true;


pushupCount.textContent =
    "0";

targetReps.textContent =
    selectedGoal;

targetBadge.textContent =
    `Goal: ${selectedGoal}`;

progressPercent.textContent =
    "0";

repProgressFill.style.width =
    "0%";


setAIStatus(
    "Choose a target to begin."
);


}

// ======================================================
// RECENT ACTIVITIES
// ======================================================

if (refreshActivitiesBtn) {


refreshActivitiesBtn.addEventListener(
    "click",
    loadRecentActivities
);


}

async function loadRecentActivities() {


if (!recentActivities) {
    return;
}


try {

    const response =
        await fetch(
            `${API_URL}/api/pushups/`,
            {

                method: "GET",

                credentials:
                    "include"

            }
        );


    if (!response.ok) {

        throw new Error(
            `Activities request failed: ${response.status}`
        );

    }


    const activities =
        await response.json();


    renderRecentActivities(
        activities
    );

}

catch (error) {

    console.error(
        "Could not load activities:",
        error
    );


    recentActivities.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                ⚠️
            </div>

            <p>
                Could not load activities
            </p>

        </div>

    `;

}


}

// ======================================================
// RENDER RECENT ACTIVITIES
// ======================================================

function renderRecentActivities(
activities
) {


if (
    !activities ||
    activities.length === 0
) {

    recentActivities.innerHTML = `

        <div class="empty-state">

            <div class="empty-icon">
                💪
            </div>

            <p>
                No activities yet
            </p>

            <span>
                Complete a workout and your recent pushups will appear here.
            </span>

        </div>

    `;

    return;

}


recentActivities.innerHTML =
    activities.map(
        activity => {

            const date =
                activity.created_at
                    ? new Date(
                        activity.created_at
                    ).toLocaleString()
                    : "";


            return `

                <div class="activity-item">

                    <div>

                        <strong>
                            ${activity.actual_reps}
                            /
                            ${activity.target_reps}
                            pushups
                        </strong>

                        <span>
                            ${date}
                        </span>

                    </div>

                </div>

            `;

        }
    ).join("");


}

// ======================================================
// BACK TO MENU
// ======================================================

if (backToMenuBtn) {


backToMenuBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "menu.html";

    }
);


}

// ======================================================
// PAGE STARTUP
// ======================================================

initializeUI();

loadRecentActivities();

console.log(
"Pushups JS loaded successfully."
);
