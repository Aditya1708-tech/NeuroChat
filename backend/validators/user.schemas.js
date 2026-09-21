import { z } from 'zod';

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2).max(60).optional(),
    settings: z
      .object({
        uiLanguage: z.enum(['en', 'hi']).optional(),
        replyLanguage: z.enum(['auto', 'en', 'hi']).optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        onboardingCompleted: z.boolean().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export const updatePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string({ required_error: 'New password is required.' })
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password cannot exceed 72 characters.')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter.')
    .regex(/\d/, 'Password must contain at least one number.'),
});
