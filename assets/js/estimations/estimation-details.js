import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, update, remove, set } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

const estimationNameTitle = document.getElementById('estimationNameTitle');
const totalAmountSpan = document.getElementById('totalAmount');
const entriesTableBody = document.getElementById('entriesTableBody');
const addEntryBtn = document.getElementById('addEntryBtn');

let currentUserId = null;
let currentEstimationId = new URLSearchParams(window.location.search).get('id');
let entryCounter = 1;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        if (!currentEstimationId) {
            alert('No estimation ID provided');
            window.location.href = 'estimations.html';
            return;
        }
        loadEstimationDetails();
    } else {
        window.location.href = '../login.html';
    }
});

// Load estimation details
function loadEstimationDetails() {
    const estimationRef = ref(db, `users/${currentUserId}/estimations/${currentEstimationId}`);
    onValue(estimationRef, (snapshot) => {
        const estimation = snapshot.val();
        if (!estimation) {
            alert('Estimation not found');
            window.location.href = 'estimations.html';
            return;
        }

        // Update header and summary
        estimationNameTitle.textContent = estimation.name;
        
        // Load entries
        loadEntries(estimation.entries || {});
    });
}

// Load and display entries
function loadEntries(entries) {
    entriesTableBody.innerHTML = '';
    let totalAmount = 0;

    Object.entries(entries).forEach(([entryId, entry]) => {
        totalAmount += parseFloat(entry.amount || 0);
        addEntryRow(entryId, entry);
    });

    // Update total amount
    totalAmountSpan.textContent = totalAmount;
    
    // Update entry counter
    entryCounter = Object.keys(entries).length + 1;
}

// Add entry row to table
function addEntryRow(entryId, entry) {
    const row = document.createElement('tr');
    row.dataset.id = entryId;
    row.innerHTML = `
        <td>
            <span class="display-value">${entry.name}</span>
            <input type="text" class="form-control edit-field" value="${entry.name}">
        </td>
        <td>
            <span class="display-value">${entry.amount || 0}</span>
            <input type="number" class="form-control edit-field" value="${entry.amount || 0}">
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
    entriesTableBody.appendChild(row);
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
        
        const entryData = {
            name: nameInput.value,
            amount: parseFloat(amountInput.value) || 0,
            updatedAt: new Date().toISOString()
        };

        try {
            await update(ref(db, `users/${currentUserId}/estimations/${currentEstimationId}/entries/${row.dataset.id}`), 
                entryData);
            
            row.classList.remove('edit-mode');
            editBtn.style.display = 'inline-block';
            saveBtn.style.display = 'none';
        } catch (error) {
            console.error('Error saving entry:', error);
            alert('Failed to save entry');
        }
    });

    deleteBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete this entry?')) {
            try {
                await remove(ref(db, `users/${currentUserId}/estimations/${currentEstimationId}/entries/${row.dataset.id}`));
            } catch (error) {
                console.error('Error deleting entry:', error);
                alert('Failed to delete entry');
            }
        }
    });
}

// Add new entry
addEntryBtn.addEventListener('click', async () => {
    const newEntry = {
        name: `Entry ${entryCounter}`,
        amount: 0,
        createdAt: new Date().toISOString()
    };

    try {
        const newEntryRef = push(ref(db, `users/${currentUserId}/estimations/${currentEstimationId}/entries`));
        await set(newEntryRef, newEntry);
    } catch (error) {
        console.error('Error adding entry:', error);
        alert('Failed to add entry');
    }
}); 