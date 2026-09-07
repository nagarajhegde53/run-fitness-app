let csrftoken = null;

async function getCSRFToken() {

    const response = await fetch(
        `${API_URL}/api/csrf/`,
        {
            method: "GET",
            credentials: "include"
        }
    );

    const data = await response.json();

    csrftoken = data.csrfToken;

    return csrftoken;
}
const API_URL = "https://run-fitness-app.onrender.com";


async function loadUser() {

    try {

        const response = await fetch(`${API_URL}/api/me/`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {

            window.location.href = "auth.html";
            return;
        }

        const data = await response.json();

        document.getElementById("welcomeMessage").textContent =
            `Welcome, ${data.username} 👋`;

    } catch (error) {

        console.error("Failed to load user:", error);

    }
}


document.getElementById("runTrackBtn").addEventListener("click", () => {

    window.location.href = "notes.html";

});
document.getElementById("pushupBtn").addEventListener("click", () => {

    alert("💪 Pushup AI is coming soon!");

});


document.getElementById("squatBtn").addEventListener("click", () => {

    alert("🦵 Squat AI is coming soon!");

});


document.getElementById("logoutBtn").addEventListener("click", async () => {

    try {

        const token = await getCSRFToken();

        const response = await fetch(`${API_URL}/api/logout/`, {
            method: "POST",
            credentials: "include",
            headers: {
                "X-CSRFToken": token
            }
        });

        if (response.ok) {

            window.location.href = "auth.html";

        } else {

            console.error("Logout failed:", await response.text());

        }

    } catch (error) {

        console.error("Logout failed:", error);

    }

});

loadUser();