import { db } from "../fireBaseConfig.js";
import { ref, onValue, update,set  } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function populateOptions(filterExpense) {
    const selectElement = document.getElementById('expenseType');
    const data = JSON.parse(localStorage.getItem('categoriesOnDb'));
    // console.log(data);
    // console.log(filterExpense);
    var isExpnese =  filterExpense == "Expense" ? true: false ;
   

    // Clear existing options except the first "Select" option
    selectElement.length = 1;

    // Iterate through each key in the data object
    for (const key in data) {
        const item = data[key];
        
        // Check the isExpense property based on the filterExpense parameter
        if (item.isExpense === isExpnese) {
            // Create a new option element
            const option = new Option(item.name, item.value);
            // Append the option to the select element
            selectElement.add(option);
        }
    }
}

function fetchTransactionDetails(transactionId) {
    const userId = 'shakhawatt';
    const transactionRef = ref(db, `users/${userId}/transactions/${transactionId}`);

    onValue(transactionRef, (snapshot) => {
        const data = snapshot.val();
        // console.log(data);
        populateOptions(data.transactionType);
        if (data) {
            document.getElementById('transactionType').value = data.transactionType || '';
            document.getElementById('expenseType').value = data.expenseType || '';
            document.getElementById('amount').value = data.amount || '';
            document.getElementById('date').value = data.date || '';
            document.getElementById('description').textContent = data.description || '';
        }
    }, {
        onlyOnce: true
    });
}

document.getElementById('transactionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const transactionId = getQueryParam('id');
    const transactionRef = ref(db, `users/shakhawatt/transactions/${transactionId}`);

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

document.getElementById('deleteBtn').addEventListener('click', function() {
    const transactionId = getQueryParam('id');
    const transactionRef = ref(db, `users/shakhawatt/transactions/${transactionId}`);

    // Use set() with null to remove data in Firebase 9.x
    set(transactionRef, null).then(() => {
        alert('Transaction successfully deleted!');
        window.location.href = 'transactionList.html'; // Redirect to transaction list after deletion
    }).catch((error) => {
        console.error('Error deleting transaction: ', error);
        alert('Failed to delete transaction. Please try again.');
    });
});
const transactionId = getQueryParam('id');
if (transactionId) {
    fetchTransactionDetails(transactionId);
} else {
    alert('No transaction ID provided.');
}

