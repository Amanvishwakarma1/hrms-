const Expense = require('../models/Expense');

exports.getAllExpenses = async (req, res) => {
  try {
    console.log("--- [BACKEND] API hit: Fetching all expenses ---");
    
    const expenses = await Expense.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`--- [BACKEND] Successfully retrieved ${expenses.length} records ---`);
    return res.status(200).json(expenses);
  } catch (error) {
    // CRITICAL: Logging the full error object reveals exactly why your DB connection is breaking
    console.error('❌ Fetch exception encountered:', error); 
    
    return res.status(500).json({ 
      error: 'Database execution failure retrieving expense items.',
      details: error.message 
    });
  }
};

exports.createExpenseClaim = async (req, res) => {
  try {
    console.log("--- [BACKEND] API hit: Creating expense claim ---", req.body);
    const { category, amount, description, userId, userName } = req.body;

    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category field is required.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Please enter a valid numeric amount greater than 0.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Missing required multipart invoice file attachment.' });
    }

    // Read proxy routing headers injected automatically by GitHub Codespaces
    const forwardedHost = req.get('x-forwarded-host');
    const forwardedProto = req.get('x-forwarded-proto');
    
    const host = forwardedHost || req.get('host');
    const protocol = forwardedProto || req.protocol;

    const serverBaseUrl = `${protocol}://${host}`;
    const invoiceUrl = `${serverBaseUrl}/static/uploads/${req.file.filename}`;

    const newExpense = await Expense.create({
      userId: userId ? userId.trim() : null,
      userName: userName ? userName.trim() : null,
      category: category.trim(),
      amount: parsedAmount,
      description: description ? description.trim() : null,
      invoiceUrl
    });

    console.log(`--- [BACKEND] Expense successfully created with ID: ${newExpense.id} ---`);
    return res.status(201).json({ message: 'Expense record synchronized successfully!', id: newExpense.id });
  } catch (error) {
    console.error('❌ Persistence validation failure:', error);
    return res.status(500).json({ 
      error: 'Server internal validation engine dropped payload instantiation properties.',
      details: error.message
    });
  }
};

exports.updateExpenseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected.' });
    }

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense record not found.' });
    }

    expense.status = status;
    await expense.save();

    console.log(`--- [BACKEND] Expense ${id} status updated to ${status} ---`);
    return res.status(200).json(expense);
  } catch (error) {
    console.error('❌ Update expense status exception:', error);
    return res.status(500).json({ 
      error: 'Failed to update expense status.',
      details: error.message 
    });
  }
};