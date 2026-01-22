// utils/searchUtils.js

// Generate search query from filters
exports.generateSearchQuery = (filters) => {
  const query = {};
  
  // Text search
  if (filters.query) {
    query.$text = { $search: filters.query };
  }
  
  // Type filter
  if (filters.type) {
    query.type = filters.type;
  }
  
  // Threat level filter
  if (filters.threatLevel) {
    query.threatLevel = filters.threatLevel;
  }
  
  // Tags filter
  if (filters.tags) {
    query.tags = { $in: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
  }
  
  // Confidence range
  if (filters.confidenceMin || filters.confidenceMax) {
    query.confidence = {};
    if (filters.confidenceMin) query.confidence.$gte = filters.confidenceMin;
    if (filters.confidenceMax) query.confidence.$lte = filters.confidenceMax;
  }
  
  // Date range
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return query;
};

// Generate sort options
exports.generateSortOptions = (sortBy, sortOrder) => {
  const sort = {};
  
  switch(sortBy) {
    case 'createdAt':
    case 'updatedAt':
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'threatLevel':
      // Custom sort for threat levels
      sort.threatLevelOrder = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'confidence':
      sort.confidence = sortOrder === 'asc' ? 1 : -1;
      break;
    case 'verificationCount':
      sort.verificationCount = sortOrder === 'asc' ? 1 : -1;
      break;
    default:
      sort.createdAt = -1;
  }
  
  return sort;
};

// Calculate threat level order for sorting
exports.getThreatLevelOrder = (level) => {
  const order = {
    'critical': 4,
    'high': 3,
    'medium': 2,
    'low': 1
  };
  return order[level] || 0;
};

// Format search results for display
exports.formatSearchResults = (iocs, includeSensitive = false) => {
  return iocs.map(ioc => {
    const result = {
      id: ioc._id,
      type: ioc.type,
      value: ioc.value,
      threatLevel: ioc.threatLevel,
      confidence: ioc.confidence,
      description: ioc.description ? ioc.description.substring(0, 200) + (ioc.description.length > 200 ? '...' : '') : '',
      tags: ioc.tags || [],
      firstSeen: ioc.firstSeen,
      lastSeen: ioc.lastSeen,
      submitter: ioc.isAnonymous ? 'Anonymous' : ioc.submitter,
      blockchainTxHash: ioc.blockchainTxHash,
      status: ioc.status,
      verificationCount: ioc.verificationCount || 0,
      createdAt: ioc.createdAt,
      updatedAt: ioc.updatedAt
    };
    
    if (includeSensitive) {
      result.isAnonymous = ioc.isAnonymous;
      result.fullDescription = ioc.description;
    }
    
    return result;
  });
};

// Generate search cache key
exports.generateCacheKey = (filters) => {
  const keyParts = [];
  
  Object.keys(filters).sort().forEach(key => {
    if (filters[key]) {
      keyParts.push(`${key}:${filters[key]}`);
    }
  });
  
  return keyParts.join('|');
};

// Validate and sanitize search input
exports.sanitizeSearchInput = (input) => {
  const sanitized = {};
  
  Object.keys(input).forEach(key => {
    const value = input[key];
    
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        // Remove potential injection characters
        sanitized[key] = value.trim().replace(/[<>$()]/g, '');
      } else {
        sanitized[key] = value;
      }
    }
  });
  
  return sanitized;
};
