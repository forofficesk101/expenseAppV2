import { app } from "../fireBaseConfig.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const auth = getAuth(app);

export function initAuthGuard() {
    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath.includes('login.html') || currentPath.includes('register.html');

        if (!user && !isAuthPage) {
            // User is not logged in and trying to access protected page
            window.location.href = '/login.html';
        } else if (user && isAuthPage) {
            // User is logged in and trying to access auth pages
            window.location.href = '/index.html';
        }
    });
} 