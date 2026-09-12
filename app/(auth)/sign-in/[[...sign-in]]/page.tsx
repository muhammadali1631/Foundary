import { SignIn } from '@clerk/nextjs'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: "Sign in",
  robots: {
    index: false,
    follow: false,
  },
}

const SignInPage = () => {
  return (
    <SignIn/>
  )
}

export default SignInPage