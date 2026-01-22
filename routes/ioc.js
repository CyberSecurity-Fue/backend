const express = require('express');
const router = express.Router();
const IOC = require('../models/IOC');
const { validateIOC } = require('../validation/ioc');

// Get all IOCs with pagination and filtering
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Add filters if provided
    if (req.query.type) filter.type = req.query.type;
    if (req.query.threatLevel) filter.threatLevel = req.query.threatLevel;
    if (req.query.tags) filter.tags = { $in: req.query.tags.split(',') };
    if (req.query.status) filter.status = req.query.status;

    const iocs = await IOC.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const total = await IOC.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      iocs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit new IOC
router.post('/submit', async (req, res) => {
  try {
    // Validate request body
    const { error } = validateIOC(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if IOC already exists
    const existingIOC = await IOC.findOne({
      type: req.body.type,
      value: req.body.value
    });

    if (existingIOC) {
      return res.status(409).json({ 
        error: 'IOC already exists in the database',
        existingIOC: existingIOC._id 
      });
    }

    // Create new IOC
    const ioc = new IOC({
      ...req.body,
      submitter: req.body.isAnonymous ? 'Anonymous' : (req.user?.username || 'System')
    });

    await ioc.save();

    // Simulate blockchain transaction (in a real implementation, this would interact with a blockchain)
    const blockchainTxHash = simulateBlockchainTransaction(ioc);

    // Update IOC with blockchain transaction hash
    ioc.blockchainTxHash = blockchainTxHash;
    ioc.status = 'confirmed';
    await ioc.save();

    res.status(201).json({
      message: 'IOC submitted successfully',
      ioc: {
        id: ioc._id,
        type: ioc.type,
        value: ioc.value,
        threatLevel: ioc.threatLevel,
        blockchainTxHash: ioc.blockchainTxHash,
        createdAt: ioc.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get IOC by ID
router.get('/:id', async (req, res) => {
  try {
    const ioc = await IOC.findById(req.params.id).select('-__v');
    
    if (!ioc) {
      return res.status(404).json({ error: 'IOC not found' });
    }

    res.json(ioc);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update IOC verification count
router.patch('/:id/verify', async (req, res) => {
  try {
    const ioc = await IOC.findByIdAndUpdate(
      req.params.id,
      { $inc: { verificationCount: 1 } },
      { new: true }
    ).select('-__v');

    if (!ioc) {
      return res.status(404).json({ error: 'IOC not found' });
    }

    res.json({ 
      message: 'IOC verification count updated',
      verificationCount: ioc.verificationCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get IOCs by type
router.get('/type/:type', async (req, res) => {
  try {
    const iocs = await IOC.find({ type: req.params.type })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('value threatLevel confidence createdAt');

    res.json(iocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search IOCs
router.get('/search/:query', async (req, res) => {
  try {
    const query = req.params.query;
    const iocs = await IOC.find({
      $or: [
        { value: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    })  
    .sort({ createdAt: -1 })
    .limit(20)
    .select('-__v');

    res.json(iocs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// simulate blockchain transaction
function simulateBlockchainTransaction(ioc) {

  const chars = '0123456789abcdef';
  let txHash = '0x';
  for (let i = 0; i < 64; i++) {
    txHash += chars[Math.floor(Math.random() * chars.length)];
  }
  
  console.log(`Simulated blockchain transaction for IOC ${ioc._id}: ${txHash}`);
  return txHash;
}

module.exports = router;
