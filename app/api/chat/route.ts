// app/api/chat/route.ts
import { AzureOpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
const modelName = process.env.AZURE_OPENAI_MODEL!;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, context } = body;

  try {
    const response = await client.chat.completions.create({
      messages: [
        { role: 'system', content: `You are a helpful Nigerian tax tutor. ${context}` },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1,
      model: modelName
    });

    const reply = response.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error:any) {
    console.error("Azure OpenAI error:", error.response?.data || error.message || error);
    return NextResponse.json({ error: 'Failed to fetch response from Azure OpenAI' }, { status: 500 });
  }
}
