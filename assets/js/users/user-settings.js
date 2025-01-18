import { auth, db } from "../fireBaseConfig.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const isActiveCheckbox = document.getElementById('isActive');
const currencySelect = document.getElementById('currency');
const languageSelect = document.getElementById('language');
const saveButton = document.getElementById('saveSettings');

let targetUserId = new URLSearchParams(window.location.search).get('userId');

// Check if user is admin and load target user data
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const adminRef = ref(db, `users/${user.uid}/profile`);
        const adminSnapshot = await get(adminRef);
        const adminData = adminSnapshot.val();

        if (adminData.role !== 'admin') {
            alert('Unauthorized access');
            window.location.href = '../index.html';
            return;
        }

        loadUserData();
    } else {
        window.location.href = '../index.html';
    }
});

async function loadUserData() {
    if (!targetUserId) {
        alert('No user specified');
        window.location.href = 'users.html';
        return;
    }

    const userRef = ref(db, `users/${targetUserId}`);
    const snapshot = await get(userRef);
    const userData = snapshot.val();

    if (userData) {
        isActiveCheckbox.checked = userData.profile.isActive;
        currencySelect.value = userData.settings?.currency || 'usd';
        languageSelect.value = userData.settings?.language || 'en';
    }
}

saveButton.addEventListener('click', async () => {
    try {
        const updates = {
            [`users/${targetUserId}/profile/isActive`]: isActiveCheckbox.checked,
            [`users/${targetUserId}/settings/currency`]: currencySelect.value,
            [`users/${targetUserId}/settings/language`]: languageSelect.value
        };

        await update(ref(db), updates);
        alert('User settings updated successfully!');
    } catch (error) {
        console.error('Error updating user settings:', error);
        alert('Failed to update user settings');
    }
}); 