import { NextResponse } from 'next/server';
import { ParsedRuleSchema } from '@/types/rule';
import { registerActiveRule } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rule = ParsedRuleSchema.parse(body.rule);

    const sessionId = await resolveSessionId();
    const activeRule = await registerActiveRule(rule, sessionId);

    return NextResponse.json({ success: true, activeRule });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to register rule' },
      { status: 400 }
    );
  }
}
