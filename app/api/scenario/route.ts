// app/api/scenario/route.ts
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
  const { scenario, topic } = body;

  try {
    const response = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Nigerian tax tutor. Answer scenario-based questions clearly and accurately. Topic: ${topic}.`
        },
        {
          role: 'user',
          content: `Here is a tax scenario: ${scenario}`
        }
      ],
      model: modelName,
      max_tokens: 1000,
      temperature: 0.7,
      top_p: 1
    });

    const reply = response.choices[0].message.content;
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Azure OpenAI error:", error.response?.data || error.message || error);
    return NextResponse.json({ error: 'Failed to process scenario.' }, { status: 500 });
  }
}
