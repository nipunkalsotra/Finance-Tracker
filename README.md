💰 Finance Tracker – Budgeting & Personal Economics Dashboard

A feature-rich personal finance tracking web application built using HTML, CSS, and Vanilla JavaScript.
This project helps users track income and expenses, manage budgets and savings goals, analyze spending behavior, and visualize financial data in an intuitive dashboard.

🎓 End-Term College Project
Focuses on real-world financial logic, DOM manipulation, state management, and data visualization.

🚀 Key Features
🧾 Transaction Management

Add income & expense transactions

Category-based classification

Description & date support

Edit and delete transactions

Transaction history table with actions

📊 Financial Summary

Total Income

Total Expenses

Net Balance (auto color-coded)

Real-time updates based on filters

💸 Budget Management

Set monthly budget

Track current month expenses

Remaining budget calculation

Alerts when:

80% budget is used

Budget is exceeded

🎯 Savings Goal Tracker

Set savings target

Visual progress bar

Percentage completion

Remaining amount calculation

🔍 Filters & Analysis

Filter transactions by month and year

Dynamic recalculation of:

Summary cards

Charts

Budget usage

📈 Data Visualization (Chart.js)

Pie Chart → Expense distribution by category

Bar Chart → Income vs Expenses vs Net Balance

Line Chart → Daily expense trend

Charts auto-update on:

Add / edit / delete

Filter change

Reset

🌗 User Experience Enhancements

Dark mode toggle (persisted)

CSV export of filtered transactions

Responsive dashboard layout

Confirmation modals for destructive actions

🔄 Reset Application (Important Feature)

Clears:

All transactions

Budget & savings goals

Filters

Charts

LocalStorage data

Requires user confirmation

Re-initializes application state safely

🧠 Technical Architecture
🔹 State Management

Centralized application state using a global AppState object:

const AppState = {
  transactions: [],
  monthlyBudget: 0,
  savingsGoal: 0,
  currentFilter: { month: '', year: '' },
  editingTransactionId: null,
  charts: { category: null, comparison: null, trend: null }
};

🔹 Data Persistence

Uses localStorage

Separate storage keys for:

Transactions

Budget

Savings goal

Theme preference

🔹 JavaScript Concepts Used

DOM manipulation

Event handling

Array methods (map, filter, reduce)

Date handling

Modular functions

State-driven UI rendering

📂 Project Structure
finance-tracker/
│
├── index.html       # Application layout
├── style.css        # Styling & themes
├── script.js        # Core application logic
└── README.md        # Project documentation

🛠️ Technologies Used

HTML5

CSS3

JavaScript (ES6+)

Chart.js

localStorage API

🎓 Academic Relevance

This project demonstrates:

Income vs expense modeling

Budgeting logic

Financial data aggregation

Visual analytics

Real-world problem solving

Clean JavaScript architecture

Suitable for end-term evaluation, viva voce, and project grading

👤 Author

Nipun Kalsotra
End-Term Project – 2026
