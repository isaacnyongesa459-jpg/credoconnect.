const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');
const itemRoutes = require('./routes/itemRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/items', itemRoutes);

// Health Check Route (Verifies database connectivity)
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({ 
      status: 'success', 
      message: 'Backend and database are connected!', 
      serverTime: result.rows[0].now 
    });
  } catch (err) {
    console.error('Database health check failed:', err);
    res.status(500).json({ 
      status: 'error', 
      message: 'Database connection failed' 
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
