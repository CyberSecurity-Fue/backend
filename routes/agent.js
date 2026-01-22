// routes/agent.js
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const rateLimit = require('express-rate-limit');
const sanitize = require('sanitize-html'); // npm i sanitize-html
const { body, validationResult } = require('express-validator');

// init OpenAI client (make sure OPENAI_API_KEY is in .env)
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_2 });

// rate limit for agent endpoint (tune as needed)
const agentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Basic content safety check (very simple)
function isMaliciousRequest(text) {
  const lower = text.toLowerCase();
  const forbidden = [
    'exploit', 'zero-day', 'how to hack', 'ddos', 'dos', 'destroy', 'dropper',
    'ransom', 'payload', 'unauthorized access', 'sql injection exploit', 'malware source code',
    'create malware', 'build exploit'
  ];
  return forbidden.some(f => lower.includes(f));
}

// --- Optional enrichment tools (stubs) ---
// Replace with real implementations that call VirusTotal, NVD, Shodan, etc.

// Example: IOC lookup stub (returns enrichment object)
async function iocLookup(ioc) {
  // TODO: call your TI provider (VirusTotal, MISP, OTX) and return structured result
  // Placeholder:
  return {
    found: false,
    summary: `No matching enrichment for ${ioc} (placeholder).`,
    sources: []
  };
}

// Example: CVE lookup stub
async function cveLookup(idOrQuery) {
  // TODO: call NVD or a CVE DB and return structured result
  return {
    id: idOrQuery,
    title: 'CVE lookup placeholder',
    severity: 'UNKNOWN',
    cvss: null,
    description: 'This is a placeholder. Integrate NVD API or your vulnerability database.'
  };
}

// Example: Threat intel enrichment (placeholder)
async function threatIntelLookup(query) {
  // TODO: integrate with threat intel API
  return { summary: 'Threat intel placeholder results for ' + query, hits: [] };
}

// --- Agent endpoint ---
router.post(
  '/respond',
  agentLimiter,
  body('prompt').isString().isLength({ min: 1, max: 5000 }),
  async (req, res) => {
    try {
      // validation
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Invalid prompt' });
      }

      // get and sanitize user input
      const rawPrompt = req.body.prompt || '';
      const context = req.body.context || {}; // optional structured fields (ioc, cve, tags)
      const prompt = sanitize(rawPrompt, { allowedTags: [], allowedAttributes: {} }).trim();

      if (!prompt) return res.status(400).json({ success: false, error: 'Empty prompt' });

      // safety: block obviously malicious intent
      if (isMaliciousRequest(prompt)) {
        return res.status(403).json({
          success: false,
          error: 'Request blocked: the prompt appears to ask for malicious/illegal activity. Provide a safe, defensive SOC question or simulation.'
        });
      }

      // OPTIONAL: If user mentions an IOC or CVE, run enrichment automatically
      const enrichments = {};
      if (context.ioc) {
        enrichments.ioc = await iocLookup(context.ioc);
      }
      if (context.cve) {
        enrichments.cve = await cveLookup(context.cve);
      }
      if (context.query) {
        enrichments.intel = await threatIntelLookup(context.query);
      }

      // Build the system + user messages to guide the assistant
      const systemMessage = `
You are "bot named : socanalyst", an AI assistant specializing in cybersecurity for SOC teams. and can answer any question in anything in the life
      `.trim();

      // If enrichments exist, append them to context text
      let enrichmentText = '';
      if (Object.keys(enrichments).length > 0) {
        enrichmentText += '\n\n=== Enrichment Data ===\n';
        for (const k of Object.keys(enrichments)) {
          enrichmentText += `\n[${k.toUpperCase()}]\n${JSON.stringify(enrichments[k], null, 2)}\n`;
        }
      }

      // Compose final prompt for the model
      const fullUserPrompt = `
User prompt:
${prompt}

Context: ${JSON.stringify(context, null, 2)}
${enrichmentText}

answer as a bot knowing in everything and help in everything.
      `.trim();

      // Limit tokens & temperature for safer output
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini', // choose model available in your account
        temperature: 0.15,
        max_tokens: 900,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: fullUserPrompt }
        ]
      });

      const reply = completion.choices?.[0]?.message?.content ?? '';

      // return structured response
      return res.json({
        success: true,
        reply,
        meta: {
          model: completion.model ? completion.model : 'unknown',
          usage: completion.usage || null,
          enrichments
        }
      });
 
    } catch (err) {
      console.error('Agent error', err);
      return res.status(500).json({ success: false, error: err.message || 'Agent error' });
    }
  }
);

module.exports = router;
