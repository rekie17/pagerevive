import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Use Microlink API for screenshots (free tier)
    // Keep it simple - just capture screenshots with wait time
    const desktopParams = new URLSearchParams({
      url: url,
      screenshot: 'true',
      meta: 'false',
      'viewport.width': '1280',
      'viewport.height': '1024',
      waitFor: '2000',
    });
    
    const mobileParams = new URLSearchParams({
      url: url,
      screenshot: 'true',
      meta: 'false',
      'viewport.width': '375',
      'viewport.height': '812',
      'viewport.isMobile': 'true',
      waitFor: '2000',
    });

    const desktopUrl = `https://api.microlink.io/?${desktopParams.toString()}`;
    const mobileUrl = `https://api.microlink.io/?${mobileParams.toString()}`;

    const [desktopRes, mobileRes] = await Promise.all([
      fetch(desktopUrl),
      fetch(mobileUrl),
    ]);

    if (!desktopRes.ok || !mobileRes.ok) {
      throw new Error('Failed to capture screenshots');
    }

    const desktopData = await desktopRes.json();
    const mobileData = await mobileRes.json();

    // Microlink returns the screenshot URL
    const desktopScreenshot = desktopData.data?.screenshot?.url;
    const mobileScreenshot = mobileData.data?.screenshot?.url;

    if (!desktopScreenshot || !mobileScreenshot) {
      throw new Error('Screenshot URLs not found in response');
    }

    // Fetch the images and convert to base64
    const [desktopImg, mobileImg] = await Promise.all([
      fetch(desktopScreenshot).then(r => r.arrayBuffer()),
      fetch(mobileScreenshot).then(r => r.arrayBuffer()),
    ]);

    const desktopBase64 = Buffer.from(desktopImg).toString('base64');
    const mobileBase64 = Buffer.from(mobileImg).toString('base64');

    return NextResponse.json({
      desktop: `data:image/png;base64,${desktopBase64}`,
      mobile: `data:image/png;base64,${mobileBase64}`,
    });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture screenshots' },
      { status: 500 }
    );
  }
}
