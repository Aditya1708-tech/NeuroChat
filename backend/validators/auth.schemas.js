import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Full name is required.' })
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(60, 'Name cannot exceed 60 characters.'),
    email: z
      .string({ required_error: 'Email address is required.' })
      .trim()
      .toLowerCase()
      .email('Please enter a valid email address.')
      .max(254, 'Email is too long.'),
    password: z
      .string({ required_error: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters.')
      .max(72, 'Password cannot exceed 72 characters.')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
      .regex(/\d/, 'Password must contain at least one number.'),
    confirmPassword: z.string({ required_error: 'Please confirm your password.' }),
    rememberMe: z.boolean().optional().default(false),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address.')
    .max(254),
  password: z
    .string({ required_error: 'Password is required.' })
    .min(1, 'Password is required.')
    .max(72),
  rememberMe: z.boolean().optional().default(false),
});

export const googleAuthSchema = z.object({
  credential: z.union([
    z.string().min(5),
    z.record(z.any()),
  ], { required_error: 'Google credential is required.' }),
  rememberMe: z.boolean().optional().default(false),
});
