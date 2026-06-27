const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expense');
const upload = require('../middleware/upload');

router.get('/', expenseController.getAllExpenses);
router.patch('/:id/status', expenseController.updateExpenseStatus);
router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error("❌ Multer upload error:", err.message);
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, expenseController.createExpenseClaim);

module.exports = router;