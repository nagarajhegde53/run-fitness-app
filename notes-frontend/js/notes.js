// ======================================================
// BACKEND
// ======================================================

// const API_URL = "http://127.0.0.1:8000";
const API_URL = "https://run-fitness-app.onrender.com";


// ======================================================
// DOM ELEMENTS
// ======================================================

const distanceButtons =
    document.querySelectorAll(".distance-option");

const selectedDistance =
    document.getElementById("selectedDistance");

const selectedUnit =
    document.getElementById("selectedUnit");

const startRunBtn =
    document.getElementById("startRunBtn");

const stopRunBtn =
    document.getElementById("stopRunBtn");

const liveRunCard =
    document.getElementById("liveRunCard");

const timerElement =
    document.getElementById("timer");

const liveDistanceElement =
    document.getElementById("liveDistance");

const progressPercentElement =
    document.getElementById("progressPercent");

const progressFillElement =
    document.getElementById("progressFill");

const gpsStatusElement =
    document.getElementById("gpsStatus");


// ======================================================
// RUN STATE
// ======================================================

let targetDistance = 100;

let totalDistance = 0;

let startTime = null;

let timerInterval = null;

let isRunning = false;

let watchId = null;
// gps acccuracy
// let lastGPSAccuracy = null;


// ======================================================
// GPS STATE
// ======================================================

let currentPosition = null;

let bestGpsAccuracy = null;


// ======================================================
// SENSOR STATE
// ======================================================

// Whether the phone is currently considered moving

let isMoving = false;


// Last accelerometer reading

let lastAcceleration = null;


// Smoothed movement value

let movementScore = 0;


// Number of consecutive movement readings

let movementFrames = 0;


// Number of consecutive stationary readings

let stationaryFrames = 0;


// ======================================================
// SENSOR SETTINGS
// ======================================================

// Small acceleration changes caused by sensor noise
// should not count as movement.

const MOVEMENT_THRESHOLD = 0.12;


// We require several readings before declaring movement.

const MOVEMENT_CONFIRMATION_FRAMES = 3;


// We require several stationary readings before
// declaring the phone stationary again.

const STATIONARY_CONFIRMATION_FRAMES = 10;


// ======================================================
// GPS SETTINGS
// ======================================================

// We don't want obviously terrible GPS points.

const MAX_GPS_ACCURACY = 30;


// This is NOT our running-speed calculator.
// It only prevents ridiculous GPS teleportation.

const MAX_GPS_SPEED = 20;


// ======================================================
// DISTANCE BUTTONS
// ======================================================

distanceButtons.forEach(button => {

    button.addEventListener("click", () => {

        distanceButtons.forEach(btn => {
            btn.classList.remove("active");
        });


        button.classList.add("active");


        targetDistance =
            Number(button.dataset.distance);


        updateTargetUI();

    });

});


// ======================================================
// TARGET UI
// ======================================================

function updateTargetUI() {

    if (targetDistance >= 1000) {

        selectedDistance.textContent =
            targetDistance / 1000;

        selectedUnit.textContent =
            "km";

    } else {

        selectedDistance.textContent =
            targetDistance;

        selectedUnit.textContent =
            "m";
    }

}


// ======================================================
// START BUTTON
// ======================================================

startRunBtn.addEventListener(
    "click",
    startRun
);


// ======================================================
// STOP BUTTON
// ======================================================

stopRunBtn.addEventListener(
    "click",
    stopRun
);


// ======================================================
// START RUN
// ======================================================

function startRun() {

    if (isRunning) {
        return;
    }


    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;
    }


    console.log(
        "================================"
    );

    console.log(
        "🏃 RUN STARTED"
    );

    console.log(
        "Target:",
        targetDistance,
        "meters"
    );

    console.log(
        "================================"
    );


    // ==================================================
    // RESET RUN STATE
    // ==================================================

    isRunning = true;

    totalDistance = 0;

    startTime = Date.now();

    currentPosition = null;

    bestGpsAccuracy = null;


    // ==================================================
    // RESET SENSOR STATE
    // ==================================================

    isMoving = false;

    lastAcceleration = null;

    movementScore = 0;

    movementFrames = 0;

    stationaryFrames = 0;


    // ==================================================
    // RESET UI
    // ==================================================

    timerElement.textContent =
        "00:00.00";

    liveDistanceElement.textContent =
        "0.0";

    progressPercentElement.textContent =
        "0";

    progressFillElement.style.width =
        "0%";

    gpsStatusElement.textContent =
        "Getting GPS...";


    liveRunCard.hidden = false;


    startRunBtn.disabled = true;

    stopRunBtn.disabled = false;


    // ==================================================
    // START TIMER
    // ==================================================

    startTimer();


    // ==================================================
    // START GPS
    // ==================================================

    watchId =
        navigator.geolocation.watchPosition(

            handleGPSPosition,

            handleGPSError,

            {

                enableHighAccuracy: true,

                maximumAge: 0,

                timeout: 10000

            }

        );


    // ==================================================
    // START MOTION SENSOR
    // ==================================================

    startMotionSensor();


    console.log(
        "GPS + motion sensor started"
    );

}


// ======================================================
// START MOTION SENSOR
// ======================================================

function startMotionSensor() {

    if (!("DeviceMotionEvent" in window)) {

        console.warn(
            "DeviceMotionEvent is not supported."
        );

        gpsStatusElement.textContent =
            "Motion sensor unavailable";

        return;
    }


    console.log(
        "📱 Requesting motion sensor..."
    );


    // Some browsers, especially iOS,
    // require permission.

    if (
        typeof DeviceMotionEvent.requestPermission ===
        "function"
    ) {

        DeviceMotionEvent.requestPermission()

            .then(permission => {

                if (permission === "granted") {

                    window.addEventListener(
                        "devicemotion",
                        handleMotion
                    );

                    console.log(
                        "✅ Motion permission granted"
                    );

                } else {

                    console.warn(
                        "❌ Motion permission denied"
                    );

                    gpsStatusElement.textContent =
                        "Motion permission denied";
                }

            })

            .catch(error => {

                console.error(
                    "Motion permission error:",
                    error
                );

            });

    }

    else {

        // Android Chrome normally comes here.

        window.addEventListener(
            "devicemotion",
            handleMotion
        );

        console.log(
            "✅ Motion sensor listener started"
        );

    }

}


// ======================================================
// MOTION SENSOR
// ======================================================

function handleMotion(event) {

    if (!isRunning) {
        return;
    }


    // Prefer acceleration without gravity.

    let acceleration =
        event.acceleration;


    // Some phones may not provide it.
    // Fall back to accelerationIncludingGravity.

    if (
        !acceleration ||
        acceleration.x === null ||
        acceleration.y === null ||
        acceleration.z === null
    ) {

        acceleration =
            event.accelerationIncludingGravity;
    }


    if (!acceleration) {
        return;
    }


    const x =
        acceleration.x || 0;

    const y =
        acceleration.y || 0;

    const z =
        acceleration.z || 0;


    // ==================================================
    // ACCELERATION MAGNITUDE
    // ==================================================

    const magnitude =

        Math.sqrt(

            x * x +
            y * y +
            z * z

        );


    // ==================================================
    // FIRST READING
    // ==================================================

    if (lastAcceleration === null) {

        lastAcceleration = magnitude;

        return;
    }


    // ==================================================
    // CHANGE FROM PREVIOUS READING
    // ==================================================

    const change =
        Math.abs(
            magnitude -
            lastAcceleration
        );


    lastAcceleration =
        magnitude;


    // ==================================================
    // MOVEMENT DETECTION
    // ==================================================

    if (
        change >
        MOVEMENT_THRESHOLD
    ) {

        movementFrames++;

        stationaryFrames = 0;

    }

    else {

        stationaryFrames++;

        movementFrames = 0;

    }


    // ==================================================
    // CONFIRM MOVEMENT
    // ==================================================

    if (
        movementFrames >=
        MOVEMENT_CONFIRMATION_FRAMES
    ) {

        if (!isMoving) {

            console.log(
                "🚶 MOTION DETECTED"
            );

        }


        isMoving = true;

        movementFrames = 0;

    }


    // ==================================================
    // CONFIRM STATIONARY
    // ==================================================

    if (
        stationaryFrames >=
        STATIONARY_CONFIRMATION_FRAMES
    ) {

        if (isMoving) {

            console.log(
                "🧍 PHONE IS STATIONARY"
            );

        }


        isMoving = false;

        stationaryFrames = 0;

    }


    // ==================================================
    // SENSOR DEBUG
    // ==================================================

    console.log(

        "Motion:",
        change.toFixed(3),
        "| moving:",
        isMoving

    );

}


// ======================================================
// GPS POSITION
// ======================================================

function handleGPSPosition(position) {

    if (!isRunning) {
        return;
    }


    const latitude =
        position.coords.latitude;

    const longitude =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;

    const timestamp =
        position.timestamp;

   

    console.log(
        "📍 GPS:",
        latitude,
        longitude,
        "accuracy:",
        accuracy
    );


    // ==================================================
    // GPS STATUS
    // ==================================================

    if (accuracy <= 5) {

        gpsStatusElement.textContent =
            `GPS ±${Math.round(accuracy)}m • Excellent`;

    }

    else if (accuracy <= 10) {

        gpsStatusElement.textContent =
            `GPS ±${Math.round(accuracy)}m • Good`;

    }

    else if (accuracy <= 30) {

        gpsStatusElement.textContent =
            `GPS ±${Math.round(accuracy)}m • Fair`;

    }

    else {

        gpsStatusElement.textContent =
            `GPS ±${Math.round(accuracy)}m • Poor`;

    }


    // ==================================================
    // TRACK BEST ACCURACY
    // ==================================================

    if (
        bestGpsAccuracy === null ||
        accuracy < bestGpsAccuracy
    ) {

        bestGpsAccuracy =
            accuracy;
    }


    // ==================================================
    // IGNORE BAD GPS
    // ==================================================

    if (
        accuracy >
        MAX_GPS_ACCURACY
    ) {

        console.log(
            "❌ GPS ignored: poor accuracy"
        );

        return;
    }


    // ==================================================
    // FIRST GPS POINT
    // ==================================================

    if (currentPosition === null) {

        currentPosition = {

            latitude:
                latitude,

            longitude:
                longitude,

            timestamp:
                timestamp

        };


        console.log(
            "📍 First trusted GPS point saved"
        );


        return;
    }


    // ==================================================
    // CALCULATE GPS DISTANCE
    // ==================================================

    const distance =
        calculateDistance(

            currentPosition.latitude,

            currentPosition.longitude,

            latitude,

            longitude

        );


    // ==================================================
    // TIME DIFFERENCE
    // ==================================================

    const timeDifference =

        (
            timestamp -
            currentPosition.timestamp
        ) / 1000;


    if (
        timeDifference <= 0
    ) {

        return;
    }


    // ==================================================
    // GPS SPEED
    // ==================================================

    const speed =
        distance /
        timeDifference;


    console.log(
        "GPS movement:",
        distance.toFixed(2),
        "m",
        "| speed:",
        speed.toFixed(2),
        "m/s"
    );


    // ==================================================
    // GPS TELEPORT FILTER
    // ==================================================

    if (
        speed >
        MAX_GPS_SPEED
    ) {

        console.log(
            "❌ GPS jump rejected"
        );


        // Don't move currentPosition.

        return;
    }


    // ==================================================
    // IMPORTANT SENSOR GATE
    // ==================================================

    if (!isMoving) {

        console.log(
            "🧍 Stationary → GPS movement ignored:",
            distance.toFixed(2),
            "m"
        );


        // We DO update the GPS reference.
        //
        // Why?
        //
        // Suppose you're sitting and GPS moves:
        //
        // A → B → C
        //
        // We don't want B→C later becoming a giant
        // movement when you finally start walking.

        currentPosition = {

            latitude:
                latitude,

            longitude:
                longitude,

            timestamp:
                timestamp

        };


        return;
    }


    // ==================================================
    // USER IS MOVING
    // ==================================================

    console.log(
        "🏃 Motion detected → GPS movement accepted:",
        distance.toFixed(2),
        "m"
    );


    totalDistance += distance;


    // Update GPS reference

    currentPosition = {

        latitude:
            latitude,

        longitude:
            longitude,

        timestamp:
            timestamp

    };


    // ==================================================
    // UPDATE UI
    // ==================================================

    updateDistanceUI();


    // ==================================================
    // TARGET REACHED
    // ==================================================

    if (
        totalDistance >=
        targetDistance
    ) {

        finishRun();

    }

}


// ======================================================
// HAVERSINE
// ======================================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;


    const lat1Rad =
        lat1 * Math.PI / 180;

    const lat2Rad =
        lat2 * Math.PI / 180;


    const deltaLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const deltaLon =
        (lon2 - lon1) *
        Math.PI / 180;


    const a =

        Math.sin(deltaLat / 2) ** 2 +

        Math.cos(lat1Rad) *

        Math.cos(lat2Rad) *

        Math.sin(deltaLon / 2) ** 2;


    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );


    return R * c;

}


// ======================================================
// UPDATE DISTANCE UI
// ======================================================

function updateDistanceUI() {

    liveDistanceElement.textContent =
        totalDistance.toFixed(1);


    const progress =

        Math.min(

            (
                totalDistance /
                targetDistance
            ) * 100,

            100

        );


    progressPercentElement.textContent =
        Math.round(progress);


    progressFillElement.style.width =
        `${progress}%`;

}


// ======================================================
// TIMER
// ======================================================

function startTimer() {

    if (timerInterval !== null) {

        clearInterval(
            timerInterval
        );
    }


    timerInterval = setInterval(() => {

        if (
            !isRunning ||
            startTime === null
        ) {

            return;
        }


        const elapsed =
            Date.now() -
            startTime;


        updateTimer(elapsed);

    }, 50);

}


function updateTimer(elapsed) {

    const totalSeconds =
        elapsed / 1000;


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        Math.floor(
            totalSeconds % 60
        );


    const milliseconds =
        Math.floor(
            (elapsed % 1000) / 10
        );


    timerElement.textContent =

        `${String(minutes).padStart(2, "0")}:` +

        `${String(seconds).padStart(2, "0")}.` +

        `${String(milliseconds).padStart(2, "0")}`;

}


function stopTimer() {

    if (timerInterval !== null) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }


    console.log(
        "⏱ Timer stopped"
    );

}


// ======================================================
// GPS ERROR
// ======================================================

function handleGPSError(error) {

    console.error(
        "GPS Error:",
        error
    );


    if (error.code === 1) {

        gpsStatusElement.textContent =
            "Location permission denied";

    }

    else if (error.code === 2) {

        gpsStatusElement.textContent =
            "Location unavailable";

    }

    else if (error.code === 3) {

        gpsStatusElement.textContent =
            "GPS timeout";

    }

    else {

        gpsStatusElement.textContent =
            "GPS error";
    }

}


// ======================================================
// STOP EVERYTHING
// ======================================================

function stopTracking() {

    // Stop GPS

    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;
    }


    // Stop timer

    stopTimer();


    // Stop motion listener

    window.removeEventListener(
        "devicemotion",
        handleMotion
    );


    console.log(
        "🛑 GPS + timer + motion stopped"
    );

}


// ======================================================
// MANUAL STOP
// ======================================================

function stopRun() {

    if (!isRunning) {
        return;
    }


    const duration =
        Date.now() -
        startTime;


    console.log(
        "🛑 Manual stop"
    );


    isRunning = false;


    stopTracking();


    alert(

        `Run stopped!\n\n` +

        `Distance: ` +
        `${totalDistance.toFixed(1)} m\n` +

        `Time: ` +
        `${(duration / 1000).toFixed(2)} sec`

    );


    resetRun();

}


// ======================================================
// FINISH
// ======================================================

// async function finishRun() {

//     if (!isRunning) {
//         return;
//     }


//     const duration =
//         Date.now() -
//         startTime;



//     console.log(
//         "🏁 Target reached"
//     );


//     isRunning = false;


//     stopTracking();


//     alert(

//         `🏁 Run complete!\n\n` +

//         `Distance: ` +
//         `${totalDistance.toFixed(1)} m\n` +

//         `Time: ` +
//         `${(duration / 1000).toFixed(2)} sec`

//     );


//     resetRun();

// }

async function finishRun() {

    if (!isRunning) {
        return;
    }

    // Calculate final duration immediately
    const duration = Date.now() - startTime;

    // Stop the run FIRST
    isRunning = false;

    stopTracking();

    console.log("🏁 Target reached");

    console.log(
        "Distance:",
        totalDistance.toFixed(1),
        "m"
    );

    console.log(
        "Duration:",
        (duration / 1000).toFixed(2),
        "sec"
    );

    // Save completed run to backend
    await saveRunToBackend(duration);

    alert(
        `🏁 Run complete!\n\n` +
        `Distance: ${totalDistance.toFixed(1)} m\n` +
        `Time: ${(duration / 1000).toFixed(2)} sec`
    );

    resetRun();
}


// ======================================================
// RESET
// ======================================================

function resetRun() {

    isRunning = false;


    totalDistance = 0;

    startTime = null;

    currentPosition = null;

    bestGpsAccuracy = null;


    isMoving = false;

    lastAcceleration = null;

    movementScore = 0;

    movementFrames = 0;

    stationaryFrames = 0;


    timerElement.textContent =
        "00:00.00";


    liveDistanceElement.textContent =
        "0.0";


    progressPercentElement.textContent =
        "0";


    progressFillElement.style.width =
        "0%";


    gpsStatusElement.textContent =
        "Ready";


    startRunBtn.disabled = false;

    stopRunBtn.disabled = false;


    liveRunCard.hidden = true;


    console.log(
        "♻️ Run completely reset"
    );

}


// ======================================================
// INITIALIZE
// ======================================================

updateTargetUI();

resetRun();


// save to backend 
async function saveRunToBackend(duration) {

    const data = {
        target_distance: targetDistance,
        actual_distance: Number(totalDistance.toFixed(2)),
        duration: Number((duration / 1000).toFixed(2)),
        // gps_accuracy: lastGPSAccuracy,
        started_at: new Date(startTime).toISOString(),
        finished_at: new Date().toISOString()
    };

    console.log("Sending run to backend:", data);

    try {

        const response = await fetch(
            `${API_URL}/runs/`,
            {
                method: "POST",

                credentials: "include",

                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken
                },

                body: JSON.stringify(data)
            }
        );

        const result = await response.json();

        console.log(
            "Backend response:",
            result
        );

        if (!response.ok) {

            console.error(
                "Failed to save run:",
                result
            );

            alert("Run finished, but couldn't save it.");

            return;
        }

        console.log("✅ Run saved successfully!");

    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );

        alert(
            "Run finished, but server couldn't be reached."
        );
    }
}