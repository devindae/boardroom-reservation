import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Default mock rooms fallback if database is empty/unconnected
const DEFAULT_ROOMS = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Executive Meeting Room', location: 'Upper Floor', created_at: new Date().toISOString() },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Meeting Room', location: 'First Floor', created_at: new Date().toISOString() },
]

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('rooms').select('*').order('name', { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_ROOMS)
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(DEFAULT_ROOMS)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, location } = body

    if (!name || !location) {
      return NextResponse.json({ error: 'Room name and location are required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rooms')
      .insert([{ name, location }])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
