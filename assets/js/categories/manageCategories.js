import { auth, db } from "../fireBaseConfig.js";
import { ref, onValue, push, set, update, remove } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', function () {
    const categoryTableBody = document.getElementById('categoryTableBody');
    const addCategoryForm = document.getElementById('addCategoryForm');
    const categoryNameInput = document.getElementById('categoryName');
    const addCategoryModal = new bootstrap.Modal(document.getElementById('addCategoryModal'));

    // Use onAuthStateChanged to wait for auth to initialize
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = '../login.html';
            return;
        }

        const userId = user.uid;
        initializeCategories(userId);
    });

    function initializeCategories(userId) {
        addCategoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const categoryName = categoryNameInput.value;
            const isExpense = false;
            if (categoryName) {
                const newCategoryRef = push(ref(db, `users/${userId}/categories`));
                set(newCategoryRef, {
                    name: categoryName,
                    value: categoryName,
                    isExpense: isExpense,
                    creationDate: new Date().toLocaleDateString("en-GB")
                }).then(() => {
                    addCategoryModal.hide();
                    categoryNameInput.value = '';
                    alert("Category added successfully!");
                }).catch(error => {
                    alert("Failed to add category: " + error.message);
                });
            }
        });

        // Load and display categories
        onValue(ref(db, `users/${userId}/categories`), (snapshot) => {
            const data = snapshot.val();
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
                    attachEventListeners(row, key, userId);
                    categoryTableBody.appendChild(row);
                });
            }
        });
    }

    function attachEventListeners(row, key, userId) {
        const editBtn = row.querySelector('.edit-btn');
        const saveBtn = row.querySelector('.save-btn');
        const deleteBtn = row.querySelector('.delete-btn');
        const categoryName = row.querySelector('.category-name');
        const editField = row.querySelector('.edit-field');
        const isExpenseCheckbox = row.querySelector('.is-expense-checkbox');

        isExpenseCheckbox.addEventListener('change', () => {
            update(ref(db, `users/${userId}/categories/${key}`), { isExpense: isExpenseCheckbox.checked }).catch(error => {
                alert("Failed to update expense status: " + error.message);
                isExpenseCheckbox.checked = !isExpenseCheckbox.checked;
            });
        });

        editBtn.addEventListener('click', () => {
            categoryName.style.display = 'none';
            editField.style.display = 'block';
            editBtn.style.display = 'none';
            saveBtn.style.display = 'inline-block';
        });

        saveBtn.addEventListener('click', () => {
            const newName = editField.value;
            update(ref(db, `users/${userId}/categories/${key}`), {
                name: newName,
                value: newName
            }).then(() => {
                categoryName.textContent = newName;
                categoryName.style.display = 'block';
                editField.style.display = 'none';
                editBtn.style.display = 'inline-block';
                saveBtn.style.display = 'none';
            }).catch(error => {
                alert("Failed to update category: " + error.message);
            });
        });

        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this category?')) {
                remove(ref(db, `users/${userId}/categories/${key}`)).catch(error => {
                    alert("Failed to delete category: " + error.message);
                });
            }
        });
    }
});
