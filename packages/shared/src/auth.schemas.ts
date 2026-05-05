import { z } from 'zod'

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/

// Register Schema
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email must be at most 255 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(USERNAME_REGEX, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      PASSWORD_REGEX,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
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
