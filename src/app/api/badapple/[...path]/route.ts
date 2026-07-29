import { NextRequest, NextResponse } from 'next/server';

const RELEASE_BASE =
  'https://github.com/kw3z/website-socials/releases/download/badapple-assets-v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const filePath = path.join('/');
  const url = `${RELEASE_BASE}/${filePath}`;

  // Forward Range header so audio seeking works correctly.
  // Without this, the browser's range request gets stripped and the CDN
  // returns the full file from byte 0, making audio restart from the beginning.
  const upstreamHeaders: HeadersInit = {
    'User-Agent': 'Mozilla/5.0 (compatible; Next.js server-side proxy)',
  };
  const rangeHeader = request.headers.get('Range');
  if (rangeHeader) {
    upstreamHeaders['Range'] = rangeHeader;
  }

  try {
    const upstream = await fetch(url, {
      redirect: 'follow',
      headers: upstreamHeaders,
    });

    // 206 Partial Content is a valid success for range requests
    if (!upstream.ok && upstream.status !== 206) {
      return new NextResponse(`Upstream error: ${upstream.status}`, {
        status: upstream.status,
      });
    }

    const responseHeaders: HeadersInit = {
      'Content-Type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
      // Tell the browser this resource supports range requests
      'Accept-Ranges': 'bytes',
    };

    // Pass through partial-content headers so the browser can seek correctly
    const contentRange = upstream.headers.get('Content-Range');
    if (contentRange) responseHeaders['Content-Range'] = contentRange;

    const contentLength = upstream.headers.get('Content-Length');
    if (contentLength) responseHeaders['Content-Length'] = contentLength;

    return new NextResponse(upstream.body, {
      status: upstream.status, // 200 or 206
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[badapple proxy] fetch failed:', err);
    return new NextResponse('Proxy error', { status: 502 });
  }
}
