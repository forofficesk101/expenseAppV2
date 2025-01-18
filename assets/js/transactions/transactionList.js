import { db } from "../fireBaseConfig.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.9.1/firebase-database.js";

// Function to format date as "17th June, 2024"
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();

    return `${getOrdinal(day)} ${month}, ${year}`;
}

// Helper function to get the ordinal suffix for a day
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}


function fetchTransactions() {
    const userId = 'shakhawatt'; // Your user ID
    const transactionsRef = ref(db, `users/${userId}/transactions`);

    onValue(transactionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const tbody = document.querySelector('#listTable tbody');
            tbody.innerHTML = ''; // Clear existing rows

            // Convert object to array, sort by date in descending order
            const transactionsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.date) - new Date(a.date));  // Sorting in descending order

            let lastMonthYear = '';
            let monthlyTotal = 0;

            transactionsArray.forEach((transaction, index, array) => {
                if(transaction.transactionType ==='Expense'){
                    const formattedDate = formatDate(transaction.date);
                    const monthYear = getMonthYear(transaction.date);
                    // console.log(transaction)
                    // Check if it's a new month and year, or last transaction
                    if (monthYear !== lastMonthYear || index === array.length - 1) {
                        if (lastMonthYear) { // Not the first transaction, put the total row for the previous month
                            const monthRowTotal = document.createElement('tr');
                            monthRowTotal.innerHTML = `<td colspan="3" style="text-align:right; font-weight:bold;">Total for ${lastMonthYear}:</td><td>${monthlyTotal}Tk</td>`;
                            tbody.appendChild(monthRowTotal);
                        }
    
                        // Reset monthly total for new month and set new lastMonthYear
                        monthlyTotal = 0;
                        lastMonthYear = monthYear;
    
                        // Add month heading for new month
                        const monthRow = document.createElement('tr');
                        monthRow.innerHTML = `<td colspan="4" style="text-align:center; font-weight:bold; background-color: #f8f9fa;">${monthYear}</td>`;
                        tbody.appendChild(monthRow);
                    }
                    // Aggregate monthly total
                    monthlyTotal += parseFloat(transaction.amount || 0);
    
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formattedDate}</td>
                        <td>${transaction.expenseType || ''}</td>
                        <td>${transaction.description || ''}</td>
                        <td>${transaction.amount || ''}Tk</td>
                    `;
                    row.addEventListener('click', () => {
                        window.location.href = 'transactionDetails.html?id=' + transaction.id;
                    });
                    tbody.appendChild(row);
                }

               
            });
            

            // Add total row for last month in the list if not added
            if (monthlyTotal > 0) {
                const monthRowTotal = document.createElement('tr');
                monthRowTotal.innerHTML = `<td colspan="3" style="text-align:right; font-weight:bold;">Total for ${lastMonthYear}:</td><td>${monthlyTotal}Tk</td>`;
                tbody.appendChild(monthRowTotal);
            }
        }
    }, {
        onlyOnce: true
    });
}

// Helper functions `formatDate` and `getMonthYear` (assuming they're already defined)


// Helper function to get "Month, Year" from a date string
function getMonthYear(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long' }) + ',' + date.getFullYear();
}



// Call the function to fetch transactions when the script loads
fetchTransactions();

