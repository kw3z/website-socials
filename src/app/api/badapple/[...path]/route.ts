import { NextRequest, NextResponse } from 'next/server';

const RELEASE_BASE =
  'https://github.com/kw3z/website-socials/releases/download/badapple-assets-v1';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');
  const url = `${RELEASE_BASE}/${filePath}`;

  try {
    const upstream = await fetch(url, {
      redirect: 'follow',
      headers: {
        // Some CDNs block bot-like requests; spoof a browser UA to be safe
        'User-Agent':
          'Mozilla/5.0 (compatible; Next.js server-side proxy)',
      },
    });

    if (!upstream.ok) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    // Stream the body straight through — avoids buffering large chunks in memory
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type':
          upstream.headers.get('content-type') ?? 'application/octet-stream',
        // Cache aggressively — release assets are immutable
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[badapple proxy] fetch failed:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
