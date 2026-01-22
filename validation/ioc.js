const Joi = require('joi');

const iocSubmissionSchema = Joi.object({
  type: Joi.string().valid('ip', 'domain', 'url', 'hash-md5', 'hash-sha1', 'hash-sha256', 'email', 'cidr', 'asn').required(),
  value: Joi.string().trim().required(),
  threatLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required(),
  confidence: Joi.number().integer().min(0).max(100).required(),
  description: Joi.string().trim().allow(''),
  tags: Joi.array().items(Joi.string().trim()),
  firstSeen: Joi.date().iso(),
  lastSeen: Joi.date().iso().min(Joi.ref('firstSeen')),
  isAnonymous: Joi.boolean().default(true)
});

const validateIOC = (data) => {
  return iocSubmissionSchema.validate(data);
};

module.exports = { validateIOC };
