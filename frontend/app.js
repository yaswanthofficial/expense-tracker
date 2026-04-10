const API = "https://expense-tracker.onrender.com/api/expenses";
let allExpenses = [];
let allCategories = new Set();

// Load form data from localStorage on page load
function loadFormData() {
    const savedData = localStorage.getItem('expenseFormData');
    if (savedData) {
        const data = JSON.parse(savedData);
        document.getElementById('amount').value = data.amount || '';
        document.getElementById('category').value = data.category || '';
        document.getElementById('description').value = data.description || '';
        document.getElementById('date').value = data.date || '';
    }
}

// Save form data to localStorage
function saveFormData() {
    const data = {
        amount: document.getElementById('amount').value,
        category: document.getElementById('category').value,
        description: document.getElementById('description').value,
        date: document.getElementById('date').value
    };
    localStorage.setItem('expenseFormData', JSON.stringify(data));
}

// Clear form data from localStorage
function clearFormData() {
    localStorage.removeItem('expenseFormData');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.textContent = message;
    setTimeout(() => {
        errorDiv.textContent = '';
    }, 5000);
}

// Show loading state
function setLoading(isLoading) {
    const loadingDiv = document.getElementById('loading');
    const addBtn = document.getElementById('addBtn');
    if (isLoading) {
        loadingDiv.textContent = 'Loading...';
        addBtn.disabled = true;
    } else {
        loadingDiv.textContent = '';
        addBtn.disabled = false;
    }
}

// Validate form input
function validateForm() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value.trim();
    const date = document.getElementById('date').value;

    if (isNaN(amount) || amount <= 0) {
        showError('Please enter a valid positive amount');
        return false;
    }
    if (!category) {
        showError('Please enter a category');
        return false;
    }
    if (!date) {
        showError('Please select a date');
        return false;
    }
    return true;
}

async function addExpense() {
    console.log('addExpense called');

    if (!validateForm()) {
        console.log('Validation failed');
        return;
    }

    console.log('Validation passed');
    setLoading(true);

    const data = {
        amount: parseFloat(document.getElementById('amount').value),
        category: document.getElementById('category').value.trim(),
        description: document.getElementById('description').value.trim(),
        date: document.getElementById('date').value
    };

    console.log('Data to send:', data);

    // Generate idempotency key from form data to handle retries
    const idempotencyKey = `${data.amount}-${data.category}-${data.date}-${data.description}`;

    try {
        console.log('Sending request to:', API);
        const response = await fetch(API, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Idempotency-Key": idempotencyKey
            },
            body: JSON.stringify(data)
        });

        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Success:', result);

        // Clear form and localStorage on success
        document.getElementById('amount').value = '';
        document.getElementById('category').value = '';
        document.getElementById('description').value = '';
        document.getElementById('date').value = '';
        clearFormData();

        await load();
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to add expense: ' + error.message);
    } finally {
        setLoading(false);
    }
}

async function load() {
    setLoading(true);

    const categoryFilter = document.getElementById('categoryFilter').value;
    const sortOrder = document.getElementById('sortOrder').value;

    let url = API;
    const params = new URLSearchParams();
    if (categoryFilter) {
        params.append('category', categoryFilter);
    }
    if (sortOrder) {
        params.append('sort', sortOrder);
    }
    if (params.toString()) {
        url += '?' + params.toString();
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        allExpenses = data;

        // Extract all unique categories
        allCategories = new Set(data.map(e => e.category));
        updateCategoryFilter();

        renderExpenses(data);
        renderSummary(data);
    } catch (error) {
        showError('Failed to load expenses: ' + error.message);
    } finally {
        setLoading(false);
    }
}

function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    const currentValue = select.value;

    // Keep the first option (All Categories)
    select.innerHTML = '<option value="">All Categories</option>';

    // Add categories in alphabetical order
    const sortedCategories = Array.from(allCategories).sort();
    sortedCategories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
    });

    // Restore selected value if it still exists
    if (sortedCategories.includes(currentValue)) {
        select.value = currentValue;
    }
}

function renderExpenses(expenses) {
    const list = document.getElementById('list');
    list.innerHTML = "";

    if (expenses.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center;">No expenses found</td>';
        list.appendChild(row);
        document.getElementById('total').textContent = 'Total: ₹0.00';
        return;
    }

    let total = 0;

    expenses.forEach(e => {
        total += e.amount;
        const row = document.createElement('tr');

        const date = new Date(e.date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });

        row.innerHTML = `
            <td>${date}</td>
            <td>${escapeHtml(e.category)}</td>
            <td>${escapeHtml(e.description || '-')}</td>
            <td>₹${e.amount.toFixed(2)}</td>
        `;
        list.appendChild(row);
    });

    document.getElementById('total').textContent = `Total: ₹${total.toFixed(2)}`;
}

function renderSummary(expenses) {
    const summaryDiv = document.getElementById('categorySummary');

    if (expenses.length === 0) {
        summaryDiv.innerHTML = '<p>No data to summarize</p>';
        return;
    }

    const categoryTotals = {};
    expenses.forEach(e => {
        if (!categoryTotals[e.category]) {
            categoryTotals[e.category] = 0;
        }
        categoryTotals[e.category] += e.amount;
    });

    let html = '<ul>';
    for (const [category, total] of Object.entries(categoryTotals).sort()) {
        html += `<li><strong>${escapeHtml(category)}:</strong> ₹${total.toFixed(2)}</li>`;
    }
    html += '</ul>';

    summaryDiv.innerHTML = html;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Save form data on input change
document.getElementById('amount').addEventListener('input', saveFormData);
document.getElementById('category').addEventListener('input', saveFormData);
document.getElementById('description').addEventListener('input', saveFormData);
document.getElementById('date').addEventListener('input', saveFormData);

// Initialize
loadFormData();
load();
