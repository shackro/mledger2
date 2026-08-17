import { prisma } from '@/lib/prisma'

export const listTransactions = async (userId: string) => {
  return prisma.transaction.findMany({
    where: {
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
    orderBy: { createdAt: 'desc' },
  })
}
