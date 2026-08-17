export function serializePrisma(value: any): any {
  if (value === null || value === undefined) return value

  // Decimal from Prisma has toNumber
  if (typeof value === 'object' && typeof (value as any).toNumber === 'function') {
    try {
      return (value as any).toNumber()
    } catch {
      // fallback to string representation
      return String(value)
    }
  }

  if (Array.isArray(value)) return value.map(serializePrisma)

  if (value instanceof Date) return value.toISOString()

  if (typeof value === 'object') {
    const out: any = {}
    for (const k of Object.keys(value)) {
      out[k] = serializePrisma((value as any)[k])
    }
    return out
  }

  return value
}
