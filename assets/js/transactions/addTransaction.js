import { auth, db } from "../fireBaseConfig.js";
import { ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

const expenseForm = document.getElementById('expenseForm');
const expenseTypeSelect = document.getElementById('expenseType');
const transactionTypeSelect = document.getElementById('transactionType');
const transactionLabel = document.getElementById('transactionLabel');

// Handle transaction type change
transactionTypeSelect.addEventListener('change', () => {
    const selectedType = transactionTypeSelect.value;
    expenseTypeSelect.innerHTML = '<option value="">Select</option>'; // Reset options
    transactionLabel.textContent = `${selectedType} Type`;

    if (selectedType) {
        const userId = auth.currentUser.uid;
        const categoriesRef = ref(db, `users/${userId}/categories`);
        
        onValue(categoriesRef, (snapshot) => {
            const categories = snapshot.val();
            if (categories) {
                Object.entries(categories).forEach(([key, category]) => {
                    // For Expense type, show expense categories. For CashIn, show income categories
                    if ((selectedType === 'Expense' && category.isExpense) || 
                        (selectedType === 'CashIn' && !category.isExpense)) {
                        const option = document.createElement('option');
                        option.value = category.value;
                        option.textContent = category.name;
                        expenseTypeSelect.appendChild(option);
                    }
                });
            }
        }, {
            onlyOnce: true
        });
    }
});

// Handle form submission
expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const transactionType = transactionTypeSelect.value;
    const expenseType = expenseTypeSelect.value;
    const amount = document.getElementById('amount').value;
    const description = document.getElementById('description').value;
    const date = document.getElementById('date').value;

    if (!transactionType || !expenseType || !amount || !date) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const userId = auth.currentUser.uid;
        const newTransactionRef = push(ref(db, `users/${userId}/transactions`));
        await set(newTransactionRef, {
            transactionType: transactionType,
            expenseType: expenseType,
            amount: amount,
            description: description,
            date: date,
            timestamp: Date.now()
        });

        alert(`${transactionType} successfully added!`);
        expenseForm.reset();
    } catch (error) {
        console.error('Error adding transaction: ', error);
        alert('Failed to add transaction. Please try again.');
    }
});
