import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const sadaqahTableBody = document.getElementById('sadaqahTableBody');
const addSadaqahModal = new bootstrap.Modal(document.getElementById('addSadaqahModal'));
const sadaqahForm = document.getElementById('sadaqahForm');
const modalTitle = document.getElementById('modalTitle');
const sadaqahIdInput = document.getElementById('sadaqahId');
const sadaqahNameInput = document.getElementById('sadaqahName');
const sadaqahAmountInput = document.getElementById('sadaqahAmount');
const remainingAmountInput = document.getElementById('remainingAmount');
const saveSadaqahBtn = document.getElementById('saveSadaqahBtn');
const deleteSadaqahBtn = document.getElementById('deleteSadaqahBtn');

let currentUserId = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadSadaqah();
    } else {
        window.location.href = '../login.html';
    }
});

// Load sadaqah entries
function loadSadaqah() {
    const sadaqahRef = ref(db, `users/${currentUserId}/sadaqah`);
    onValue(sadaqahRef, (snapshot) => {
        const sadaqah = snapshot.val();
        sadaqahTableBody.innerHTML = '';

        if (sadaqah) {
            Object.entries(sadaqah).forEach(([sadaqahId, sadaqahEntry]) => {
                const paidAmount = calculatePaidAmount(sadaqahEntry.installments || {});
                const totalAmount = parseFloat(sadaqahEntry.totalAmount);
                const remainingAmount = totalAmount - paidAmount;
                const status = remainingAmount <= 0 ? 'Paid' : 'Unpaid';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${sadaqahEntry.name}</td>
                    <td>${paidAmount}/${totalAmount}</td>
                    <td>${status}</td>
                    <td>
                        <i class="bi bi-pencil-square edit-icon" data-sadaqah-id="${sadaqahId}"></i>
                    </td>
                `;

                // Add click handler for row (excluding edit icon)
                row.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-icon')) {
                        window.location.href = `sadaqah-details.html?id=${sadaqahId}`;
                    }
                });

                // Add click handler for edit icon
                row.querySelector('.edit-icon').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(sadaqahId, sadaqahEntry);
                });

                sadaqahTableBody.appendChild(row);
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
    modalTitle.textContent = 'Add New Sadaqah';
    sadaqahForm.reset();
    sadaqahIdInput.value = '';
    deleteSadaqahBtn.style.display = 'none';
    remainingAmountInput.value = '';
}

// Open edit modal
function openEditModal(sadaqahId, sadaqahEntry) {
    modalTitle.textContent = 'Edit Sadaqah';
    sadaqahIdInput.value = sadaqahId;
    sadaqahNameInput.value = sadaqahEntry.name;
    sadaqahAmountInput.value = sadaqahEntry.totalAmount;
    
    const paidAmount = calculatePaidAmount(sadaqahEntry.installments);
    remainingAmountInput.value = sadaqahEntry.totalAmount - paidAmount;
    
    deleteSadaqahBtn.style.display = 'block';
    addSadaqahModal.show();
}

// Handle sadaqah amount input
sadaqahAmountInput.addEventListener('input', (e) => {
    remainingAmountInput.value = e.target.value;
});

// Save sadaqah
saveSadaqahBtn.addEventListener('click', async () => {
    if (!sadaqahNameInput.value || !sadaqahAmountInput.value) {
        alert('Please fill in all required fields');
        return;
    }

    const sadaqahData = {
        name: sadaqahNameInput.value,
        totalAmount: parseFloat(sadaqahAmountInput.value),
        createdAt: new Date().toISOString()
    };

    try {
        if (sadaqahIdInput.value) {
            // Update existing sadaqah
            await update(ref(db, `users/${currentUserId}/sadaqah/${sadaqahIdInput.value}`), sadaqahData);
        } else {
            // Add new sadaqah
            await push(ref(db, `users/${currentUserId}/sadaqah`), sadaqahData);
        }
        
        addSadaqahModal.hide();
        resetModal();
    } catch (error) {
        console.error('Error saving sadaqah:', error);
        alert('Failed to save sadaqah');
    }
});

// Delete sadaqah
deleteSadaqahBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this sadaqah?')) {
        try {
            await remove(ref(db, `users/${currentUserId}/sadaqah/${sadaqahIdInput.value}`));
            addSadaqahModal.hide();
            resetModal();
        } catch (error) {
            console.error('Error deleting sadaqah:', error);
            alert('Failed to delete sadaqah');
        }
    }
});

// Reset modal when it's opened for adding new sadaqah
document.getElementById('addSadaqahModal').addEventListener('show.bs.modal', (event) => {
    if (!event.relatedTarget) return; // Don't reset if opened programmatically
    resetModal();
}); 