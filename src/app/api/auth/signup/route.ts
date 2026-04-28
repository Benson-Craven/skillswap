import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

interface SignupRequestBody {
  email?: string
  password?: string
  fullName?: string
}

const findExistingUserByEmail = async (email: string) => {
  const adminClient = createAdminClient()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw error
    }

    const existingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    )

    if (existingUser) {
      return existingUser
    }

    if (data.users.length < perPage) {
      return null
    }

    page += 1
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SignupRequestBody
    const email = body.email?.trim().toLowerCase()
    const password = body.password
    const fullName = body.fullName?.trim()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required.' },
        { status: 400 }
      )
    }

    const existingUser = await findExistingUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 409 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !anonKey) {
      throw new Error('Supabase client environment variables are not configured.')
    }

    const supabase = createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      requiresEmailConfirmation: Boolean(data.user && !data.user.email_confirmed_at),
    })
  } catch (error) {
    console.error('Signup route error:', error)

    return NextResponse.json(
      { error: 'Unable to create account right now. Please try again.' },
      { status: 500 }
    )
  }
}

