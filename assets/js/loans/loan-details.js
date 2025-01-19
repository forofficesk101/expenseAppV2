import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, update, remove, set } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const loanNameTitle = document.getElementById('loanNameTitle');
const totalAmountSpan = document.getElementById('totalAmount');
const paidAmountSpan = document.getElementById('paidAmount');
const remainingAmountSpan = document.getElementById('remainingAmount');
const installmentsTableBody = document.getElementById('installmentsTableBody');
const addInstallmentBtn = document.getElementById('addInstallmentBtn');

let currentUserId = null;
let currentLoanId = new URLSearchParams(window.location.search).get('id');
let installmentCounter = 1;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        if (!currentLoanId) {
            alert('No loan ID provided');
            window.location.href = 'loans.html';
            return;
        }
        loadLoanDetails();
    } else {
        window.location.href = '../login.html';
    }
});

// Load loan details
function loadLoanDetails() {
    const loanRef = ref(db, `users/${currentUserId}/loans/${currentLoanId}`);
    onValue(loanRef, (snapshot) => {
        const loan = snapshot.val();
        if (!loan) {
            alert('Loan not found');
            window.location.href = 'loans.html';
            return;
        }

        // Update header and summary
        loanNameTitle.textContent = loan.name;
        totalAmountSpan.textContent = loan.totalAmount;
        
        // Load installments
        loadInstallments(loan.installments || {});
    });
}

// Load and display installments
function loadInstallments(installments) {
    installmentsTableBody.innerHTML = '';
    let totalPaid = 0;

    Object.entries(installments).forEach(([instId, inst]) => {
        totalPaid += parseFloat(inst.amount || 0);
        addInstallmentRow(instId, inst);
    });

    // Update summary amounts
    const totalAmount = parseFloat(totalAmountSpan.textContent);
    paidAmountSpan.textContent = totalPaid;
    remainingAmountSpan.textContent = totalAmount - totalPaid;
    
    // Update installment counter
    installmentCounter = Object.keys(installments).length + 1;
}

// Add installment row to table
function addInstallmentRow(instId, inst, isNew = false) {
    const row = document.createElement('tr');
    row.dataset.id = instId;
    row.innerHTML = `
        <td>
            <span class="display-value">${inst.name}</span>
            <input type="text" class="form-control edit-field" value="${inst.name}">
        </td>
        <td>
            <span class="display-value">${inst.amount || 0}</span>
            <input type="number" class="form-control edit-field" value="${inst.amount || 0}">
        </td>
        <td>
            <button class="btn btn-sm btn-primary edit-btn">
                <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-success save-btn" style="display:none;">
                <i class="bi bi-check"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-btn">
                <i class="bi bi-trash"></i>
            </button>
        </td>
    `;

    // Add event listeners
    attachRowEventListeners(row);

    // If new row, enter edit mode immediately
    if (isNew) {
        row.classList.add('edit-mode');
        row.querySelector('.edit-btn').style.display = 'none';
        row.querySelector('.save-btn').style.display = 'inline-block';
    }

    installmentsTableBody.appendChild(row);
}

// Attach event listeners to row buttons
function attachRowEventListeners(row) {
    const editBtn = row.querySelector('.edit-btn');
    const saveBtn = row.querySelector('.save-btn');
    const deleteBtn = row.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
        row.classList.add('edit-mode');
        editBtn.style.display = 'none';
        saveBtn.style.display = 'inline-block';
    });

    saveBtn.addEventListener('click', async () => {
        const nameInput = row.querySelector('input[type="text"]');
        const amountInput = row.querySelector('input[type="number"]');
        
        const installmentData = {
            name: nameInput.value,
            amount: parseFloat(amountInput.value) || 0
        };

        try {
            await update(ref(db, `users/${currentUserId}/loans/${currentLoanId}/installments/${row.dataset.id}`), 
                installmentData);
            
            row.classList.remove('edit-mode');
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
        } catch (error) {
            console.error('Error saving installment:', error);
            alert('Failed to save installment');
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this installment?')) {
            try {
                await remove(ref(db, `users/${currentUserId}/loans/${currentLoanId}/installments/${row.dataset.id}`));
            } catch (error) {
                console.error('Error deleting installment:', error);
                alert('Failed to delete installment');
            }
        }
    });
}

// Add new installment
addInstallmentBtn.addEventListener('click', async () => {
    const newInstallment = {
        name: `Installment ${installmentCounter}`,
        amount: 0,
        createdAt: new Date().toISOString()
    };

    try {
        // Create new reference and save directly to database
        const newInstRef = push(ref(db, `users/${currentUserId}/loans/${currentLoanId}/installments`));
        await set(newInstRef, newInstallment);
        // Remove the line that adds the row locally - the database listener will handle it
        // addInstallmentRow(newInstRef.key, newInstallment, true);
    } catch (error) {
        console.error('Error adding installment:', error);
        alert('Failed to add installment');
    }
}); 