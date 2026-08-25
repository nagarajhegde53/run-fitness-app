// =============================
// Get Elements
// =============================

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginUsername = document.getElementById("loginUsername");
const loginPassword = document.getElementById("loginPassword");

const registerUsername = document.getElementById("registerUsername");
const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const confirmPassword = document.getElementById("confirmPassword");
const csrftoken = getCookie("csrftoken");
console.log("csrftoken");



function getCookie(name) {

    let cookieValue = null;

    if (document.cookie && document.cookie !== "") {

        const cookies = document.cookie.split(";");

        for (let cookie of cookies) {

            cookie = cookie.trim();

            if (cookie.startsWith(name + "=")) {

                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));

                break;

            }
        }
    }

    return cookieValue;
}

// =============================
// Switch Forms
// =============================

loginTab.addEventListener("click", () => {

    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

});


registerTab.addEventListener("click", () => {

    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

});


// =============================
// Login
// =============================

loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = loginUsername.value.trim();
    const password = loginPassword.value;

    const data = {
        username,
        password
    };

    try {
 const response = await fetch("https://run-fitness-app.onrender.com/login/",
    //    const response = await fetch("http://127.0.0.1:8000/login/", 
    {

    method: "POST",

    credentials: "include",

    headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": csrftoken
    },

    body: JSON.stringify(data)

});
        const result = await response.json();

        if (response.ok) {

            alert("Login Successful");

            // console.log(result);

            window.location.href = "notes.html";

        } else {

            alert(result.error || "Login Failed");

        }

    }

    catch (error) {

        console.error(error);

        alert("Server Error");

    }

});


// =============================
// Register
// =============================

registerForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const username = registerUsername.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value;
    const confirm = confirmPassword.value;

    if (password !== confirm) {

        alert("Passwords do not match");

        return;

    }

    const data = {

        username,
        email,
        password

    };

    try {
const response =await fetch("https://run-fitness-app.onrender.com/register/",
        // const response = await fetch("http://127.0.0.1:8000/register/",
         {

            method: "POST",

            headers: {

                "Content-Type": "application/json",
                 "X-CSRFToken": csrftoken

            },

            body: JSON.stringify(data)

        });

        const result = await response.json();

        if (response.ok) {

            alert("Registration Successful");

            registerForm.reset();

            loginTab.click();

        }

        else {

            alert(JSON.stringify(result));

        }

    }

    catch (error) {

        console.error(error);

        alert("Server Error");

    }

});