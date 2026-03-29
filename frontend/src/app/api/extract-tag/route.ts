import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { image_base64 } = body

    if (!image_base64) {
      return NextResponse.json({ error: 'image_base64 is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        care_instructions: null,
        brand: null,
        variety: null,
        raw_text: null,
        message: 'Tag reading service not configured.',
      })
    }

    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: image_base64,
              },
            },
            {
              type: 'text',
              text: `This is a photo of a plant tag, label, or packaging from a nursery/grower. Extract the following information and return it as JSON only (no markdown, no code fences):

{
  "brand": "the nursery, grower, or brand name if visible",
  "variety": "the specific plant variety or cultivar name if listed",
  "care_instructions": "a concise summary of all care instructions shown (sunlight, water, soil, spacing, hardiness zone, etc). Summarize into clear bullet points. If specific growing instructions from the producer are shown, include those verbatim.",
  "raw_text": "all readable text on the tag/label"
}

If you cannot read a field, set it to null. If this is not a plant tag/label, set all fields to null.`,
            },
          ],
        },
      ],
    })

    const textBlock = response.content.find(b => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 })
    }

    try {
      const parsed = JSON.parse(textBlock.text)
      return NextResponse.json(parsed)
    } catch {
      // If Claude didn't return valid JSON, return the raw text
      return NextResponse.json({
        care_instructions: null,
        brand: null,
        variety: null,
        raw_text: textBlock.text,
      })
    }
  } catch (error) {
    console.error('Error in POST /api/extract-tag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
