import { auth, db } from "../fireBaseConfig.js";
import { ref, get, onValue } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const usersTableBody = document.getElementById('usersTableBody');

// Check if user is admin
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}/profile`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.role !== 'admin') {
            alert('Unauthorized access');
            window.location.href = '../index.html';
            return;
        }

        // Load users if admin
        loadUsers();
    } else {
        window.location.href = '../index.html';
    }
});

function loadUsers() {
    const usersRef = ref(db, 'users');
    onValue(usersRef, (snapshot) => {
        const users = snapshot.val();
        usersTableBody.innerHTML = '';

        for (const [userId, userData] of Object.entries(users)) {
            if (userData.profile) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${userData.profile.displayName || 'N/A'}</td>
                    <td>${userData.profile.email}</td>
                    <td>${new Date(userData.profile.createdAt).toLocaleDateString()}</td>
                    <td>${userData.profile.isActive ? 'Active' : 'Inactive'}</td>
                `;
                
                row.addEventListener('click', () => {
                    window.location.href = `user-settings.html?userId=${userId}`;
                });

                usersTableBody.appendChild(row);
            }
        }
    });
} 