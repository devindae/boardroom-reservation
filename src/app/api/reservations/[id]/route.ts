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
    const { room_id, title, notes, division, contact_number, start_time, end_time } = body

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

    // Check ownership for notifications
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('user_id, title')
      .eq('id', id)
      .single()

    if (existingReservation && existingReservation.user_id !== user.id) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      
      const adminName = adminProfile?.name || 'Administrator'
      
      await supabase.from('notifications').insert({
        user_id: existingReservation.user_id,
        message: `Admin ${adminName} modified your booking '${existingReservation.title}'.`,
      })
    }

    const { data, error } = await supabase
      .from('reservations')
      .update({
        room_id,
        title: title.trim(),
        notes: notes?.trim() || '',
        division: division?.trim() || '',
        contact_number: contact_number?.trim() || '',
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

    // Check ownership for notifications
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('user_id, title')
      .eq('id', id)
      .single()

    if (existingReservation && existingReservation.user_id !== user.id) {
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      
      const adminName = adminProfile?.name || 'Administrator'
      
      await supabase.from('notifications').insert({
        user_id: existingReservation.user_id,
        message: `Admin ${adminName} cancelled your booking '${existingReservation.title}'.`,
      })
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
