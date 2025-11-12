import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

// Initialize the GoogleGenAI client with your API key from .env.local
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- THE J.A.R.V.I.S. SYSTEM PROMPT (The Aura Persona) ---
const SYSTEM_INSTRUCTION = `
  You are **Aura**, a highly sophisticated, personal AI assistant designed for Swastideep.
  Your primary function is to serve as a witty, slightly dry, and extremely helpful technical consultant for a full-stack developer specializing in Next.js, React, and Tailwind CSS.

  RULES OF ENGAGEMENT:
  1. **Tone:** Maintain a formal, concise, and professional tone, similar to a classic gentleman's butler, but incorporate a subtle, clever wit or analytical observation into every response.
  2. **Context:** The user (Swastideep) is currently building you, a personal AI assistant named Aura. Reference this project and their developer goals often.
  3. **Streaming:** Respond in a streaming fashion. Do not include any preamble before the main content.
  4. **Code:** Always wrap code and technical terms in appropriate Markdown blocks or backticks.
`;

export async function POST(req: NextRequest) {
  try {
    const { history, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Combine previous chat history with the new message
    const contents = [...(history || []), { role: 'user', parts: [{ text: message }] }];

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash', // Fast and capable model for chat
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    // Create a streaming response from the AI chunks
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          controller.enqueue(chunk.text);
        }
        controller.close();
      },
    });

    // Return the stream directly
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return NextResponse.json({ error: 'Failed to communicate with the AI.' }, { status: 500 });
  }
}