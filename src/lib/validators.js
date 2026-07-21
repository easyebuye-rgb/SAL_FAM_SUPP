import { z } from 'zod';

export const contributorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  notes: z.string().optional()
});

export const collectionSchema = z
  .object({
    contributorId: z.coerce.number({ invalid_type_error: 'Select a contributor' }).min(1, 'Select a contributor'),
    amount: z.coerce.number({ invalid_type_error: 'Enter an amount' }).positive('Amount must be greater than 0'),
    paymentDate: z.string().min(1, 'Payment date is required'),
    paymentTime: z.string().min(1, 'Payment time is required'),
    paymentMethod: z.enum(['Cash', 'Bank Transfer', 'UPI', 'Card', 'Other']),
    notes: z.string().optional(),
    startMonth: z.coerce.number().min(1).max(12),
    startYear: z.coerce.number().min(2000).max(2100),
    endMonth: z.coerce.number().min(1).max(12),
    endYear: z.coerce.number().min(2000).max(2100)
  })
  .refine((v) => v.endYear * 12 + v.endMonth >= v.startYear * 12 + v.startMonth, {
    message: 'End month must be the same as or after the start month',
    path: ['endMonth']
  });

export const transferSchema = z.object({
  amount: z.coerce.number({ invalid_type_error: 'Enter an amount' }).positive('Amount must be greater than 0'),
  transferDate: z.string().min(1, 'Transfer date is required'),
  transferTime: z.string().min(1, 'Transfer time is required'),
  method: z.enum(['Bank Transfer', 'Cash', 'UPI', 'Other']),
  notes: z.string().optional()
});

export const balanceAdjustmentSchema = z.object({
  label: z.string().min(2, 'Give this balance a short label'),
  amount: z.coerce.number({ invalid_type_error: 'Enter an amount' }),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional()
});

export const settingsSchema = z.object({
  appName: z.string().min(1),
  currency: z.string().min(1),
  sessionTimeoutMinutes: z.coerce.number().min(5).max(240)
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm the new password')
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
