import { AzureOpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
const modelName = process.env.AZURE_OPENAI_MODEL!;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const prompt = `

Generate a new and unique multiple-choice tax question on the topic "${topic}".
Do not repeat previous questions. Include:
- A clear question
- Four answer options
- The correct answer
- A brief explanation of the correct answer

Respond in JSON format like this:
{
  "question": "...",
  "options": ["...", "...", "...", "..."],
  "answer": "...",
  "explanation": "..."
}
`;

    const response = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: "You are a helpful Nigerian tax tutor assistant." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const message = response.choices[0]?.message?.content;
    if (!message) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    const quizData = JSON.parse(message);
    return NextResponse.json(quizData);
  } catch (error: any) {
    console.error("Quiz generation error:", error);
    return NextResponse.json({ error: "Failed to generate quiz question." }, { status: 500 });
  }
}
