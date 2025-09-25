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
  const { message, context, history = [] } = body;

  try {
    const messages = [
      {
        role: 'system',
        content: `You are a highly knowledgeable tutor teaching a real-time voice session with tax professionals. Your goal is to teach the student about the topic and subject.
                  Tutor Guidelines:
                  Stick to the given topic - {{ topic }} and teach the student or tax professional about it.
                  Give the student or tax professional time to answer and respond.
                  Keep the conversation flowing smoothly, include profesional sense of humor, you can digress to give examples.
                  Allow the student to ask other tax related questions not related to the topic.
                  From time to time make sure that the student is following you and understands you.
                  Break down the topic into smaller part and teach the student or tax professional.
                  Use a formal and polite style of communication, sound happy and enthusiastic,include profesional sense of humor.
                  Keep your responses short, like in a real voice conversation.
                  Always ask the student if they have any questions or need further clarification on any point.
                  Do not include any special characters in your responses - this is a voice conversation.
                  ${context}`
      },
      ...history.map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await client.chat.completions.create({
      messages,
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
