// index.js
const express = require("express");
const axios = require("axios");
const app = express();
const PORT = 3000;

// Sample in-memory database for simplicity. Replace this with your preferred database.
let database = [];

// Initialize the database with seed data from the third-party API
async function initializeDatabase() {
  try {
    const response = await axios.get(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );
    database = response.data;
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing the database:", error.message);
  }
}
// Create an API for statistics //

initializeDatabase();

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

function filterTransactionsByMonth(transactions, selectedMonth) {
  return transactions.filter((transaction) => {
    const transactionMonth = new Date(transaction.dateOfSale).getMonth() + 1;
    return transactionMonth === selectedMonth;
  });
}

// API for statistics
app.get("/statistics", (req, res) => {
  const selectedMonth = parseInt(req.query.month);

  if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
    return res.status(400).json({
      error:
        "Invalid month. Please provide a valid month number between 1 and 12.",
    });
  }

  const transactionsInSelectedMonth = filterTransactionsByMonth(
    database,
    selectedMonth
  );

  const totalSaleAmount = transactionsInSelectedMonth.reduce(
    (total, transaction) => {
      return total + transaction.saleAmount;
    },
    0
  );

  const totalSoldItems = transactionsInSelectedMonth.reduce(
    (total, transaction) => {
      return total + transaction.soldItems;
    },
    0
  );

  const totalNotSoldItems = transactionsInSelectedMonth.reduce(
    (total, transaction) => {
      return total + transaction.notSoldItems;
    },
    0
  );

  return res.json({
    totalSaleAmount,
    totalSoldItems,
    totalNotSoldItems,
  });
});

// Create an API for bar chart//

function getPriceRange(amount) {
  if (amount <= 100) return "0 - 100";
  if (amount <= 200) return "101 - 200";
  if (amount <= 300) return "201 - 300";
  if (amount <= 400) return "301 - 400";
  if (amount <= 500) return "401 - 500";
  if (amount <= 600) return "501 - 600";
  if (amount <= 700) return "601 - 700";
  if (amount <= 800) return "701 - 800";
  if (amount <= 900) return "801 - 900";
  return "901 - above";
}

// API for bar chart data
app.get("/bar-chart", (req, res) => {
  const selectedMonth = parseInt(req.query.month);

  if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
    return res.status(400).json({
      error:
        "Invalid month. Please provide a valid month number between 1 and 12.",
    });
  }

  const transactionsInSelectedMonth = filterTransactionsByMonth(
    database,
    selectedMonth
  );

  // Initialize an object to store the count of items in each price range
  const priceRanges = {
    "0 - 100": 0,
    "101 - 200": 0,
    "201 - 300": 0,
    "301 - 400": 0,
    "401 - 500": 0,
    "501 - 600": 0,
    "601 - 700": 0,
    "701 - 800": 0,
    "801 - 900": 0,
    "901 - above": 0,
  };

  // Calculate the count of items falling into each price range//
  transactionsInSelectedMonth.forEach((transaction) => {
    const priceRange = getPriceRange(transaction.saleAmount);
    priceRanges[priceRange] += transaction.soldItems;
  });

  return res.json(priceRanges);
});

// Create an API for pie chart //

// index.js (updated)
// ...

// Helper function to get unique categories and their corresponding item counts
function getUniqueCategories(transactions) {
  const categoryMap = new Map();

  transactions.forEach((transaction) => {
    const category = transaction.category;
    if (categoryMap.has(category)) {
      categoryMap.set(
        category,
        categoryMap.get(category) + transaction.soldItems
      );
    } else {
      categoryMap.set(category, transaction.soldItems);
    }
  });

  return categoryMap;
}

// API for pie chart data
app.get("/pie-chart", (req, res) => {
  const selectedMonth = parseInt(req.query.month);

  if (isNaN(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
    return res.status(400).json({
      error:
        "Invalid month. Please provide a valid month number between 1 and 12.",
    });
  }

  const transactionsInSelectedMonth = filterTransactionsByMonth(
    database,
    selectedMonth
  );

  const uniqueCategories = getUniqueCategories(transactionsInSelectedMonth);

  // Convert the Map to a plain object for the response
  const pieChartData = {};
  uniqueCategories.forEach((value, key) => {
    pieChartData[key] = value;
  });

  return res.json(pieChartData);
});
