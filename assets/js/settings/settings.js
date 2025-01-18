import { auth, db } from "../fireBaseConfig.js";
import { ref, get, set } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const userSettings = document.getElementById('userSettings');
const adminSettings = document.getElementById('adminSettings');
const currencySelect = document.getElementById('currency');
const languageSelect = document.getElementById('language');
const saveButton = document.getElementById('saveSettings');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (userData.profile.role === 'admin') {
            userSettings.style.display = 'none';
            adminSettings.style.display = 'block';
            
            // Load current settings
            currencySelect.value = userData.settings.currency || 'usd';
            languageSelect.value = userData.settings.language || 'en';
        }
    } else {
        window.location.href = '../index.html';
    }
});

saveButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
        const userRef = ref(db, `users/${user.uid}/settings`);
        await set(userRef, {
            currency: currencySelect.value,
            language: languageSelect.value
        });
        alert('Settings saved successfully!');
    }
}); 