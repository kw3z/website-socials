import { NextRequest, NextResponse } from 'next/server';

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!REDIS_URL || !REDIS_TOKEN) {
    return NextResponse.json({ count: 0 });
  }

  const res = await fetch(`${REDIS_URL}/incr/clicks:${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
    },
  });

  const data: { result: number } = await res.json();
  return NextResponse.json({ count: data.result });
}
