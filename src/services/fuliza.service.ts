import { prisma } from '@/lib/prisma'

export const getFuliza = (userId: string) => {
  return prisma.fuliza.findUnique({ where: { userId } })
}
