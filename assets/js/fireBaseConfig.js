// firebaseConfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAU6I-6hknH9pcogoR2Mp1ToCzv_zjhsIA",
    authDomain: "expenseappv2.firebaseapp.com",
    projectId: "expenseappv2",
    storageBucket: "expenseappv2.firebasestorage.app",
    messagingSenderId: "377189367848",
    appId: "1:377189367848:web:65d2feca9769bdb48c751d",
    databaseURL: "https://expenseappv2-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export { app, db, auth };
