import { z } from 'zod'

export const loginSchema = z.object({
  phone: z.string().min(10).max(13),
  pin: z.string().length(4),
})

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  phone: z.string().min(10).max(13, "Invalid phone number"),
  pin: z.string().length(4, "PIN must be exactly 4 digits"),
  nationalId: z.string().min(7, "Invalid National ID"),
  
  // 👇 z.coerce automatically converts strings like "500" to numbers.
  // 👇 .default(0) ensures that if it's missing or invalid, it safely becomes 0 (NOT 1500).
  startingAmount: z.coerce.number().min(0, "Amount cannot be negative").default(0),
  fulizaLimit: z.coerce.number().min(0, "Limit cannot be negative").default(0),
})

export const sendMoneySchema = z.object({
  recipientPhone: z.string().min(10),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  pin: z.string().length(4),
})

export const transactionSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  pin: z.string().length(4),
})
