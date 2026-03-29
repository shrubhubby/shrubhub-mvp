import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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

    // Forward to Supabase Edge Function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token

    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/identify-plant`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ image_base64 }),
    })

    if (!response.ok) {
      // If edge function isn't deployed, fall back to a stub response
      // so the UI still works during development
      if (response.status === 404) {
        return NextResponse.json({
          suggestions: [],
          message: 'Plant identification service not configured. Enter details manually.',
        })
      }
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: 'Identification failed', details: errorData },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/identify-plant:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
