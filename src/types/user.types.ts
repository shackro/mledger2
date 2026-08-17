export type UserRole = 'ADMIN' | 'USER' | 'AGENT' | 'MERCHANT'

export type User = {
  id: string
  phone: string
  name: string
  email?: string
}
