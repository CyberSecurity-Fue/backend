const express= require("express");
const OpenAI = require("openai");


const router = express.Router();
const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
const client2= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_2 });
const client3= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_3 });
const client4= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_4 });
const client5= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_5 });
const client6= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_6 });
const client7= new OpenAI({ apiKey: process.env.OPENAI_API_KEY_7 });

router.post("/summary-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
1. Threat summary 
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/attackexp-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
2. Attack explanation 
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client2.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/risk-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
3. Risk level 
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client3.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/socActions-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
4. Required SOC actions
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client4.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/Maintaining-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
5. Maintaining ideas
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client5.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/controls-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
6. Recommended security controls (SIEM, EDR, Firewall, Email Security…)
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client6.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

router.post("/analyze-ioc", async (req, res) => {
  try {
    const ioc = req.body;

    const prompt = `
You are a SOC Analyst AI. Analyze the following IOC and provide:
1. Threat summary 
2. Attack explanation 
3. Risk level 
4. Required SOC actions + research links about the threat and mitigation
5. Maintaining ideas for the customer's company
6. Recommended security controls (SIEM, EDR, Firewall, Email Security…)
7- Conclusion
IOC Data:
${JSON.stringify(ioc, null, 2)}
    `;

    const aiRes = await client7.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "You are a professional SOC Analyst assistant." },
        { role: "user", content: prompt }
      ]
    });

    res.json({
      analysis: aiRes.choices[0].message.content
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI agent failed" });
  }
});

module.exports = router;
