import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the GoogleGenAI client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Define the Google Search tool. This is a built-in tool.
const googleSearchTool = {
  googleSearch: {},
};

// Define the prompt for the Daily Briefing
const BRIEFING_PROMPT = `
  You are Aura, a personal AI assistant. Your user is a full-stack developer specializing in Next.js and Tailwind CSS.

  Generate a "Daily Briefing" for them. You MUST use the Google Search tool.
  The briefing must include the following sections:

  1.  **Top World News**: 2 summarized bullet points on major global events.
  2.  **Top Tech News**: 2 summarized bullet points relevant to developers (e.g., AI, new frameworks, Vercel).
  3.  **YouTube Suggestion**: 1 YouTube video (Title and URL) from the past week relevant to Next.js, React, or Tailwind CSS, with a one-sentence summary of why it's useful.

  Format the entire output as clean, readable text.
  Example:
  **World News:**
  * [Summary of news 1]
  * [Summary of news 2]
  
  **Tech News:**
  * [Summary of tech news 1]
  * [Summary of tech news 2]

  **YouTube Suggestion:**
  * **Title:** [Video Title]
  * **URL:** [Video URL]
  * **Summary:** [One-sentence summary]
`;

// Remove the unused 'req' parameter to fix the ESLint warning
export async function GET() {
  try {
    // Generate content using the model, the prompt, and the search tool
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: BRIEFING_PROMPT }] }],
      config: {
        // Pass the Google Search tool in the config
        tools: [googleSearchTool],
      },
    });

    const briefingText = response.text;

    if (!briefingText) {
      throw new Error('No content returned from AI for briefing.');
    }

    // Return the generated briefing as JSON
    return NextResponse.json({ briefing: briefingText });

  } catch (error) {
    console.error('Briefing API Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate briefing.' },
      { status: 500 }
    );
  }
}