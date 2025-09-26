import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { AzureOpenAI } from 'openai';

const endpoint = process.env.AZURE_OPENAI_ENDPOINT!;
const apiKey = process.env.AZURE_OPENAI_API_KEY!;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT!;
const modelName = process.env.AZURE_OPENAI_MODEL!;
const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;

const client = new AzureOpenAI({ endpoint, apiKey, deployment, apiVersion });

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const topic = (formData.get('topic') as string) || "General Tax";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Invalid or missing file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name.toLowerCase();

    let extractedText = "";

    if (fileName.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (fileName.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (fileName.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No readable text found in document' }, { status: 400 });
    }

    const messages = [
      {
        role: 'system',
        content: `You are a tax expert analyzing a document provided by a user. Your job is to:
        - Extract key tax-related insights from the document.
        - Summarize the document in a clear and concise way.
        - Highlight any potential tax issues, obligations, or errors.
        - Keep the summary relevant to the topic: ${topic}.
        - Use a formal and informative tone.
        - Avoid special characters or formatting, as this may be read aloud in a voice session.`
      },
      {
        role: 'user',
        content: `Here is the document text:\n\n${extractedText}`
      }
    ];

    const response = await client.chat.completions.create({
      messages,
      max_tokens: 1500,
      temperature: 0.5,
      top_p: 1,
      model: modelName
    });

    const reply = response.choices?.[0]?.message?.content;
    if (!reply) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    return NextResponse.json({ transcript: reply });
  } catch (error: any) {
    console.error("Error analyzing document:", error?.message || error);
    return NextResponse.json({ error: 'Failed to analyze document' }, { status: 500 });
  }
}