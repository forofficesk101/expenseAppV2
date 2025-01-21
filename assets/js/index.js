import { auth, db } from "./fireBaseConfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { initAuthGuard } from "./auth/authGuard.js";

// Initialize auth guard
initAuthGuard();

// Function to fetch and store all user data
async function fetchAndStoreUserData(userId) {
    try {
        // Fetch user profile and settings
        const userRef = ref(db, `users/${userId}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val();

        console.log('Raw User Data:', userData);

        if (userData) {
            // Store user profile
            localStorage.setItem('userProfile', JSON.stringify(userData.profile));
            console.log('User Profile:', userData.profile);
            
            // Store user settings
            const settings = userData.settings || {};
            localStorage.setItem('userSettings', JSON.stringify(settings));
            console.log('User Settings:', settings);
            
            // Store categories
            const categories = userData.categories || {};
            localStorage.setItem('categories', JSON.stringify(categories));
            console.log('Categories:', categories);
            
            // Store transactions
            const transactions = userData.transactions || {};
            localStorage.setItem('transactions', JSON.stringify(transactions));
            console.log('Transactions:', transactions);
            
            // Store loans
            const loans = userData.loans || {};
            localStorage.setItem('loans', JSON.stringify(loans));
            console.log('Loans:', loans);

            // Process transactions for monthly statistics
            const monthlyStats = processTransactionsForMonthlyStats(transactions);
            localStorage.setItem('monthlyStats', JSON.stringify(monthlyStats));
            console.log('Monthly Stats:', monthlyStats);

            // Store monthly stats in transactionsTableData for backward compatibility
            localStorage.setItem('transactionsTableData', JSON.stringify(monthlyStats));

            // Update UI with current month summary
            console.log('Current Month Data:', monthlyStats[0]);
            updateCurrentMonthSummary(monthlyStats[0]); // First item is current month
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

// Process transactions for monthly statistics
function processTransactionsForMonthlyStats(transactions) {
    const monthlyData = {};

    console.log('Processing Transactions:', transactions);

    // Process each transaction
    Object.values(transactions).forEach(transaction => {
        const date = new Date(transaction.date);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })},${date.getFullYear()}`;

        if (!monthlyData[monthYear]) {
            monthlyData[monthYear] = {
                monthYear,
                expenses: {},
                cashins: {}
            };
        }

        const type = transaction.expenseType;
        const amount = parseFloat(transaction.amount);

        if (transaction.transactionType === 'Expense') {
            monthlyData[monthYear].expenses[type] = (monthlyData[monthYear].expenses[type] || 0) + amount;
        } else if (transaction.transactionType === 'CashIn') {
            monthlyData[monthYear].cashins[type] = (monthlyData[monthYear].cashins[type] || 0) + amount;
        }
    });

    console.log('Monthly Data Before Sorting:', monthlyData);

    // Convert to array and sort by date (newest first)
    const sortedData = Object.values(monthlyData).sort((a, b) => {
        const [aMonth, aYear] = a.monthYear.split(',');
        const [bMonth, bYear] = b.monthYear.split(',');
        return new Date(bYear, new Date().getMonth(aMonth)) - new Date(aYear, new Date().getMonth(bMonth));
    });

    console.log('Sorted Monthly Data:', sortedData);
    return sortedData;
}

// Update current month summary in UI
function updateCurrentMonthSummary(currentMonthData) {
    if (currentMonthData) {
        const { expenses, cashins, monthYear } = currentMonthData;
        
        console.log('Updating UI with:', {
            monthYear,
            expenses,
            cashins
        });

        document.getElementById('SummaryLabel').textContent = monthYear + " Summary";

        // Calculate totals
        const totalExpenses = Object.values(expenses).reduce((acc, value) => acc + value, 0);
        const totalCashin = Object.values(cashins).reduce((acc, value) => acc + value, 0);
        const walletValue = totalCashin - totalExpenses;

        console.log('Calculated Totals:', {
            totalExpenses,
            totalCashin,
            walletValue
        });

        // Update UI
        document.getElementById('walletValue').textContent = `${walletValue} Tk`;
        document.getElementById('expensesValue').textContent = `${totalExpenses} Tk`;
        document.getElementById('cashinValue').textContent = `${totalCashin} Tk`;
    } else {
        console.log('No current month data available');
        document.getElementById('currentMonthTable').innerHTML = '<tr><td colspan="2">No data available</td></tr>';
    }
}

// Auth state observer
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userRef = ref(db, `users/${user.uid}/profile`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // Show/hide admin buttons based on role
        const usersMenuItem = document.getElementById('usersMenuItem');
        if (usersMenuItem) {
            usersMenuItem.style.display = userData && userData.role === 'admin' ? 'block' : 'none';
        }

        // Fetch and store all user data
        await fetchAndStoreUserData(user.uid);
    } else {
        // Clear localStorage when user logs out
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

// Logout handler
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        localStorage.clear();
        window.location.href = 'login.html';
    }).catch((error) => {
        console.error('Logout failed:', error);
    });
}); 