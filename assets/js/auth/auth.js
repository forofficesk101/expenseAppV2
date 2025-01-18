import { auth, db } from "../fireBaseConfig.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";
import { ref, set, get } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

export async function registerUser(email, password) {
    try {
        // Create auth user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create initial user data structure
        const userRef = ref(db, `users/${user.uid}`);
        await set(userRef, {
            profile: {
                email: email,
                displayName: email.split('@')[0], // Use part before @ as display name
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                isActive: false, // Requires admin activation
                role: 'user'
            },
            settings: {
                currency: 'usd',
                language: 'en'
            },
            categories: {
                // Default categories
                expense1: {
                    creationDate: new Date().toLocaleDateString("en-GB"),
                    isExpense: true,
                    name: "Food",
                    value: "Food"
                },
                income1: {
                    creationDate: new Date().toLocaleDateString("en-GB"),
                    isExpense: false,
                    name: "Salary",
                    value: "Salary"
                }
            },
            transactions: {},
            loans: {}
        });

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { success: false, error: error.message };
    }
}

export async function loginUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Check if user is active
        const userRef = ref(db, `users/${user.uid}/profile`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        if (!userData.isActive) {
            await auth.signOut();
            throw new Error("Account is not activated. Please contact administrator.");
        }

        // Update last login
        await set(ref(db, `users/${user.uid}/profile/lastLogin`), new Date().toISOString());
        
        return { success: true, role: userData.role };
    } catch (error) {
        console.error("Login error:", error);
        return { success: false, error: error.message };
    }
} 