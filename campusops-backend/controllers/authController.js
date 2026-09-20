const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const register = async (req, res) => {
  const { full_name, email, password, role, society } = req.body;
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
  try {
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (full_name, email, password, role, society) VALUES (?, ?, ?, ?, ?)',
      [full_name, email, hashedPassword, role, society || null]
    );
    res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        society: user.society,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// Get all members of the same society
const getMembers = async (req, res) => {
  const userId = req.user.id;
  try {
    // First get the society of the requesting user
    const [userRows] = await db.query('SELECT society FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const society = userRows[0].society;

    // Then get all members of that society
    const [rows] = await db.query(
      'SELECT id, full_name, email, role, created_at FROM users WHERE society = ? ORDER BY created_at ASC',
      [society]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ message: 'Failed to fetch members.' });
  }
};

// Update a member's role privilidge for president only
const updateMemberRole = async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const requestingUser = req.user;

  if (requestingUser.role !== 'president') {
    return res.status(403).json({ message: 'Only the president can edit member roles.' });
  }

  const validRoles = ['president', 'treasurer', 'committee_member'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  // Prevent president from changing their own role
  if (parseInt(id) === requestingUser.id) {
    return res.status(400).json({ message: 'You cannot change your own role.' });
  }

  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
    res.json({ message: 'Role updated successfully.' });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ message: 'Failed to update role.' });
  }
};

module.exports = { register, login, getMembers, updateMemberRole };