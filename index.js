function fetchTransactions() {
    const userId = 'Shakhwatt';
    const transactionsRef = ref(getDatabase(), `users/${userId}/transactions`);
    onValue(transactionsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const tbody = document.querySelector('#listTable tbody');
            tbody.innerHTML = '';
            const transactionsArray = Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.date) - new Date(a.date));
            transactionsArray.forEach(transaction => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${formatDate(transaction.date)}</td>
                                 <td>${transaction.expenseType}</td>
                                 <td>${transaction.description}</td>
                                 <td>${transaction.amount}Tk</td>`;
                row.addEventListener('click', () => {
                    window.location.href = 'transactiondetails.html?id=' + transaction.id;
                });
                tbody.appendChild(row);
            });
        }
    }, { onlyOnce: true });
}
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    return `${day}${getOrdinal(day)} ${month}, ${year}`;
}
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function loadHtml(url, elementId, callback) {
    fetch(url)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (callback) {
                callback();
            }
        })
        .catch(error => {
            console.error('Error loading the HTML: ', error);
            document.getElementById(elementId).innerHTML = "<p>Error loading content. Please try again later.</p>";
        });
}

document.getElementById('loadView1').addEventListener('click', () => loadHtml('index.html', 'content'));
document.getElementById('loadView2').addEventListener('click', () => loadHtml('transactions/transactionList.html', 'content'));
document.getElementById('loadView3').addEventListener('click', () => loadHtml('test2.html', 'content'));

// Load Transaction List and initiate fetching transactions
document.getElementById('loadView3').addEventListener('click', () => {
    loadHtml('transactions/transactionList.html', 'content', () => {
        // Ensure fetchTransactions() is defined and callable
        if (typeof fetchTransactions === "function") {
            fetchTransactions();
        }
    });
});
