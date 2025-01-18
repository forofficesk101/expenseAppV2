import { db } from "../fireBaseConfig.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

document.addEventListener('DOMContentLoaded', function () {
    const categoryTableBody = document.getElementById('categoryTableBody');
    const addCategoryForm = document.getElementById('addCategoryForm');
    const categoryNameInput = document.getElementById('categoryName'); // Input for category name
    const addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal')); // Bootstrap modal instance
    const userId = 'shakhawatt';  // Define the user ID here or retrieve from user authentication session

    addCategoryForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const categoryName = categoryNameInput.value;
        const isExpense = false; // Get the state of the checkbox
        if (categoryName) {
            const newCategoryRef = push(ref(db, `users/${userId}/categories`));
            set(newCategoryRef, {
                name: categoryName,
                value: categoryName,
                isExpense: isExpense, // Set the isExpense value based on checkbox
                creationDate: new Date().toLocaleDateString("en-GB")
            }).then(() => {
                addCategoryModal.hide(); // Properly hide the modal using Bootstrap's method
                categoryNameInput.value = ''; // Clear the input field after adding
                alert("Category added successfully!");
            }).catch(error => {
                alert("Failed to add category: " + error.message);
            });
        }
    });

    // Load and display categories
    onValue(ref(db, `users/${userId}/categories`), (snapshot) => {
        const data = snapshot.val();
        // console.log(data);
        localStorage.setItem('categoriesOnDb', JSON.stringify(data));
        categoryTableBody.innerHTML = '';
        if (data) {
            Object.keys(data).forEach(key => {
                const category = data[key];
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <span class="category-name">${category.name}</span>
                        <input type="text" class="form-control edit-field" value="${category.name}">
                    </td>
                    <td>
                        <input type="checkbox" class="form-check-input is-expense-checkbox" ${category.isExpense ? 'checked' : ''}>
                    </td>
                    <td>
                        <button class="btn edit-btn"><i class="bi bi-pencil"></i></button>
                        <button class="btn save-btn" style="display:none;"><i class="bi bi-check-lg"></i></button>
                    </td>
                    <td>
                        <button class="btn delete-btn"><i class="bi bi-trash"></i></button>
                    </td>
                `;
                attachEventListeners(row, key);
                categoryTableBody.appendChild(row);
            });
        }
    }, {
        onlyOnce: false  // Set to false for real-time updates
    });

    function attachEventListeners(row, key) {
        const editBtn = row.querySelector('.edit-btn');
        const saveBtn = row.querySelector('.save-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        const categoryName = row.querySelector('.category-name');
        const editField = row.querySelector('.edit-field');
        const isExpenseCheckbox = row.querySelector('.is-expense-checkbox');

        isExpenseCheckbox.addEventListener('change', () => {
            update(ref(db, `users/${userId}/categories/${key}`), { isExpense: isExpenseCheckbox.checked }).catch(error => {
                alert("Failed to update expense status: " + error.message);
                isExpenseCheckbox.checked = !isExpenseCheckbox.checked; // Revert the checkbox if the update fails
            });
        });

        editBtn.addEventListener('click', () => {
            categoryName.style.display = 'none';
            editField.style.display = 'block';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'block';
        });

        saveBtn.addEventListener('click', () => {
            const updatedName = editField.value;
            update(ref(db, `users/${userId}/categories/${key}`), { name: updatedName, value: updatedName }).then(() => {
                categoryName.textContent = updatedName;
                categoryName.style.display = 'block';
                editField.style.display = 'none';
                editBtn.style.display = 'block';
                saveBtn.style.display = 'none';
            }).catch(error => {
                alert("Failed to update category: " + error.message);
            });
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this category?")) {
                remove(ref(db, `users/${userId}/categories/${key}`)).then(() => {
                    row.remove();
                }).catch(error => {
                    alert("Failed to delete category: " + error.message);
                });
            }
        });
    }
});
