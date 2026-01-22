// validation/search.js
const Joi = require('joi');

const searchSchema = Joi.object({
  query: Joi.string().min(2).max(100).optional(),
  type: Joi.string().valid('ip', 'domain', 'url', 'hash-md5', 'hash-sha1', 'hash-sha256', 'email', 'cidr', 'asn').optional(),
  threatLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
  tags: Joi.string().pattern(/^[a-zA-Z0-9\s,.-]+$/).optional(),
  confidenceMin: Joi.number().min(0).max(100).optional(),
  confidenceMax: Joi.number().min(0).max(100).optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'threatLevel', 'confidence', 'verificationCount').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20)
});

const exportSchema = Joi.object({
  format: Joi.string().valid('json', 'csv').default('json'),
  query: Joi.string().optional(),
  type: Joi.string().optional(),
  threatLevel: Joi.string().optional(),
  tags: Joi.string().optional(),
  confidenceMin: Joi.number().optional(),
  confidenceMax: Joi.number().optional(),
  dateFrom: Joi.date().optional(),
  dateTo: Joi.date().optional()
});

module.exports = {
  searchSchema,
  exportSchema
};
