const AUTH_API_URL = "https://localhost:7276/api/v1/Auth/login";

document.addEventListener("DOMContentLoaded", () => {
    const formLogin = document.getElementById("formLogin");
    const alertBox = document.getElementById("alertMessage");

    if (!formLogin) return;
    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (alertBox) {
            alertBox.style.display = "none";
        }

        const usernameInput = document.getElementById("username");
        const passwordInput = document.getElementById("password");
        const roleInput = document.getElementById("role");

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const role = roleInput ? roleInput.value : "";

        if (!username || !password || !role) {
            displayError("Invalid login");
            return;
        }

        try {
            const response = await fetch(AUTH_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password, role })
            });

            const result = await response.json();

            if (!response.ok) {
                displayError(result.message || "Invalid login");
                return;
            }
            localStorage.setItem("beemart_user", JSON.stringify(result));
            window.location.href = "/Transaction";

        } catch (err) {
            displayError("Gagal masuk API");
        }
    });

    function displayError(message) {
        if (alertBox) {
            alertBox.innerText = message;
            alertBox.style.display = "block";
        } else {
            alert(message);
        }
    }
});