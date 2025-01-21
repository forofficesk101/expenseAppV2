import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const estimationsTableBody = document.getElementById('estimationsTableBody');
const addEstimationModal = new bootstrap.Modal(document.getElementById('addEstimationModal'));
const estimationForm = document.getElementById('estimationForm');
const modalTitle = document.getElementById('modalTitle');
const estimationIdInput = document.getElementById('estimationId');
const estimationNameInput = document.getElementById('estimationName');
const saveEstimationBtn = document.getElementById('saveEstimationBtn');
const deleteEstimationBtn = document.getElementById('deleteEstimationBtn');

let currentUserId = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        loadEstimations();
    } else {
        window.location.href = '../login.html';
    }
});

// Load estimation entries
function loadEstimations() {
    const estimationsRef = ref(db, `users/${currentUserId}/estimations`);
    onValue(estimationsRef, (snapshot) => {
        const estimations = snapshot.val();
        estimationsTableBody.innerHTML = '';

        if (estimations) {
            Object.entries(estimations).forEach(([estimationId, estimation]) => {
                const totalAmount = calculateTotalAmount(estimation.entries || {});

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${estimation.name}</td>
                    <td>${totalAmount}</td>
                    <td>
                        <i class="bi bi-pencil-square edit-icon" data-estimation-id="${estimationId}"></i>
                    </td>
                `;

                // Add click handler for row (excluding edit icon)
                row.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('edit-icon')) {
                        window.location.href = `estimation-details.html?id=${estimationId}`;
                    }
                });

                // Add click handler for edit icon
                row.querySelector('.edit-icon').addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditModal(estimationId, estimation);
                });

                estimationsTableBody.appendChild(row);
            });
        }
    });
}

// Calculate total amount from entries
function calculateTotalAmount(entries) {
    return Object.values(entries || {}).reduce((total, entry) => 
        total + parseFloat(entry.amount || 0), 0);
}

// Reset modal form
function resetModal() {
    modalTitle.textContent = 'Add New Estimation';
    estimationForm.reset();
    estimationIdInput.value = '';
    deleteEstimationBtn.style.display = 'none';
}

// Open edit modal
function openEditModal(estimationId, estimation) {
    modalTitle.textContent = 'Edit Estimation';
    estimationIdInput.value = estimationId;
    estimationNameInput.value = estimation.name;
    deleteEstimationBtn.style.display = 'block';
    addEstimationModal.show();
}

// Save estimation
saveEstimationBtn.addEventListener('click', async () => {
    if (!estimationNameInput.value) {
        alert('Please fill in the estimation name');
        return;
    }

    const estimationData = {
        name: estimationNameInput.value,
        createdAt: new Date().toISOString()
    };

    try {
        if (estimationIdInput.value) {
            // Update existing estimation
            await update(ref(db, `users/${currentUserId}/estimations/${estimationIdInput.value}`), estimationData);
        } else {
            // Add new estimation
            await push(ref(db, `users/${currentUserId}/estimations`), estimationData);
        }
        
        addEstimationModal.hide();
        resetModal();
    } catch (error) {
        console.error('Error saving estimation:', error);
        alert('Failed to save estimation');
    }
});

// Delete estimation
deleteEstimationBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this estimation?')) {
        try {
            await remove(ref(db, `users/${currentUserId}/estimations/${estimationIdInput.value}`));
            addEstimationModal.hide();
            resetModal();
        } catch (error) {
            console.error('Error deleting estimation:', error);
            alert('Failed to delete estimation');
        }
    }
});

// Reset modal when it's opened for adding new estimation
document.getElementById('addEstimationModal').addEventListener('show.bs.modal', (event) => {
    if (!event.relatedTarget) return; // Don't reset if opened programmatically
    resetModal();
}); 