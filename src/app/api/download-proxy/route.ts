import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/download-proxy?url=<encoded-url>&filename=<filename>
 *
 * Fetches the file server-side (no CORS restriction) and re-serves it with
 * Content-Disposition: attachment so the browser downloads it instead of
 * opening it in a tab or the PDF viewer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const url = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download.pdf';

  if (!url) {
    return new NextResponse('Missing url param', { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return new NextResponse('Failed to fetch file', { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[download-proxy]', err);
    return new NextResponse('Proxy error', { status: 500 });
  }
}
