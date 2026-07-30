import { NextResponse } from 'next/server';
import { parseNaturalLanguageRule } from '@/lib/ai/parser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    const parsedRule = await parseNaturalLanguageRule(prompt);
    return NextResponse.json({ success: true, rule: parsedRule });
  } catch (error: any) {
    console.error('API /parse-rule error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse rule' },
      { status: 500 }
    );
  }
}
