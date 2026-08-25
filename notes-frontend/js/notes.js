// ======================================================
// CSRF
// ======================================================

function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {

            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {

                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );

                break;
            }
        }
    }

    return cookieValue;
}

const csrftoken = getCookie("csrftoken");


// ======================================================
// BACKEND
// ======================================================

const API_URL = "http://127.0.0.1:8000";


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

let timerInterval = null;

let startTime = null;

let totalDistance = 0;

let currentPosition = null;

let watchId = null;

let isRunning = false;

let bestGpsAccuracy = null;


// ======================================================
// TARGET DISTANCE
// EVERYTHING IS STORED IN METERS
// ======================================================

let targetDistance = 100;


// ======================================================
// GPS FILTER SETTINGS
// ======================================================

// Maximum GPS accuracy we accept.
//
// Example:
// accuracy = 5m  -> good
// accuracy = 20m -> acceptable
// accuracy = 50m -> ignore

const MAX_GPS_ACCURACY = 30;


// Maximum realistic movement speed.
//
// 20 m/s = 72 km/h.
//
// This is FAR above normal running speed,
// but protects us from crazy GPS jumps.

const MAX_REASONABLE_SPEED = 20;


// ======================================================
// DISTANCE SELECTION
// ======================================================

distanceButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active state
        distanceButtons.forEach(btn => {

            btn.classList.remove("active");

        });


        // Add active state
        button.classList.add("active");


        // Get target distance from HTML
        targetDistance =
            Number(button.dataset.distance);


        // Update UI

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


        console.log(
            "Selected target:",
            targetDistance,
            "meters"
        );

    });

});


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

    console.log(
        "Starting run:",
        targetDistance,
        "meters"
    );


    // Check browser GPS support

    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;
    }


    // Prevent accidentally starting
    // multiple runs

    if (isRunning) {

        console.log(
            "A run is already active."
        );

        return;
    }


    // ==================================================
    // RESET RUN STATE
    // ==================================================

    totalDistance = 0;

    currentPosition = null;

    bestGpsAccuracy = null;

    startTime = Date.now();

    isRunning = true;


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


    // Show live card

    liveRunCard.hidden = false;


    // Disable start

    startRunBtn.disabled = true;


    // ==================================================
    // START TIMER
    // ==================================================

    startTimer();


    // ==================================================
    // START GPS WATCH
    // ==================================================

    watchId =
        navigator.geolocation.watchPosition(

            handlePosition,

            handleGPSError,

            {
                enableHighAccuracy: true,

                maximumAge: 0,

                timeout: 10000
            }

        );


    console.log(
        "GPS tracking started."
    );

}


// ======================================================
// TIMER
// ======================================================

function startTimer() {

    // Prevent duplicate timers

    if (timerInterval !== null) {

        return;
    }


    timerInterval =
        setInterval(() => {

            if (!isRunning) {

                return;
            }


            const elapsed =
                Date.now() - startTime;


            updateTimer(elapsed);

        }, 50);

}


// ======================================================
// UPDATE TIMER
// ======================================================

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


    const formattedTime =

        `${String(minutes).padStart(2, "0")}:` +

        `${String(seconds).padStart(2, "0")}.` +

        `${String(milliseconds).padStart(2, "0")}`;


    timerElement.textContent =
        formattedTime;

}


// ======================================================
// HAVERSINE DISTANCE
// Returns meters
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
// HANDLE GPS POSITION
// ======================================================

function handlePosition(position) {

    // Ignore GPS callbacks after run ended

    if (!isRunning) {

        return;
    }


    // ==================================================
    // GET GPS DATA
    // ==================================================

    const latitude =
        position.coords.latitude;

    const longitude =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    // Browser timestamp

    const timestamp =
        position.timestamp;


    console.log(
        "GPS:",
        latitude,
        longitude,
        "accuracy:",
        accuracy,
        "timestamp:",
        timestamp
    );


    // ==================================================
    // TRACK BEST GPS ACCURACY
    // ==================================================

    if (
        bestGpsAccuracy === null ||
        accuracy < bestGpsAccuracy
    ) {

        bestGpsAccuracy =
            accuracy;
    }


    // ==================================================
    // GPS STATUS UI
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
    // FILTER BAD GPS
    // ==================================================

    if (accuracy > MAX_GPS_ACCURACY) {

        console.log(
            "❌ GPS point ignored because accuracy is:",
            accuracy
        );

        return;
    }


    // ==================================================
    // FIRST GOOD GPS POINT
    // ==================================================

    if (currentPosition === null) {

        currentPosition = {

            latitude: latitude,

            longitude: longitude,

            timestamp: timestamp
        };


        console.log(
            "✅ First trusted GPS point saved."
        );


        return;
    }


    // ==================================================
    // CALCULATE DISTANCE
    // ==================================================

    const distance =
        calculateDistance(

            currentPosition.latitude,

            currentPosition.longitude,

            latitude,

            longitude

        );


    // ==================================================
    // CALCULATE TIME DIFFERENCE
    // ==================================================

    const timeDifference =
        (timestamp -
            currentPosition.timestamp) / 1000;


    console.log(
        "Distance:",
        distance.toFixed(2),
        "m"
    );


    console.log(
        "Time difference:",
        timeDifference.toFixed(2),
        "sec"
    );


    // ==================================================
    // INVALID TIMESTAMP
    // ==================================================

    if (timeDifference <= 0) {

        console.log(
            "❌ Invalid timestamp."
        );

        return;
    }


    // ==================================================
    // CALCULATE SPEED
    // ======================================================

    const speed =
        distance / timeDifference;


    console.log(
        "Calculated movement speed:",
        speed.toFixed(2),
        "m/s"
    );


    // ==================================================
    // FILTER CRAZY GPS JUMPS
    // ==================================================

    if (
        speed >
        MAX_REASONABLE_SPEED
    ) {

        console.log(
            "❌ GPS jump ignored.",
            "Speed:",
            speed.toFixed(2),
            "m/s"
        );


        // IMPORTANT:
        // We DON'T update currentPosition.

        return;
    }


    // ==================================================
    // ACCEPT MOVEMENT
    // ==================================================

    totalDistance += distance;


    // ==================================================
    // UPDATE TRUSTED POSITION
    // ==================================================

    currentPosition = {

        latitude: latitude,

        longitude: longitude,

        timestamp: timestamp
    };


    console.log(
        "✅ Movement accepted:",
        distance.toFixed(2),
        "m"
    );


    console.log(
        "🏃 TOTAL:",
        totalDistance.toFixed(2),
        "m"
    );


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
// STOP GPS + TIMER
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

    if (timerInterval !== null) {

        clearInterval(
            timerInterval
        );

        timerInterval = null;
    }


    console.log(
        "🛑 GPS and timer stopped."
    );

}


// ======================================================
// FINISH RUN
// ======================================================

async function finishRun() {

    // Prevent duplicate finish

    if (!isRunning) {

        return;
    }


    console.log(
        "🏁 Target reached!"
    );


    // Mark stopped BEFORE doing anything else

    isRunning = false;


    // Stop GPS + timer

    stopTracking();


    // Calculate final duration

    const duration =
        Date.now() - startTime;


    console.log(
        "Final distance:",
        totalDistance.toFixed(1),
        "meters"
    );


    console.log(
        "Final duration:",
        duration,
        "ms"
    );


    // Save to backend

    await saveRun(duration);


    // Show result

    alert(

        `🏁 Run complete!\n\n` +

        `Distance: ` +

        `${totalDistance.toFixed(1)}m\n` +

        `Time: ` +

        `${(duration / 1000).toFixed(2)} sec`

    );


    // Reset UI

    resetRunUI();

}


// ======================================================
// MANUAL STOP
// ======================================================

async function stopRun() {

    // Don't stop if no run

    if (!isRunning) {

        return;
    }


    console.log(
        "🛑 Run stopped manually."
    );


    // Stop state

    isRunning = false;


    // Stop GPS + timer

    stopTracking();


    // Final duration

    const duration =
        Date.now() - startTime;


    console.log(
        "Final distance:",
        totalDistance.toFixed(1),
        "meters"
    );


    console.log(
        "Final duration:",
        duration,
        "ms"
    );


    // Save run

    await saveRun(duration);


    // Show result

    alert(

        `Run stopped!\n\n` +

        `Distance: ` +

        `${totalDistance.toFixed(1)}m\n` +

        `Time: ` +

        `${(duration / 1000).toFixed(2)} sec`

    );


    // Reset UI

    resetRunUI();

}


// ======================================================
// SAVE RUN TO DJANGO
// ======================================================

async function saveRun(durationMilliseconds) {

    // Backend wants seconds

    const durationSeconds =
        durationMilliseconds / 1000;


    const data = {

        target_distance:
            targetDistance,

        actual_distance:
            Number(
                totalDistance.toFixed(2)
            ),

        duration:
            durationSeconds,

        gps_accuracy:
            bestGpsAccuracy,

        started_at:
            new Date(
                startTime
            ).toISOString(),

        finished_at:
            new Date().toISOString()
    };


    console.log(
        "Sending run to backend:",
        data
    );


    try {

        const response =
            await fetch(

                `${API_URL}/runs/`,

                {

                    method: "POST",

                    credentials: "include",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "X-CSRFToken":
                            csrftoken
                    },

                    body:
                        JSON.stringify(data)
                }

            );


        if (!response.ok) {

            const errorData =
                await response.json();

            console.error(
                "Backend error:",
                errorData
            );

            return;
        }


        const result =
            await response.json();


        console.log(
            "✅ Run saved successfully:",
            result
        );


    }

    catch (error) {

        console.error(
            "❌ Failed to save run:",
            error
        );

    }

}


// ======================================================
// RESET UI AFTER RUN
// ======================================================

function resetRunUI() {

    totalDistance = 0;

    currentPosition = null;

    startTime = null;

    bestGpsAccuracy = null;


    timerElement.textContent =
        "00:00.00";


    liveDistanceElement.textContent =
        "0.0";


    progressPercentElement.textContent =
        "0";


    progressFillElement.style.width =
        "0%";


    gpsStatusElement.textContent =
        "GPS ready";


    // Hide live card

    liveRunCard.hidden = true;


    // Enable start button

    startRunBtn.disabled = false;


    console.log(
        "✅ Run completely reset."
    );

}