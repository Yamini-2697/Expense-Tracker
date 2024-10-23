const express = require('express')
const bodyParser = require('body-parser')
const db = require('./database')

const app = express()
app.use(bodyParser.json())

const PORT = 3000

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the Personal Expense Tracker API')
})
// Add a new transaction POST /transactions
app.post('/transactions', (req, res) => {
  const { type, category, amount, date, description } = req.body;

  if (!type || !category || !amount || !date) {
    return res.status(400).json({ error: 'Type, category, amount, and date are required' });
  }

  const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [type, category, amount, date, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Get all transactions GET /transactions
app.get('/transactions', (req, res) => {
  const query = `SELECT * FROM transactions`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});
// Get a single transaction by ID GET /transactions/:id
app.get('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const query = `SELECT * FROM transactions WHERE id = ?`;
  db.get(query, [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Update a transaction by ID PUT /transactions/:id
app.put('/transactions/:id', (req, res) => {
  const { id } = req.params;
  const { type, category, amount, date, description } = req.body;

  const query = `
    UPDATE transactions
    SET type = ?, category = ?, amount = ?, date = ?, description = ?
    WHERE id = ?
  `;

  db.run(query, [type, category, amount, date, description, id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated successfully' });
  });
});


// Delete a transaction by ID
app.delete('/transactions/:id', (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM transactions WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

// Get a summary of transactions
app.get('/summary', (req, res) => {
  const { startDate, endDate, category } = req.query;
  let query = `
    SELECT type, SUM(amount) as total
    FROM transactions
  `;
  const params = [];

  if (startDate || endDate || category) {
    query += ' WHERE';
    if (startDate) {
      query += ' date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += (params.length ? ' AND' : '') + ' date <= ?';
      params.push(endDate);
    }
    if (category) {
      query += (params.length ? ' AND' : '') + ' category = ?';
      params.push(category);
    }
  }

  query += ' GROUP BY type';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const summary = rows.reduce((acc, row) => {
      acc[row.type] = row.total;
      return acc;
    }, {});

    summary.balance = (summary.income || 0) - (summary.expense || 0);

    res.json(summary);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
