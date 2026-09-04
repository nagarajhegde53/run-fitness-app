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

        const response = await fetch(`${API_URL}/api/logout/`, {
            method: "POST",
            credentials: "include"
        });

        if (response.ok) {

            window.location.href = "auth.html";

        }

    } catch (error) {

        console.error("Logout failed:", error);

    }

});


loadUser();