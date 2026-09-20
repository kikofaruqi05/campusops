const db = require('../config/db');

/* GET /api/budget
 * Returns all budget entries with event name and logger name */

const getAllEntries = async (req, res) => {
  try {
    const [entries] = await db.query(`
      SELECT 
        b.id,
        b.type,
        b.amount,
        b.category,
        b.description,
        b.logged_at,
        b.event_id,
        e.name AS event_name,
        u.full_name AS logged_by_name
      FROM budget_entries b
      LEFT JOIN events e ON b.event_id = e.id
      LEFT JOIN users u ON b.logged_by = u.id
      ORDER BY b.logged_at DESC
    `);
    res.status(200).json(entries);
  } catch (err) {
    console.error('Get budget entries error:', err);
    res.status(500).json({ message: 'Failed to retrieve budget entries.' });
  }
};

/* GET /api/budget/summary
 * Returns total income, total expenses, and net balance */

const getSummary = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses
      FROM budget_entries
    `);

    const totalIncome = parseFloat(rows[0].total_income) || 0;
    const totalExpenses = parseFloat(rows[0].total_expenses) || 0;
    const netBalance = totalIncome - totalExpenses;

    res.status(200).json({ total_income: totalIncome, total_expenses: totalExpenses, net_balance: netBalance });
  } catch (err) {
    console.error('Get summary error:', err);
    res.status(500).json({ message: 'Failed to retrieve summary.' });
  }
};

/* POST /api/budget
 * Creates a new budget entry */

const createEntry = async (req, res) => {
  const { type, amount, category, description, event_id } = req.body;

  if (!type || !amount || !category) {
    return res.status(400).json({ message: 'Type, amount, and category are required.' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Type must be income or expense.' });
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    return res.status(400).json({ message: 'Amount must be a positive number.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO budget_entries (type, amount, category, description, event_id, logged_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        type,
        parseFloat(amount),
        category,
        description || null,
        event_id || null,
        req.user.id,
      ]
    );
    res.status(201).json({ message: 'Budget entry created successfully.', entryId: result.insertId });
  } catch (err) {
    console.error('Create budget entry error:', err);
    res.status(500).json({ message: 'Failed to create budget entry.' });
  }
};

/* DELETE /api/budget/:id
 * Deletes a budget entry */

const deleteEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const [entries] = await db.query('SELECT * FROM budget_entries WHERE id = ?', [id]);
    if (entries.length === 0) {
      return res.status(404).json({ message: 'Budget entry not found.' });
    }

    await db.query('DELETE FROM budget_entries WHERE id = ?', [id]);
    res.status(200).json({ message: 'Budget entry deleted successfully.' });
  } catch (err) {
    console.error('Delete budget entry error:', err);
    res.status(500).json({ message: 'Failed to delete budget entry.' });
  }
};

module.exports = { getAllEntries, getSummary, createEntry, deleteEntry };