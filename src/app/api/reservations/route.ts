import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBooking } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get('roomId')
    const userId = searchParams.get('userId')
    const query = searchParams.get('query')

    const supabase = await createClient()

    let dbQuery = supabase
      .from('reservations')
      .select('*, room:rooms(*), profile:profiles(*)')
      .order('start_time', { ascending: true })

    if (roomId && roomId !== 'all') {
      dbQuery = dbQuery.eq('room_id', roomId)
    }

    if (userId) {
      dbQuery = dbQuery.eq('user_id', userId)
    }

    if (query) {
      dbQuery = dbQuery.ilike('title', `%${query}%`)
    }

    const { data, error } = await dbQuery

    if (error) {
      console.warn('Database reservations fetch error:', error.message)
      return NextResponse.json([])
    }

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { room_id, title, notes, start_time, end_time } = body

    if (!room_id || !title || !start_time || !end_time) {
      return NextResponse.json(
        { error: 'Missing required booking fields (room, title, start_time, end_time)' },
        { status: 400 }
      )
    }

    // 1. Validate business rules (working hours, weekends, past dates)
    const validation = validateBooking(start_time, end_time)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // 2. Overlap check for the requested room
    const { data: existingBookings, error: overlapError } = await supabase
      .from('reservations')
      .select('id, start_time, end_time')
      .eq('room_id', room_id)
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (overlapError) {
      console.error('Error checking overlap:', overlapError.message)
    } else if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing reservation in this room.' },
        { status: 409 }
      )
    }

    // 3. Insert reservation
    const { data, error } = await supabase
      .from('reservations')
      .insert([
        {
          room_id,
          user_id: user.id,
          title: title.trim(),
          notes: notes?.trim() || '',
          start_time,
          end_time,
        },
      ])
      .select('*, room:rooms(*), profile:profiles(*)')
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
