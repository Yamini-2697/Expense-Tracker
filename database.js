const sqlite3 = require('sqlite3').verbose()

// Initialize the SQLite database
const db = new sqlite3.Database('./expenses.db', err => {
  if (err) {
    console.error('Could not connect to database', err)
  } else {
    console.log('Connected to SQLite database')
  }
})

// Create tables if they don't exist
db.serialize(() => {
  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT
    )
  `)

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense'))
    )
  `)
})

module.exports = db
