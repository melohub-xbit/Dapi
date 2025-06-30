import { NextRequest, NextResponse } from 'next/server';
import { ScenarioService } from '@/lib/services';
import { z } from 'zod';

const querySchema = z.object({
  userEmail: z.string().email(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());

    const validation = querySchema.safeParse(query);

    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters', details: validation.error.flatten() }, { status: 400 });
    }

    const { userEmail } = validation.data;

    const scenarios = await ScenarioService.getScenariosByUser(userEmail);

    return NextResponse.json(scenarios);
  } catch (error: any) {
    console.error('Get scenarios error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get scenarios',
        details: error.message
      },
      { status: 500 }
    );
  }
}
