import { prisma } from '@/lib/prisma'

export const getMshwari = (userId: string) => {
  return prisma.mshwari.findUnique({ where: { userId } })
}
