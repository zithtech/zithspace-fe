import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const fileName = searchParams.get('name') || 'download';

  if (!fileUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return new NextResponse('Failed to fetch file', { status: res.status });
    }

    const headers = new Headers(res.headers);
    // Force the browser to download the file by setting Content-Disposition
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Proxy download error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
