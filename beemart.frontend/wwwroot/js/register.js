const REGISTER_API_URL = "https://localhost:7276/api/v1/Auth/register";

document.addEventListener("DOMContentLoaded", () => {
    const formRegister = document.getElementById("formRegister");
    const alertBox = document.getElementById("alertMessage");

    if (!formRegister) return;

    formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (alertBox) {
            alertBox.style.display = "none";
        }

        const username = document.getElementById("username").value.trim();
        const fullName = document.getElementById("fullName").value.trim();
        const password = document.getElementById("password").value;
        const rePassword = document.getElementById("rePassword").value;
        const role = document.getElementById("role").value;
        if (password !== rePassword) {
            displayError("Password dan Re-Password tidak cocok");
            return;
        }

        const payload = {
            username: username,
            fullName: fullName,
            password: password,
            rePassword: rePassword,
            role: role
        };

        try {
            const response = await fetch(REGISTER_API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!response.ok) {
                displayError(result.message || "Gagal melakukan registrasi");
                return;
            }

            alert("Registrasi berhasil! Silakan login.");
            window.location.href = "/Login";

        } catch (err) {
            displayError("Gagal terhubung ke API");
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