import { prisma } from '@/lib/prisma'

export const findAccountByPhone = (phone: string) => {
  return prisma.user.findUnique({ where: { phone }, include: { account: true } })
}
