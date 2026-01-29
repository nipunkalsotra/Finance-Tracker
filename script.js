
const AppState = {
    transactions: [],        // Array of all transaction objects
    monthlyBudget: 0,       // User-set monthly budget
    savingsGoal: 0,         // User-set savings target
    currentFilter: {        // Active filter settings
        month: '',
        year: ''
    },
    editingTransactionId: null,  // ID of transaction being edited
    charts: {               // Chart instances for cleanup
        category: null,
        comparison: null,
        trend: null
    }
};
const Categories = {
    income: [
        'Salary',
        'Freelance',
        'Business',
        'Investment',
        'Gift',
        'Other Income'
    ],
    expense: [
        'Food & Dining',
        'Transportation',
        'Shopping',
        'Entertainment',
        'Bills & Utilities',
        'Healthcare',
        'Education',
        'Rent',
        'Other Expense'
    ]
};


const StorageKeys = {
    TRANSACTIONS: 'financeTracker_transactions',
    BUDGET: 'financeTracker_budget',
    SAVINGS: 'financeTracker_savings',
    THEME: 'financeTracker_theme'
};

// INITIALIZATION & EVENT LISTENERS

document.addEventListener('DOMContentLoaded', function() {
    console.log('Finance Tracker initialized');
    
    loadFromStorage();
    
    setupEventListeners();
    
    setTodayDate();
    populateYearFilter();
    updateCategoryDropdown();
    
    renderTransactions();
    updateSummaryCards();
    updateBudgetDisplay();
    updateCharts();
    
    applySavedTheme();
});

function setupEventListeners() {
    // Transaction Form
    document.getElementById('transactionForm').addEventListener('submit', handleAddTransaction);
    document.getElementById('transactionType').addEventListener('change', updateCategoryDropdown);
    
    // Budget & Savings
    document.getElementById('setBudgetBtn').addEventListener('click', handleSetBudget);
    document.getElementById('setSavingsBtn').addEventListener('click', handleSetSavings);
    
    // Filters
    document.getElementById('filterMonth').addEventListener('change', handleFilterChange);
    document.getElementById('filterYear').addEventListener('change', handleFilterChange);
    document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
    
    // Header Actions
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('resetBtn').addEventListener('click', showResetConfirmation);
    
    // Edit Modal
    document.getElementById('editForm').addEventListener('submit', handleEditTransaction);
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('editType').addEventListener('change', function() {
        updateCategoryDropdown('edit');
    });
    
    // Confirmation Modal
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmOk').addEventListener('click', handleConfirmAction);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        const editModal = document.getElementById('editModal');
        const confirmModal = document.getElementById('confirmModal');
        if (e.target === editModal) {
            closeEditModal();
        }
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    });
}

// ============================================
// TRANSACTION MANAGEMENT
// ============================================

function handleAddTransaction(e) {
    e.preventDefault();
    
    // Get form values
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const description = document.getElementById('transactionDescription').value.trim();
    const date = document.getElementById('transactionDate').value;
    
    // Validate inputs
    if (!type || !amount || !category || !description || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    // Create transaction object
    const transaction = {
        id: generateUniqueId(),
        type,
        amount,
        category,
        description,
        date,
        timestamp: new Date().getTime()
    };
    
    // Add to state and save
    AppState.transactions.push(transaction);
    saveToStorage();
    
    // Update UI
    renderTransactions();
    updateSummaryCards();
    updateBudgetDisplay();
    updateCharts();
    
    // Reset form
    e.target.reset();
    setTodayDate();
    updateCategoryDropdown();
    
    // Show success feedback
    showNotification('Transaction added successfully!', 'success');
}

function editTransaction(id) {
    const transaction = AppState.transactions.find(t => t.id === id);
    if (!transaction) return;
    
    // Store editing ID
    AppState.editingTransactionId = id;
    
    // Populate edit form
    document.getElementById('editTransactionId').value = id;
    document.getElementById('editType').value = transaction.type;
    document.getElementById('editAmount').value = transaction.amount;
    document.getElementById('editDescription').value = transaction.description;
    document.getElementById('editDate').value = transaction.date;
    
    // Update category dropdown for edit form
    updateCategoryDropdown('edit');
    document.getElementById('editCategory').value = transaction.category;
    
    // Show modal
    document.getElementById('editModal').classList.add('active');
}

function handleEditTransaction(e) {
    e.preventDefault();
    
    const id = AppState.editingTransactionId;
    const transaction = AppState.transactions.find(t => t.id === id);
    
    if (!transaction) {
        alert('Transaction not found');
        return;
    }
    
    // Update transaction
    transaction.type = document.getElementById('editType').value;
    transaction.amount = parseFloat(document.getElementById('editAmount').value);
    transaction.category = document.getElementById('editCategory').value;
    transaction.description = document.getElementById('editDescription').value.trim();
    transaction.date = document.getElementById('editDate').value;
    
    // Save and update UI
    saveToStorage();
    renderTransactions();
    updateSummaryCards();
    updateBudgetDisplay();
    updateCharts();
    
    // Close modal
    closeEditModal();
    
    showNotification('Transaction updated successfully!', 'success');
}

function deleteTransaction(id) {
    showConfirmDialog(
        'Delete Transaction',
        'Are you sure you want to delete this transaction? This action cannot be undone.',
        () => {
            // Remove transaction
            AppState.transactions = AppState.transactions.filter(t => t.id !== id);
            
            // Save and update UI
            saveToStorage();
            renderTransactions();
            updateSummaryCards();
            updateBudgetDisplay();
            updateCharts();
            
            showNotification('Transaction deleted successfully!', 'success');
        }
    );
}

// ============================================
// RENDERING & UI UPDATES
// ============================================

function renderTransactions() {
    const tbody = document.getElementById('transactionsBody');
    const filteredTransactions = getFilteredTransactions();
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    // Handle empty state
    if (filteredTransactions.length === 0) {
        tbody.innerHTML = `
            <tr class="no-data">
                <td colspan="6">No transactions found for the selected period.</td>
            </tr>
        `;
        return;
    }
    
    // Sort by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Render each transaction
    filteredTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(transaction.date)}</td>
            <td><span class="badge badge-${transaction.type}">${transaction.type}</span></td>
            <td>${transaction.category}</td>
            <td>${transaction.description}</td>
            <td class="text-${transaction.type}">₹${transaction.amount.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editTransaction('${transaction.id}')">Edit</button>
                    <button class="btn-delete" onclick="deleteTransaction('${transaction.id}')">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateSummaryCards() {
    const filteredTransactions = getFilteredTransactions();
    
    // Calculate totals
    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = income - expenses;
    
    // Update card values
    document.getElementById('totalIncome').textContent = `₹${income.toFixed(2)}`;
    document.getElementById('totalExpense').textContent = `₹${expenses.toFixed(2)}`;
    document.getElementById('netBalance').textContent = `₹${balance.toFixed(2)}`;
    
    // Update balance color
    const balanceElement = document.getElementById('netBalance');
    if (balance >= 0) {
        balanceElement.classList.remove('text-expense');
        balanceElement.classList.add('text-income');
    } else {
        balanceElement.classList.remove('text-income');
        balanceElement.classList.add('text-expense');
    }
    
    // Update savings progress
    updateSavingsProgress(balance);
}

function updateSavingsProgress(currentBalance) {
    const savingsGoal = AppState.savingsGoal;
    
    if (savingsGoal > 0) {
        const percentage = Math.min((currentBalance / savingsGoal) * 100, 100);
        document.getElementById('savingsProgress').textContent = `${percentage.toFixed(1)}%`;
        document.getElementById('savingsFill').style.width = `${percentage}%`;
    } else {
        document.getElementById('savingsProgress').textContent = 'No Goal Set';
        document.getElementById('savingsFill').style.width = '0%';
    }
}

function updateBudgetDisplay() {
    const budget = AppState.monthlyBudget;
    const budgetAlert = document.getElementById('budgetAlert');
    
    // Update budget amount display
    if (budget > 0) {
        document.getElementById('budgetAmount').textContent = `₹${budget.toFixed(2)}`;
    } else {
        document.getElementById('budgetAmount').textContent = 'Not Set';
    }
    
    // Calculate current month's expenses
    const currentMonthExpenses = getCurrentMonthExpenses();
    document.getElementById('budgetSpent').textContent = `₹${currentMonthExpenses.toFixed(2)}`;
    
    // Calculate remaining budget
    if (budget > 0) {
        const remaining = budget - currentMonthExpenses;
        document.getElementById('budgetRemaining').textContent = `₹${remaining.toFixed(2)}`;
        
        // Show alerts based on spending
        const percentageUsed = (currentMonthExpenses / budget) * 100;
        
        if (percentageUsed >= 100) {
            budgetAlert.textContent = '⚠️ Budget exceeded! You have overspent this month.';
            budgetAlert.className = 'budget-alert danger';
        } else if (percentageUsed >= 80) {
            budgetAlert.textContent = '⚠️ Warning: You have used 80% or more of your budget.';
            budgetAlert.className = 'budget-alert warning';
        } else {
            budgetAlert.textContent = '';
            budgetAlert.className = 'budget-alert';
        }
    } else {
        document.getElementById('budgetRemaining').textContent = '-';
        budgetAlert.textContent = '';
        budgetAlert.className = 'budget-alert';
    }
}

function updateCategoryDropdown(formType = 'add') {
    const typeSelect = formType === 'add' 
        ? document.getElementById('transactionType')
        : document.getElementById('editType');
    
    const categorySelect = formType === 'add'
        ? document.getElementById('transactionCategory')
        : document.getElementById('editCategory');
    
    const selectedType = typeSelect.value;
    
    // Clear existing options
    categorySelect.innerHTML = '<option value="">Select Category</option>';
    
    // Add appropriate categories
    if (selectedType) {
        const categories = Categories[selectedType] || [];
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

// ============================================
// BUDGET & SAVINGS MANAGEMENT
// ============================================

function handleSetBudget() {
    const budgetInput = document.getElementById('monthlyBudget');
    const budget = parseFloat(budgetInput.value);
    
    if (isNaN(budget) || budget < 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    
    AppState.monthlyBudget = budget;
    localStorage.setItem(StorageKeys.BUDGET, budget);
    
    updateBudgetDisplay();
    budgetInput.value = '';
    
    showNotification('Monthly budget set successfully!', 'success');
}

function handleSetSavings() {
    const savingsInput = document.getElementById('savingsGoal');
    const goal = parseFloat(savingsInput.value);
    
    if (isNaN(goal) || goal < 0) {
        alert('Please enter a valid savings goal');
        return;
    }
    
    AppState.savingsGoal = goal;
    localStorage.setItem(StorageKeys.SAVINGS, goal);
    
    // Update displays
    document.getElementById('goalAmount').textContent = `₹${goal.toFixed(2)}`;
    
    const currentBalance = parseFloat(document.getElementById('netBalance').textContent.replace('₹', ''));
    const saved = Math.max(0, currentBalance);
    document.getElementById('savedAmount').textContent = `₹${saved.toFixed(2)}`;
    
    const remaining = Math.max(0, goal - saved);
    document.getElementById('goalRemaining').textContent = `₹${remaining.toFixed(2)}`;
    
    updateSavingsProgress(currentBalance);
    
    savingsInput.value = '';
    showNotification('Savings goal set successfully!', 'success');
}

function handleFilterChange() {
    AppState.currentFilter.month = document.getElementById('filterMonth').value;
    AppState.currentFilter.year = document.getElementById('filterYear').value;
    
    renderTransactions();
    updateSummaryCards();
    updateCharts();
}

function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    
    AppState.currentFilter.month = '';
    AppState.currentFilter.year = '';
    
    renderTransactions();
    updateSummaryCards();
    updateCharts();
}

function getFilteredTransactions() {
    const { month, year } = AppState.currentFilter;
    
    return AppState.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        const transactionMonth = String(transactionDate.getMonth() + 1).padStart(2, '0');
        const transactionYear = String(transactionDate.getFullYear());
        
        // Check month filter
        if (month && transactionMonth !== month) {
            return false;
        }
        
        // Check year filter
        if (year && transactionYear !== year) {
            return false;
        }
        
        return true;
    });
}

function getCurrentMonthExpenses() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return AppState.transactions
        .filter(t => {
            const tDate = new Date(t.date);
            return t.type === 'expense' && 
                   tDate.getMonth() === currentMonth && 
                   tDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
}

// ============================================
// CHARTS & VISUALIZATIONS
// ============================================

function updateCharts() {
    updateCategoryChart();
    updateComparisonChart();
    updateTrendChart();
}

function updateCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const filteredTransactions = getFilteredTransactions();
    const expenses = filteredTransactions.filter(t => t.type === 'expense');
    
    // Calculate category totals
    const categoryTotals = {};
    expenses.forEach(transaction => {
        if (!categoryTotals[transaction.category]) {
            categoryTotals[transaction.category] = 0;
        }
        categoryTotals[transaction.category] += transaction.amount;
    });
    
    // Prepare chart data
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    
    // Destroy existing chart
    if (AppState.charts.category) {
        AppState.charts.category.destroy();
    }
    
    // Create new chart
    if (labels.length > 0) {
        AppState.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#ef4444', '#f59e0b', '#10b981', '#3b82f6',
                        '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ₹${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Show no data message
        ctx.font = '14px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
  }
function updateComparisonChart() {
    const ctx = document.getElementById('comparisonChart').getContext('2d');
    const filteredTransactions = getFilteredTransactions();
    
    // Calculate totals
    const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Destroy existing chart
    if (AppState.charts.comparison) {
        AppState.charts.comparison.destroy();
    }
    
    // Create new chart
    AppState.charts.comparison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses', 'Net Balance'],
            datasets: [{
                label: 'Amount (₹)',
                data: [income, expenses, income - expenses],
                backgroundColor: [
                    '#10b981',
                    '#ef4444',
                    income - expenses >= 0 ? '#3b82f6' : '#ef4444'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `₹${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateTrendChart() {
    const ctx = document.getElementById('trendChart').getContext('2d');
    const filteredTransactions = getFilteredTransactions();
    
    // Group expenses by date
    const expensesByDate = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
            const date = transaction.date;
            if (!expensesByDate[date]) {
                expensesByDate[date] = 0;
            }
            expensesByDate[date] += transaction.amount;
        });
    
    // Sort dates
    const sortedDates = Object.keys(expensesByDate).sort();
    const amounts = sortedDates.map(date => expensesByDate[date]);
    
    // Destroy existing chart
    if (AppState.charts.trend) {
        AppState.charts.trend.destroy();
    }
    
    // Create new chart
    if (sortedDates.length > 0) {
        AppState.charts.trend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates.map(date => formatDate(date)),
                datasets: [{
                    label: 'Daily Expenses',
                    data: amounts,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `₹${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    } else {
        // Show no data message
        ctx.font = '14px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.textAlign = 'center';
        ctx.fillText('No expense data available', ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
}

// ============================================
// DATA PERSISTENCE (localStorage)
// ============================================

function saveToStorage() {
    try {
        localStorage.setItem(StorageKeys.TRANSACTIONS, JSON.stringify(AppState.transactions));
    } catch (error) {
        console.error('Failed to save to storage:', error);
        alert('Failed to save data. Storage might be full.');
    }
}

function loadFromStorage() {
    try {
        // Load transactions
        const savedTransactions = localStorage.getItem(StorageKeys.TRANSACTIONS);
        if (savedTransactions) {
            AppState.transactions = JSON.parse(savedTransactions);
        }
        
        // Load budget
        const savedBudget = localStorage.getItem(StorageKeys.BUDGET);
        if (savedBudget) {
            AppState.monthlyBudget = parseFloat(savedBudget);
        }
        
        // Load savings goal
        const savedSavings = localStorage.getItem(StorageKeys.SAVINGS);
        if (savedSavings) {
            AppState.savingsGoal = parseFloat(savedSavings);
        }
    } catch (error) {
        console.error('Failed to load from storage:', error);
    }
}

// ============================================
// EXPORT FUNCTIONALITY
// ============================================

function exportToCSV() {
    const transactions = getFilteredTransactions();
    
    if (transactions.length === 0) {
        alert('No transactions to export');
        return;
    }
    
    // Create CSV header
    let csv = 'Date,Type,Category,Description,Amount\n';
    
    // Add transaction rows
    transactions.forEach(transaction => {
        csv += `${transaction.date},${transaction.type},${transaction.category},"${transaction.description}",${transaction.amount}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// ============================================
// DARK MODE
// ============================================

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem(StorageKeys.THEME, isDark ? 'dark' : 'light');
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem(StorageKeys.THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
}

// ============================================
// RESET APPLICATION
// ============================================

function showResetConfirmation() {
    showConfirmDialog(
        'Reset Application',
        'Are you sure you want to reset the entire application? This will delete ALL transactions, budgets, and settings. This action CANNOT be undone!',
        resetApplication
    );
}

function resetApplication() {
    // Clear all localStorage data
    localStorage.removeItem(StorageKeys.TRANSACTIONS);
    localStorage.removeItem(StorageKeys.BUDGET);
    localStorage.removeItem(StorageKeys.SAVINGS);
    
    // Reset application state
    AppState.transactions = [];
    AppState.monthlyBudget = 0;
    AppState.savingsGoal = 0;
    AppState.currentFilter = { month: '', year: '' };
    AppState.editingTransactionId = null;
    
    // Destroy all charts
    if (AppState.charts.category) AppState.charts.category.destroy();
    if (AppState.charts.comparison) AppState.charts.comparison.destroy();
    if (AppState.charts.trend) AppState.charts.trend.destroy();
    
    AppState.charts = {
        category: null,
        comparison: null,
        trend: null
    };
    
    // Reset all form inputs
    document.getElementById('transactionForm').reset();
    document.getElementById('monthlyBudget').value = '';
    document.getElementById('savingsGoal').value = '';
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterYear').value = '';
    
    // Re-initialize UI
    setTodayDate();
    renderTransactions();
    updateSummaryCards();
    updateBudgetDisplay();
    updateCharts();
    
    showNotification('Application reset successfully!', 'success');
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    AppState.editingTransactionId = null;
}

function showConfirmDialog(title, message, onConfirm) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    document.getElementById('confirmModal').classList.add('active');
    
    // Store callback for confirm button
    window.pendingConfirmAction = onConfirm;
}

function handleConfirmAction() {
    if (window.pendingConfirmAction) {
        window.pendingConfirmAction();
        window.pendingConfirmAction = null;
    }
    closeConfirmModal();
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('active');
    window.pendingConfirmAction = null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function generateUniqueId() {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('transactionDate').value = today;
}

function populateYearFilter() {
    const yearSelect = document.getElementById('filterYear');
    const currentYear = new Date().getFullYear();
    
    // Add current year and previous 5 years
    for (let i = 0; i < 6; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}
function showNotification(message, type = 'success') {
    // Simple console log for now - can be enhanced with toast notifications
    console.log(`[${type.toUpperCase()}] ${message}`);
}

