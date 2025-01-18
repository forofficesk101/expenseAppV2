import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, update, set } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function populateOptions(filterExpense) {
    const selectElement = document.getElementById('expenseType');
    const data = JSON.parse(localStorage.getItem('categoriesOnDb'));
    var isExpense = filterExpense == "Expense" ? true : false;

    // Clear existing options except the first "Select" option
    selectElement.length = 1;

    // Iterate through each key in the data object
    for (const key in data) {
        const item = data[key];
        
        // Check the isExpense property based on the filterExpense parameter
        if (item.isExpense === isExpense) {
            // Create a new option element
            const option = new Option(item.name, item.value);
            // Append the option to the select element
            selectElement.add(option);
        }
    }
}

function fetchTransactionDetails(userId, transactionId) {
    const transactionRef = ref(db, `users/${userId}/transactions/${transactionId}`);
    
    onValue(transactionRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            populateOptions(data.transactionType);
            document.getElementById('transactionType').value = data.transactionType || '';
            document.getElementById('expenseType').value = data.expenseType || '';
            document.getElementById('amount').value = data.amount || '';
            document.getElementById('date').value = data.date || '';
            document.getElementById('description').textContent = data.description || '';
        } else {
            alert('Transaction not found');
            window.location.href = 'transactionList.html';
        }
    }, {
        onlyOnce: true
    });
}

// Initialize with auth check
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '../login.html';
        return;
    }

    const transactionId = getQueryParam('id');
    if (!transactionId) {
        alert('No transaction ID provided');
        window.location.href = 'transactionList.html';
        return;
    }

    // Set up form submission handler
    document.getElementById('transactionForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const transactionRef = ref(db, `users/${user.uid}/transactions/${transactionId}`);

        const updatedData = {
            expenseType: document.getElementById('expenseType').value,
            amount: document.getElementById('amount').value,
            date: document.getElementById('date').value,
            description: document.getElementById('description').value
        };

        update(transactionRef, updatedData).then(() => {
            alert('Transaction successfully updated!');
        }).catch((error) => {
            console.error('Error updating transaction: ', error);
            alert('Failed to update transaction. Please try again.');
        });
    });

    // Set up delete button handler
    document.getElementById('deleteBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this transaction?')) {
            const transactionRef = ref(db, `users/${user.uid}/transactions/${transactionId}`);
            set(transactionRef, null).then(() => {
                alert('Transaction successfully deleted!');
                window.location.href = 'transactionList.html';
            }).catch((error) => {
                console.error('Error deleting transaction: ', error);
                alert('Failed to delete transaction. Please try again.');
            });
        }
    });

    // Load transaction details
    fetchTransactionDetails(user.uid, transactionId);
});

