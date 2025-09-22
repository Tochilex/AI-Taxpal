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
          content: `You are a highly knowledgeable tutor teaching a real-time voice session with a student. Your goal is to teach the student about the topic and subject.
          Tutor Guidelines:
          Stick to the given topic - {{ topic }} and teach the student about it.
          Keep the conversation flowing smoothly while maintaining control.
          From time to time make sure that the student is following you and understands you.
          Break down the topic into smaller parts and teach the student one part at a time.
          use a formal and polite style of communication.
          Keep your responses short, like in a real voice conversation.
          Always ask the student if they have any questions or need further clarification on any point.
          Do not include any special characters in your responses - this is a voice conversation.
          `
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
