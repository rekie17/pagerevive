import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { url, desktop, mobile } = await request.json();

    if (!url || !desktop || !mobile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Remove data URL prefix to get just the base64
    const desktopBase64 = desktop.replace(/^data:image\/\w+;base64,/, '');
    const mobileBase64 = mobile.replace(/^data:image\/\w+;base64,/, '');

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: desktopBase64,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: mobileBase64,
              },
            },
            {
              type: 'text',
              text: `Analyze these screenshots (desktop and mobile) of the webpage: ${url}

Score the page on these dimensions (0-100):
1. Visual Hierarchy - How clear is the information hierarchy and flow
2. CTA Clarity - How obvious and compelling are the calls-to-action
3. Trust Signals - Presence of credibility indicators (testimonials, logos, guarantees)
4. Mobile Friendliness - How well the design works on mobile
5. Overall Conversion Potential - General assessment of conversion optimization

Then provide 5-8 specific, actionable audit findings about what could be improved for better conversions.

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "scores": {
    "visualHierarchy": <number>,
    "ctaClarity": <number>,
    "trustSignals": <number>,
    "mobileFriendliness": <number>,
    "overall": <number>
  },
  "audit": [
    "Finding 1",
    "Finding 2",
    ...
  ]
}`,
            },
          ],
        },
      ],
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    
    // Parse the JSON response
    const analysis = JSON.parse(responseText);

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
