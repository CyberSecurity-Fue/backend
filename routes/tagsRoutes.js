// routes/tagsRoutes.js
const express = require('express');
const router = express.Router();
const IOC = require('../models/IOC');

// Get popular tags
router.get('/popular', async (req, res) => {
  try {
    const tags = await IOC.aggregate([
      { $unwind: '$tags' },
      { 
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Format the response
    const popularTags = tags.map(tag => ({
      name: tag._id,
      count: tag.count
    }));

    res.json({
      success: true,
      data: popularTags
    });
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags',
      message: error.message
    });
  }
});

module.exports = router;
