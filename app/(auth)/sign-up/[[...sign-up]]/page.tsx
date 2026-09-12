import { SignUp } from '@clerk/nextjs'
import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: "Sign up",
  robots: {
    index: false,
    follow: false,
  },
}

const SignUpPage = () => {
  return (
    <SignUp/>
  )
}

export default SignUpPage