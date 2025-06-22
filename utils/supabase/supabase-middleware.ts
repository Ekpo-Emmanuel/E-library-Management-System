import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // console.log('Middleware - Current path:', request.nextUrl.pathname)
  // console.log('Middleware - User exists:', !!user)
  // if (user) {
  //   console.log('Middleware - User email:', user.email)
  //   console.log('Middleware - Email confirmed:', !!user.email_confirmed_at)
  // }

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth/signin') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/signin'
    return NextResponse.redirect(url)
  }

  // If user is signed in but email is not verified and trying to access protected routes
  if (user && !user.email_confirmed_at && !request.nextUrl.pathname.startsWith('/auth/verify-email')) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/verify-email'
    return NextResponse.redirect(url)
  }

  // If user is signed in and the current path is /auth/* (except verify-email), redirect to /dashboard
  if (user && request.nextUrl.pathname.startsWith('/auth') && !request.nextUrl.pathname.startsWith('/auth/verify-email')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}