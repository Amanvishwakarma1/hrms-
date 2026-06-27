const express = require('express');
const router = express.Router();
const Leave = require('../models/Leave');

// GET all leaves (Admin) or leaves for a specific user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const whereClause = userId ? { userId } : {};
    
    const leaves = await Leave.findAll({
      where: whereClause,
      order: [['appliedAt', 'DESC']]
    });

    const Employee = require('../models/Employee');
    const leavesWithBalances = await Promise.all(leaves.map(async (leave) => {
      const leaveObj = leave.toJSON();
      const emp = await Employee.findByPk(leave.userId);
      if (emp) {
        leaveObj.leavesConsumed = emp.consumedLeaves;
        leaveObj.leavesRemaining = emp.allowedLeaves - emp.consumedLeaves;
      } else {
        leaveObj.leavesConsumed = 0;
        leaveObj.leavesRemaining = 15;
      }
      return leaveObj;
    }));
    
    return res.status(200).json(leavesWithBalances);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return res.status(500).json({ error: error.message });
  }
});

// POST Apply for a leave
router.post('/', async (req, res) => {
  try {
    const { userId, userName, startDate, endDate, type, reason } = req.body;
    
    if (!userId || !userName || !startDate || !endDate || !type || !reason) {
      return res.status(400).json({ error: 'Missing required leave fields.' });
    }
    
    const newLeave = await Leave.create({
      userId,
      userName,
      startDate,
      endDate,
      type,
      reason,
      status: 'pending',
      appliedAt: Date.now()
    });
    
    return res.status(201).json(newLeave);
  } catch (error) {
    console.error('Error creating leave application:', error);
    return res.status(500).json({ error: error.message });
  }
});

// PATCH Update leave status (approved or rejected)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid leave status.' });
    }
    
    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const Employee = require('../models/Employee');
    
    // If the status is changing to approved, we increment consumedLeaves for that employee
    if (status === 'approved' && leave.status !== 'approved') {
      const emp = await Employee.findByPk(leave.userId);
      if (emp) {
        // Calculate days
        const sDate = new Date(leave.startDate);
        const eDate = new Date(leave.endDate);
        const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
        
        emp.consumedLeaves += diffDays;
        await emp.save();
      }
    } else if (status !== 'approved' && leave.status === 'approved') {
      // If we revoke approval, decrement consumedLeaves
      const emp = await Employee.findByPk(leave.userId);
      if (emp) {
        const sDate = new Date(leave.startDate);
        const eDate = new Date(leave.endDate);
        const diffTime = Math.abs(eDate.getTime() - sDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        emp.consumedLeaves = Math.max(0, emp.consumedLeaves - diffDays);
        await emp.save();
      }
    }
    
    leave.status = status;
    await leave.save();
    
    return res.status(200).json(leave);
  } catch (error) {
    console.error('Error updating leave status:', error);
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
