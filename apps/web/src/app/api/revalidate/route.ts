import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-revalidate-secret');
  if (secret !== process.env['REVALIDATE_SECRET']) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await req.json()) as {
    tag?: string;
    matchId?: string;
    tournamentId?: string;
  };

  if (body.tag !== undefined) {
    revalidateTag(body.tag);
  } else if (body.matchId !== undefined) {
    revalidateTag(`match:${body.matchId}`);
    revalidateTag(`match:${body.matchId}:scorecard`);
  } else if (body.tournamentId !== undefined) {
    revalidateTag(`tournament:${body.tournamentId}:matches`);
    revalidateTag('tournaments');
  }

  return NextResponse.json({ revalidated: true });
}
