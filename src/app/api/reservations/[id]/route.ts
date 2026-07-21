import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateBooking } from '@/lib/validation'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { room_id, title, notes, start_time, end_time } = body

    // Validate business rules
    const validation = validateBooking(start_time, end_time)
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Overlap check excluding current reservation id
    const { data: existingBookings } = await supabase
      .from('reservations')
      .select('id')
      .eq('room_id', room_id)
      .neq('id', id)
      .lt('start_time', end_time)
      .gt('end_time', start_time)

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { error: 'This time slot overlaps with an existing reservation in this room.' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        room_id,
        title: title.trim(),
        notes: notes?.trim() || '',
        start_time,
        end_time,
      })
      .eq('id', id)
      .select('*, room:rooms(*), profile:profiles(*)')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase.from('reservations').delete().eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
