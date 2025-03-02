const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const CashReserve = require('../models/cashReserve');

// Get all cash reserves for a user
router.get('/', protectRoute, async (req, res) => {
  try {
    const reserves = await CashReserve.find({ userId: req.user._id });
    res.json(reserves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new cash reserve
router.post('/', protectRoute, async (req, res) => {
  try {
    const reserve = new CashReserve({
      ...req.body,
      userId: req.user._id
    });
    const newReserve = await reserve.save();
    res.status(201).json(newReserve);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
