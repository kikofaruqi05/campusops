const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/budget', require('./routes/budgetRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/attempts', require('./routes/attemptRoutes'));

app.get('/', (req, res) => {
  res.json({ message: 'CampusOps API is running.' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});