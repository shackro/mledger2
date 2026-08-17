import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().min(10).max(13),
  pin: z.string().length(4),
})

export const registerSchema = z.object({
  name: z.string().min(3),
  phone: z.preprocess((val) => (typeof val === 'number' ? String(val) : val), z.string().min(10).max(13)),
  pin: z.preprocess((val) => (typeof val === 'number' ? String(val).padStart(4, '0') : val), z.string().length(4)),
  nationalId: z.preprocess((val) => (typeof val === 'number' ? String(val) : val), z.string().min(7)),
  startingAmount: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val)
    return val
  }, z.number().min(0).optional()),
  fulizaLimit: z.preprocess((val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val)
    return val
  }, z.number().min(0).optional()),
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
