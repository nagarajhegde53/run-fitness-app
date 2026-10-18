const API_BASE_URL = "https://run-fitness-app.onrender.com";

// Back to menu
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
    window.location.href = "/menu.html";
});

// Convert timestamp into "Last active X days ago"
function formatLastActive(timestamp) {
    if (!timestamp) {
        return "Never";
    }

    const lastActive = new Date(timestamp);
    const now = new Date();

    const difference = Math.max(0, now - lastActive);
    const minutes = Math.floor(difference / (1000 * 60));
    const hours = Math.floor(difference / (1000 * 60 * 60));
    const days = Math.floor(difference / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
        return "Just now";
    }

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    if (hours < 24) {
        return `${hours}h ago`;
    }

    return `${days}d ago`;
}

// Load profile
async function loadProfile() {
    const usernameElement = document.getElementById("username");
    const avatarElement = document.getElementById("profileAvatar");
    const activityList = document.getElementById("activityList");

    try {
        const response = await fetch(`${API_BASE_URL}/api/profile/`, {
            method: "GET",
            credentials: "include",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error("Please log in again.");
            }

            throw new Error(`Profile request failed: ${response.status}`);
        }

        const data = await response.json();

        // Username
        usernameElement.textContent = data.username;

        // Avatar
        avatarElement.textContent =
            data.username ? data.username.charAt(0).toUpperCase() : "?";

        // Lifetime pushups
        document.getElementById("totalPushups").textContent =
            data.total_pushups ?? 0;

        // Lifetime running distance
        document.getElementById("totalRunsKm").textContent =
            `${Number(data.total_runs_km ?? 0).toFixed(2)} km`;

        // Last app activity
        document.getElementById("lastActive").textContent =
            formatLastActive(data.last_active);

        // Not implemented yet
        document.getElementById("totalSquats").textContent = "—";
        document.getElementById("streakValue").textContent = "—";
        document.getElementById("strengthPoints").textContent = "—";

        // Recent activity API not implemented yet
        activityList.textContent =
            "Your recent workouts will appear here soon.";

    } catch (error) {
        console.error("Profile loading error:", error);

        usernameElement.textContent = "Unable to load profile";
        avatarElement.textContent = "?";

        activityList.textContent = error.message;
    }
}

loadProfile();