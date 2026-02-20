import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

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

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    
    // Desktop screenshot
    await page.setViewport({ width: 1280, height: 1024 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const desktopScreenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: false,
    });

    // Mobile screenshot
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    const mobileScreenshot = await page.screenshot({ 
      encoding: 'base64',
      fullPage: false,
    });

    await browser.close();

    return NextResponse.json({
      desktop: `data:image/png;base64,${desktopScreenshot}`,
      mobile: `data:image/png;base64,${mobileScreenshot}`,
    });

  } catch (error: any) {
    console.error('Screenshot error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to capture screenshots' },
      { status: 500 }
    );
  }
}
