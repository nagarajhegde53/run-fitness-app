const API_BASE_URL = "https://run-fitness-app.onrender.com";

// Back to the menu
const backBtn = document.getElementById("backBtn");

backBtn.addEventListener("click", () => {
    window.location.href = "/menu.html";
});

// Load the logged-in user's profile
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

        // Handle authentication and other HTTP errors
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new Error(
                    "You are not authenticated. Please log in again."
                );
            }

            throw new Error(
                `Profile request failed with status ${response.status}`
            );
        }

        const data = await response.json();

        // Display username
        usernameElement.textContent = data.username;

        // Display the first letter of the username
        avatarElement.textContent =
            data.username ? data.username.charAt(0).toUpperCase() : "?";

        // Temporary message until we implement the activity API
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