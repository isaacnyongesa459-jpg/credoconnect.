const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');

// GET /api/items - Retrieve all items
router.get('/', itemController.getItems);

// POST /api/items - Add a new item
router.post('/', itemController.createItem);

module.exports = router;
