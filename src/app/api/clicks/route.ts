import { NextResponse } from 'next/server';
import { socials } from '@/data/socials';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export const dynamic = 'force-dynamic';

export async function GET() {
  // If not configured, return zeros gracefully
  if (!REDIS_URL || !REDIS_TOKEN) {
    const counts: Record<string, number> = {};
    socials.forEach(s => { counts[s.id] = 0; });
    return NextResponse.json(counts);
  }

  // Pipeline: fetch all click counts in one round-trip
  const pipeline = socials.map(s => ['GET', `clicks:${s.id}`]);

  const res = await fetch(`${REDIS_URL}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pipeline),
    cache: 'no-store',
  });

  const data: { result: string | null }[] = await res.json();

  const counts: Record<string, number> = {};
  socials.forEach((social, i) => {
    counts[social.id] = parseInt(data[i]?.result ?? '0', 10) || 0;
  });

  return NextResponse.json(counts, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
