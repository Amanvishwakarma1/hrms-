const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.findAll({
      order: [['name', 'ASC']]
    });
    return res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ error: error.message });
  }
});

// GET single employee profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    return res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST Create new employee
router.post('/', async (req, res) => {
  try {
    const { name, email, password, designation, role, allowedLeaves } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    // Check if employee already exists
    const existing = await Employee.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email already exists.' });
    }

    // Generate a unique ID (empX) or use UUID
    const count = await Employee.count();
    const id = `emp${count + 1}`;

    const newEmp = await Employee.create({
      id,
      name,
      email: email.toLowerCase(),
      password,
      designation: designation || 'OFFICE',
      role: role || 'EMPLOYEE',
      allowedLeaves: allowedLeaves !== undefined ? Number(allowedLeaves) : 15,
      consumedLeaves: 0
    });

    return res.status(201).json(newEmp);
  } catch (error) {
    console.error('Error creating employee:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PUT Edit employee details
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, designation, role, allowedLeaves, consumedLeaves } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email.toLowerCase();
    if (password) employee.password = password;
    if (designation) employee.designation = designation;
    if (role) employee.role = role;
    if (allowedLeaves !== undefined) employee.allowedLeaves = Number(allowedLeaves);
    if (consumedLeaves !== undefined) employee.consumedLeaves = Number(consumedLeaves);

    await employee.save();
    return res.status(200).json(employee);
  } catch (error) {
    console.error('Error updating employee:', error);
    return res.status(500).json({ error: error.message });
  }
});

// DELETE Remove employee
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }
    await employee.destroy();
    return res.status(200).json({ message: 'Employee deleted successfully.' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
