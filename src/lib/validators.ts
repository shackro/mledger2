import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().min(10).max(13),
  pin: z.string().length(4),
})

export const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.string().min(10).max(13),
  pin: z.string().length(4),
  nationalId: z.string().min(7),
})

export const sendMoneySchema = z.object({
  recipientPhone: z.string().min(10),
  amount: z.number().positive(),
  pin: z.string().length(4),
})

export const transactionSchema = z.object({
  amount: z.number().positive(),
  pin: z.string().length(4),
})
