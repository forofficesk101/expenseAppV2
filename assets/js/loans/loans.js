import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const loansTableBody = document.getElementById('loansTableBody');
const addLoanModal = new bootstrap.Modal(document.getElementById('addLoanModal'));
const loanForm = document.getElementById('loanForm');
const modalTitle = document.getElementById('modalTitle');
const loanIdInput = document.getElementById('loanId');
const loanNameInput = document.getElementById('loanName');
const loanAmountInput = document.getElementById('loanAmount');
const remainingAmountInput = document.getElementById('remainingAmount');
const saveLoanBtn = document.getElementById('saveLoanBtn');
const deleteLoanBtn = document.getElementById('deleteLoanBtn');

let currentUserId = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadLoans();
    } else {
        window.location.href = '../login.html';
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
                const paidAmount = calculatePaidAmount(loan.installments || {});
                const totalAmount = parseFloat(loan.totalAmount);
                const remainingAmount = totalAmount - paidAmount;
                const status = remainingAmount <= 0 ? 'Paid' : 'Unpaid';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${loan.name}</td>
                    <td>${paidAmount}/${totalAmount}</td>
                    <td>${status}</td>
                    <td>
                        <i class="bi bi-pencil-square edit-icon" data-loan-id="${loanId}"></i>
                    </td>
                `;

                // Add click handler for row (excluding edit icon)
                row.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-icon')) {
                        window.location.href = `loan-details.html?id=${loanId}`;
                    }
                });

                // Add click handler for edit icon
                row.querySelector('.edit-icon').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(loanId, loan);
                });

                loansTableBody.appendChild(row);
            });
        }
    });
}

// Calculate total paid amount from installments
function calculatePaidAmount(installments) {
    return Object.values(installments || {}).reduce((total, inst) => 
        total + parseFloat(inst.amount || 0), 0);
}

// Reset modal form
function resetModal() {
    modalTitle.textContent = 'Add New Loan';
    loanForm.reset();
    loanIdInput.value = '';
    deleteLoanBtn.style.display = 'none';
    remainingAmountInput.value = '';
}

// Open edit modal
function openEditModal(loanId, loan) {
    modalTitle.textContent = 'Edit Loan';
    loanIdInput.value = loanId;
    loanNameInput.value = loan.name;
    loanAmountInput.value = loan.totalAmount;
    
    const paidAmount = calculatePaidAmount(loan.installments);
    remainingAmountInput.value = loan.totalAmount - paidAmount;
    
    deleteLoanBtn.style.display = 'block';
    addLoanModal.show();
}

// Handle loan amount input
loanAmountInput.addEventListener('input', (e) => {
    remainingAmountInput.value = e.target.value;
});

// Save loan
saveLoanBtn.addEventListener('click', async () => {
    if (!loanNameInput.value || !loanAmountInput.value) {
        alert('Please fill in all required fields');
        return;
    }

    const loanData = {
        name: loanNameInput.value,
        totalAmount: parseFloat(loanAmountInput.value),
        createdAt: new Date().toISOString()
    };

    try {
        if (loanIdInput.value) {
            // Update existing loan
            await update(ref(db, `users/${currentUserId}/loans/${loanIdInput.value}`), loanData);
        } else {
            // Add new loan
            await push(ref(db, `users/${currentUserId}/loans`), loanData);
        }
        
        addLoanModal.hide();
        resetModal();
    } catch (error) {
        console.error('Error saving loan:', error);
        alert('Failed to save loan');
    }
});

// Delete loan
deleteLoanBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this loan?')) {
        try {
            await remove(ref(db, `users/${currentUserId}/loans/${loanIdInput.value}`));
            addLoanModal.hide();
            resetModal();
        } catch (error) {
            console.error('Error deleting loan:', error);
            alert('Failed to delete loan');
        }
    }
});

// Reset modal when it's opened for adding new loan
document.getElementById('addLoanModal').addEventListener('show.bs.modal', (event) => {
    if (!event.relatedTarget) return; // Don't reset if opened programmatically
    resetModal();
}); 