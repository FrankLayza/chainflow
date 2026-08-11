import { NextResponse } from 'next/server';
import { getActiveRule, updateActiveRule, countActiveRules } from '@/repositories/audit-repository';
import { resolveSessionId } from '@/lib/session';
import { LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ruleId } = body as { ruleId?: string };

    if (!ruleId) {
      return NextResponse.json({ error: 'ruleId is required' }, { status: 400 });
    }

    const sessionId = await resolveSessionId();
    const rule = await getActiveRule(ruleId);

    if (!rule || rule.session_id !== sessionId) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    }

    if (rule.status === 'ACTIVE') {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const activeCount = await countActiveRules(sessionId);
    if (activeCount >= LIMITS.activeRules) {
      return NextResponse.json(
        { error: `Active rule limit (${LIMITS.activeRules}) reached for this session.` },
        { status: 429 }
      );
    }

    await updateActiveRule(ruleId, { status: 'ACTIVE' });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to enable rule' },
      { status: 500 }
    );
  }
}