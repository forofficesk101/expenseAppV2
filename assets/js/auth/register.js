import { registerUser } from "./auth.js";

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords don't match!");
        return;
    }

    try {
        const result = await registerUser(email, password);
        if (result.success) {
            alert('Registration successful! Please wait for admin activation.');
            window.location.href = 'login.html';
        } else {
            alert('Registration failed: ' + result.error);
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}); 