import { prisma } from '@/lib/prisma'

export const getBalance = async (userId: string) => {
  const account = await prisma.account.findUnique({ where: { userId } })
  return account?.balance ?? null
}
