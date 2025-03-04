const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

router.get('/logging-test', (req, res) => {
  logger.info('This is a test log');
  logger.error('This is a test error log');
  logger.transaction('TEST', { working: true });
  
  return res.status(200).json({ message: 'Logging test executed, check your server console' });
});

module.exports = router;
