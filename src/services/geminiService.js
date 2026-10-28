const { GoogleGenerativeAI } = require('@google/generative-ai');

const improveContent = async (originalContent, postDetails = {}) => {
  const apiKey = process.env.GEMINI_API_KEY || 'default_test_key';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert editorial AI for Akatsuki's Draft platform. 
Please refine, enhance, and professionally polish the following content while preserving its core intent, clarity, and tone:

Title: ${postDetails.title || 'Untitled'}
Category: ${postDetails.category || 'General'}
Content:
${originalContent}

Provide ONLY the enhanced content without conversational preamble.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const improvedText = response.text();

  return improvedText.trim();
};

module.exports = {
  improveContent,
};

