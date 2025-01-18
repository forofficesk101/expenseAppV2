import { auth, db } from "../fireBaseConfig.js";
import { ref, push, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const loansTableBody = document.getElementById('loansTableBody');
const installmentsTableBody = document.getElementById('installmentsTableBody');
const loanAmountInput = document.getElementById('loanAmount');
const remainingAmountInput = document.getElementById('remainingAmount');
const loanNameInput = document.getElementById('loanName');
const saveLoanBtn = document.getElementById('saveLoanBtn');
const addLoanModal = new bootstrap.Modal(document.getElementById('addLoanModal'));

let currentUserId = null;
let currentInstallments = [];

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadLoans();
    } else {
        window.location.href = '../index.html';
    }
});

// Load loans
function loadLoans() {
    const loansRef = ref(db, `users/${currentUserId}/loans`);
    onValue(loansRef, (snapshot) => {
        const loans = snapshot.val();
        loansTableBody.innerHTML = '';

        if (loans) {
            Object.entries(loans).forEach(([loanId, loan]) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${loan.name}</td>
                    <td>${loan.totalAmount}</td>
                    <td>${loan.status}</td>
                `;
                loansTableBody.appendChild(row);
            });
        }
    });
}

// Handle loan amount input
loanAmountInput.addEventListener('input', (e) => {
    remainingAmountInput.value = e.target.value;
});

// Add empty installment row
function addInstallmentRow() {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="text" class="form-control" placeholder="Installment name"></td>
        <td><input type="number" class="form-control installment-amount"></td>
        <td><input type="date" class="form-control"></td>
        <td>
            <button type="button" class="btn btn-success btn-sm add-installment">Add</button>
            <button type="button" class="btn btn-danger btn-sm remove-installment" style="display:none">Remove</button>
        </td>
    `;

    installmentsTableBody.appendChild(row);

    // Add event listeners for the new row
    const addBtn = row.querySelector('.add-installment');
    const removeBtn = row.querySelector('.remove-installment');
    const amountInput = row.querySelector('.installment-amount');

    addBtn.addEventListener('click', () => {
        const nameInput = row.querySelector('input[type="text"]');
        const dateInput = row.querySelector('input[type="date"]');
        
        if (nameInput.value && amountInput.value && dateInput.value) {
            // Add to installments array
            currentInstallments.push({
                installmentName: nameInput.value,
                paidAmount: parseFloat(amountInput.value),
                paymentDate: dateInput.value,
                createdAt: new Date().toISOString()
            });

            // Update remaining amount
            const paidAmount = parseFloat(amountInput.value);
            remainingAmountInput.value = (parseFloat(remainingAmountInput.value) - paidAmount).toString();

            // Disable inputs and switch buttons
            nameInput.disabled = true;
            amountInput.disabled = true;
            dateInput.disabled = true;
            addBtn.style.display = 'none';
            removeBtn.style.display = 'inline-block';

            // Add new empty row
            addInstallmentRow();
        }
    });

    removeBtn.addEventListener('click', () => {
        const index = Array.from(installmentsTableBody.children).indexOf(row);
        const removedInstallment = currentInstallments[index];
        
        // Update remaining amount
        remainingAmountInput.value = (parseFloat(remainingAmountInput.value) + removedInstallment.paidAmount).toString();
        
        // Remove from array and table
        currentInstallments.splice(index, 1);
        row.remove();
    });
}

// Initialize first empty row
addInstallmentRow();

// Save loan
saveLoanBtn.addEventListener('click', async () => {
    if (!loanNameInput.value || !loanAmountInput.value) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const newLoanRef = push(ref(db, `users/${currentUserId}/loans`));
        const loanData = {
            name: loanNameInput.value,
            totalAmount: parseFloat(loanAmountInput.value),
            remainingAmount: parseFloat(remainingAmountInput.value),
            status: parseFloat(remainingAmountInput.value) > 0 ? 'unpaid' : 'paid',
            createdAt: new Date().toISOString(),
            installments: {}
        };

        // Add installments
        currentInstallments.forEach((installment, index) => {
            loanData.installments[`inst${index + 1}`] = installment;
        });

        await set(newLoanRef, loanData);
        
        // Reset form
        loanNameInput.value = '';
        loanAmountInput.value = '';
        remainingAmountInput.value = '';
        currentInstallments = [];
        installmentsTableBody.innerHTML = '';
        addInstallmentRow();
        
        addLoanModal.hide();
        alert('Loan added successfully!');
    } catch (error) {
        console.error('Error saving loan:', error);
        alert('Failed to save loan');
    }
}); 