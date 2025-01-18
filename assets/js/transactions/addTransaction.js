import { db } from "../fireBaseConfig.js";
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

const expenseForm = document.getElementById('expenseForm');
const expenseTypeSelect = document.getElementById('expenseType');
const transactionTypeSelect = document.getElementById('transactionType');
const transactionLabel = document.getElementById('transactionLabel');
const userId = 'shakhawatt';  // Define the user ID here or retrieve from user authentication session

// Handle transaction type change
transactionTypeSelect.addEventListener('change', () => {
    // console.log("triggerd");
    expenseTypeSelect.value = "";
    transactionLabel.textContent = `${transactionTypeSelect.value} Type`;
    updateExpenseOptions(transactionTypeSelect.value);
});

// Fetch and filter categories based on transaction type
function updateExpenseOptions(transactionType) {
    onValue(ref(db, `users/${userId}/categories`), (snapshot) => {
        const categories = snapshot.val();
        expenseTypeSelect.innerHTML = '';
        if (categories) {
            console.log(transactionType);
            Object.keys(categories).forEach(key => {
                const category = categories[key];
                console.log(category);

                if (transactionType === 'Expense' && category.isExpense) {
                    const option = document.createElement('option');
                    option.value = category.value;
                    option.textContent = category.name;
                    expenseTypeSelect.appendChild(option);
                } else if (transactionType === 'CashIn' && !category.isExpense) {
                    const option = document.createElement('option');
                    option.value = category.value;
                    option.textContent = category.name;
                    expenseTypeSelect.appendChild(option);
                }
            });
        }
    });
}

// Handle form submission
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const transactionType = transactionTypeSelect.value;
    const expenseType = expenseTypeSelect.value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    const newTransactionRef = push(ref(db, `users/${userId}/transactions`));
    set(newTransactionRef, {
        transactionType: transactionType,
        expenseType: expenseType,
        amount: amount,
        description: description,
        date: date,
        timestamp: Date.now()
    }).then(() => {
        alert(`${transactionType} successfully added!`);
    }).catch((error) => {
        console.error('Error adding transaction: ', error);
        alert('Failed to add transaction. Please try again.');
    });
});
