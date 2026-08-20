const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, notificationController.list);
router.put('/:id/read', authenticate, notificationController.markRead);
router.put('/read-all', authenticate, notificationController.markAllRead);
router.delete('/:id', authenticate, notificationController.delete);

module.exports = router;
