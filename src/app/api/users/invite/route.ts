import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isValidCompanyEmail } from '@/lib/validation'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only Super Admins can invite users' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role = 'user', name = '' } = body

    if (!['user', 'admin', 'super_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role specified' }, { status: 400 })
    }

    const cleanEmail = email?.trim().toLowerCase()

    if (!cleanEmail || !isValidCompanyEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Valid company email address (@cba.lk) is required' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Send invitation email via Supabase Auth Admin API
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        data: { full_name: name },
        redirectTo: `${new URL(request.url).origin}/auth/callback`,
      }
    )

    if (inviteError) {
      // Fallback: If user already exists or auth admin is not configured, insert profile row
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          [
            {
              email: cleanEmail,
              name: name || cleanEmail.split('@')[0],
              role: role,
            },
          ],
          { onConflict: 'email' }
        )
        .select()
        .single()

      if (profileError) {
        return NextResponse.json({ error: inviteError.message }, { status: 400 })
      }

      return NextResponse.json({
        message: 'User pre-registered in profile directory',
        user: profileData,
      })
    }

    return NextResponse.json({
      message: 'Invitation magic link sent to user email',
      user: inviteData.user,
    })
  } catch (e: unknown) {
    const errMsg = e instanceof Error ? e.message : 'Internal Server Error'
    return NextResponse.json({ error: errMsg }, { status: 500 })
  }
}
