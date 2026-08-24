// ==============================
// CSRF
// ==============================

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


// ==============================
// Backend
// ==============================

const API_URL = "http://127.0.0.1:8000";


// ==============================
// DOM elements
// ==============================
const MAX_GPS_ACCURACY = 50; // meters
const MAX_MOVEMENT_JUMP = 30; // meters per GPS update
const distanceButtons =
    document.querySelectorAll(".distance-option");

const selectedDistance =
    document.getElementById("selectedDistance");

const selectedUnit =
    document.getElementById("selectedUnit");

const startRunBtn =
    document.getElementById("startRunBtn");

const liveRunCard =
    document.getElementById("liveRunCard");
    const stopRunBtn =
    document.getElementById("stopRunBtn");
    stopRunBtn.addEventListener(
    "click",
    stopRun
);
let timerInterval = null;
let startTime = null;

let totalDistance = 0;
let currentPosition = null;
let watchId = null;

// ==============================
// Current target distance
// ==============================

let targetDistance = 100;


// ==============================
// Distance selection
// ==============================

distanceButtons.forEach(button => {

    button.addEventListener("click", () => {

        // Remove active from every button
        distanceButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        // Make clicked button active
        button.classList.add("active");

        // Get distance from HTML
        targetDistance =
            Number(button.dataset.distance);

        // Update display
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
            "Selected distance:",
            targetDistance,
            "meters"
        );
    });

});


// ==============================
// Start Run
// ==============================

startRunBtn.addEventListener("click", startRun);

function startRun() {

    console.log(
        "Starting run:",
        targetDistance,
        "meters"
    );


    if (!navigator.geolocation) {

        alert(
            "GPS is not supported by this browser."
        );

        return;
    }


    liveRunCard.hidden = false;

    startRunBtn.disabled = true;


    // Reset run state
    totalDistance = 0;

    currentPosition = null;

    startTime = Date.now();


    // Reset UI
    resetRunUI();


    // Start timer
    startTimer();


    // Start GPS
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
        "GPS tracking started"
    );
}



// start timer 
function startTimer() {

    // Don't create another timer
    if (timerInterval !== null) {
        return;
    }

    timerInterval = setInterval(() => {

        const elapsed =
            Date.now() - startTime;

        updateTimer(elapsed);

    }, 50);
}


// update timer 
function updateTimer(elapsed) {

    const totalSeconds = elapsed / 1000;

    const minutes = Math.floor(totalSeconds / 60);

    const seconds = Math.floor(totalSeconds % 60);

    const milliseconds =
        Math.floor(elapsed % 1000 / 10);

    const formattedTime =
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}.` +
        `${String(milliseconds).padStart(2, "0")}`;

    document.getElementById("timer").textContent =
        formattedTime;
}

// gps distance 
function calculateDistance(lat1, lon1, lat2, lon2) {

    const R = 6371000;

    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;

    const deltaLat =
        (lat2 - lat1) * Math.PI / 180;

    const deltaLon =
        (lon2 - lon1) * Math.PI / 180;

    const a =
        Math.sin(deltaLat / 2) ** 2 +
        Math.cos(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.sin(deltaLon / 2) ** 2;

    const c =
        2 * Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;
}

// handle position
function handlePosition(position) {

    const latitude =
        position.coords.latitude;

    const longitude =
        position.coords.longitude;

    const accuracy =
        position.coords.accuracy;


    console.log(
        "GPS:",
        latitude,
        longitude,
        "accuracy:",
        accuracy
    );


    // Show GPS accuracy
    document.getElementById("gpsStatus").textContent =
        `GPS ±${Math.round(accuracy)}m`;


    // =================================
    // FILTER 1: GPS accuracy
    // =================================

    if (accuracy > MAX_GPS_ACCURACY) {

        console.log(
            "❌ Ignoring GPS point - poor accuracy:",
            accuracy
        );

        return;
    }


    // =================================
    // FIRST RELIABLE GPS POINT
    // =================================

    if (currentPosition === null) {

        currentPosition = {
            latitude: latitude,
            longitude: longitude
        };

        console.log(
            "✅ First reliable GPS point saved"
        );

        return;
    }


    // =================================
    // Calculate movement
    // =================================

    const distance =
        calculateDistance(
            currentPosition.latitude,
            currentPosition.longitude,
            latitude,
            longitude
        );


    console.log(
        "Movement:",
        distance.toFixed(2),
        "meters"
    );


    // =================================
    // FILTER 2: GPS jump
    // =================================

    if (distance > MAX_MOVEMENT_JUMP) {

        console.log(
            "❌ Ignoring GPS jump:",
            distance.toFixed(2),
            "meters"
        );

        return;
    }


    // =================================
    // Accept point
    // =================================

    currentPosition = {
        latitude: latitude,
        longitude: longitude
    };


    totalDistance += distance;


    updateDistanceUI();


    console.log(
        "✅ Total distance:",
        totalDistance.toFixed(1),
        "meters"
    );


    // =================================
    // Target reached
    // =================================

    if (totalDistance >= targetDistance) {

        finishRun();

    }
}
// handle gps error
function handleGPSError(error) {

    console.error("GPS Error:", error);

   const gpsStatus =
    document.getElementById("gpsStatus");


if (accuracy <= 10) {

    gpsStatus.textContent =
        `GPS ±${Math.round(accuracy)}m • Excellent`;

} else if (accuracy <= 30) {

    gpsStatus.textContent =
        `GPS ±${Math.round(accuracy)}m • Good`;

} else if (accuracy <= 50) {

    gpsStatus.textContent =
        `GPS ±${Math.round(accuracy)}m • Fair`;

} else {

    gpsStatus.textContent =
        `GPS ±${Math.round(accuracy)}m • Poor`;
}}


// update distance ui
function updateDistanceUI() {

    const distanceElement =
        document.getElementById("liveDistance");

    distanceElement.textContent =
        totalDistance.toFixed(1);


    const progress =
        Math.min(
            (totalDistance / targetDistance) * 100,
            100
        );


    document.getElementById(
        "progressPercent"
    ).textContent =
        Math.round(progress);


    document.getElementById(
        "progressFill"
    ).style.width =
        `${progress}%`;
}


// finish run
function finishRun() {

    console.log("🏁 Target reached!");


    // Stop GPS
    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;
    }


    // Stop timer
    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;
    }


    const duration =
        Date.now() - startTime;


    console.log(
        "Distance:",
        totalDistance,
        "meters"
    );

    console.log(
        "Duration:",
        duration,
        "ms"
    );


    alert(
        `🏁 Run complete!\n\n` +
        `Distance: ${totalDistance.toFixed(1)}m\n` +
        `Time: ${(duration / 1000).toFixed(2)} sec`
    );


    resetRunState();

    resetRunUI();


    startRunBtn.disabled = false;
}

// stoprun
function stopRun() {

    console.log("Run stopped manually");


    // Stop GPS
    if (watchId !== null) {

        navigator.geolocation.clearWatch(
            watchId
        );

        watchId = null;
    }


    // Stop timer
    if (timerInterval !== null) {

        clearInterval(timerInterval);

        timerInterval = null;
    }


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


    alert(
        `Run stopped!\n\n` +
        `Distance: ${totalDistance.toFixed(1)}m\n` +
        `Time: ${(duration / 1000).toFixed(2)} sec`
    );


    // Reset everything
    resetRunState();

    resetRunUI();


    // Allow another run
    startRunBtn.disabled = false;
}



// reset ui
function resetRunUI() {

    document.getElementById("timer").textContent =
        "00:00.00";

    document.getElementById("liveDistance").textContent =
        "0";

    document.getElementById("progressPercent").textContent =
        "0";

    document.getElementById("progressFill").style.width =
        "0%";

    document.getElementById("gpsStatus").textContent =
        "GPS waiting...";
}


// reset run state
function resetRunState() {

    totalDistance = 0;

    currentPosition = null;

    startTime = null;

    watchId = null;

    timerInterval = null;
}



// 
