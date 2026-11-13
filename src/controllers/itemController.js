const db = require('../config/db');

// Get all items
const getItems = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM items ORDER BY created_at DESC');
    res.status(200).json({ status: 'success', data: result.rows });
  } catch (err) {
    console.error('Error fetching items:', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch items' });
  }
};

// Create a new item
const createItem = async (req, res) => {
  const { title, description } = req.body;
  
  if (!title) {
    return res.status(400).json({ status: 'error', message: 'Title is required' });
  }

  try {
    const queryText = 'INSERT INTO items (title, description) VALUES ($1, $2) RETURNING *';
    const values = [title, description || ''];
    const result = await db.query(queryText, values);
    
    res.status(201).json({ status: 'success', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ status: 'error', message: 'Failed to create item' });
  }
};

module.exports = {
  getItems,
  createItem
};
