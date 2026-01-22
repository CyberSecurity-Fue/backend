const express = require('express');
const IOC = require('../models/IOC');
const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalIOCs = await IOC.countDocuments();
    const iocsByType = await IOC.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const iocsByThreatLevel = await IOC.aggregate([
      {
        $group: {
          _id: '$threatLevel',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentSubmissions = await IOC.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('type value threatLevel createdAt');

    const submissionsOverTime = await IOC.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      { $limit: 30 }
    ]);

    res.json({
      totalIOCs,
      iocsByType,
      iocsByThreatLevel,
      recentSubmissions,
      submissionsOverTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
