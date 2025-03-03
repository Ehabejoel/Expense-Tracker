const express = require('express');
const router = express.Router();
const { protectRoute } = require('../middleware/authMiddleware');
const {
  createReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  handleReminderAction
} = require('../controllers/reminderController');

router.use(protectRoute);

router.post('/', createReminder);
router.get('/', getReminders);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);
router.post('/:id/action', handleReminderAction);

module.exports = router;
