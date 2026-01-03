import { z } from 'zod'

// Register Schema
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
})

export type RegisterDto = z.infer<typeof RegisterSchema>

// Login Schema
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginDto = z.infer<typeof LoginSchema>

// JWT Payload
export interface JwtPayload {
  sub: string  // User ID
  email: string
  role: string
  iat?:  number
  exp?: number
}
