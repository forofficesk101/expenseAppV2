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
            const listContainer = document.querySelector('#listContainer');
            listContainer.innerHTML = ''; // Clear existing content

            // Convert object to array, sort by date in descending order
            const transactionsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sorting in descending order

            const monthData = {};

            transactionsArray.forEach(transaction => {
                const monthYear = getMonthYear(transaction.date);
                if (!monthData[monthYear]) monthData[monthYear] = { expenses: {}, cashins: {} };

                const type = transaction.expenseType;

                if (transaction.transactionType === 'Expense') {
                    if (!monthData[monthYear].expenses[type]) monthData[monthYear].expenses[type] = 0;
                    monthData[monthYear].expenses[type] += parseFloat(transaction.amount);
                } else if (transaction.transactionType === 'CashIn') {
                    if (!monthData[monthYear].cashins[type]) monthData[monthYear].cashins[type] = 0;
                    monthData[monthYear].cashins[type] += parseFloat(transaction.amount);
                }
            });

            // Convert monthData object to array and sort in descending order of monthYear
            const sortedMonthData = Object.keys(monthData).sort((a, b) => new Date(b.split(',')[1], new Date(a.split(',')[0]).getMonth()) - new Date(a.split(',')[1], new Date(b.split(',')[0]).getMonth()));

            // Save the sorted month data to local storage
            saveToLocalStorage(sortedMonthData, monthData);

            sortedMonthData.forEach(monthYear => {
                const data = monthData[monthYear];
                
                // Create Expense Table
                const expenseTable = document.createElement('table');
                expenseTable.className = 'table table-striped';
                expenseTable.innerHTML = `
                    <thead>
                        <tr>
                            <th colspan="2" style="text-align:center; font-weight:bold; background-color: #f8d7da;">${monthYear} - Expenses</th>
                        </tr>
                        <tr>
                            <th>Expense Type</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const expenseTbody = expenseTable.querySelector('tbody');
                let expenseTotal = 0;
                for (const [type, total] of Object.entries(data.expenses)) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${type}</td><td>${total.toFixed(2)}Tk</td>`;
                    expenseTbody.appendChild(row);
                    expenseTotal += total;
                }
                const expenseTotalRow = document.createElement('tr');
                expenseTotalRow.innerHTML = `<td style="text-align:right; font-weight:bold;">Total:</td><td>${expenseTotal.toFixed(2)}Tk</td>`;
                expenseTbody.appendChild(expenseTotalRow);

                // Create CashIn Table
                const cashinTable = document.createElement('table');
                cashinTable.className = 'table table-striped';
                cashinTable.innerHTML = `
                    <thead>
                        <tr>
                            <th colspan="2" style="text-align:center; font-weight:bold; background-color: #d4edda;">${monthYear} - CashIn</th>
                        </tr>
                        <tr>
                            <th>Expense Type</th>
                            <th>Total Amount</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;

                const cashinTbody = cashinTable.querySelector('tbody');
                let cashinTotal = 0;
                for (const [type, total] of Object.entries(data.cashins)) {
                    const row = document.createElement('tr');
                    row.innerHTML = `<td>${type}</td><td>${total.toFixed(2)}Tk</td>`;
                    cashinTbody.appendChild(row);
                    cashinTotal += total;
                }
                const cashinTotalRow = document.createElement('tr');
                cashinTotalRow.innerHTML = `<td style="text-align:right; font-weight:bold;">Total:</td><td>${cashinTotal.toFixed(2)}Tk</td>`;
                cashinTbody.appendChild(cashinTotalRow);

                // Append both tables to the container
                listContainer.appendChild(expenseTable);
                listContainer.appendChild(cashinTable);
            });
        }
    }, {
        onlyOnce: true
    });
}

// Function to save data to local storage
function saveToLocalStorage(sortedMonthData, monthData) {
    // localStorage.removeItem('transactionsTableData');
    const tableData = sortedMonthData.map(monthYear => {
        const expenses = monthData[monthYear].expenses;
        const cashins = monthData[monthYear].cashins;
        return {
            monthYear,
            expenses,
            cashins
        };
    });
    console.log( JSON.stringify(tableData))
    localStorage.setItem('transactionsTableData', JSON.stringify(tableData));
}

// Helper functions `formatDate` and `getMonthYear` (assuming they're already defined)

// Helper function to get "Month, Year" from a date string
function getMonthYear(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('default', { month: 'long' }) + ',' + date.getFullYear();
}

// Call the function to fetch transactions when the script loads
fetchTransactions();
