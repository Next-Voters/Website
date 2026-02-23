import { Generated, Selectable, Insertable, Updateable } from 'kysely'

export interface Database {
  chat_count: ChatCountTable,
  admin_table: UserAdminTable,
  user_admin_request: UserAdminRequestTable,
  subscriptions: SubscriptionTable,
  user: UserTable,
  session: SessionTable,
  account: AccountTable,
  verification: VerificationTable
}

export interface UserTable {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  createdAt: Date
  updatedAt: Date
}

export interface SessionTable {
  id: string
  expiresAt: Date
  token: string
  createdAt: Date
  updatedAt: Date
  ipAddress: string | null
  userAgent: string | null
  userId: string
}

export interface AccountTable {
  id: string
  accountId: string
  providerId: string
  userId: string
  accessToken: string | null
  refreshToken: string | null
  idToken: string | null
  accessTokenExpiresAt: Date | null
  refreshTokenExpiresAt: Date | null
  scope: string | null
  password: string | null
  createdAt: Date
  updatedAt: Date
}

export interface VerificationTable {
  id: string
  identifier: string
  value: string
  expiresAt: Date
  createdAt: Date | null
  updatedAt: Date | null
}

export interface ChatCountTable {
  id: Generated<number>
  responses: number
  requests: number
}

export interface UserAdminTable {
  email: string
  name: string
}

export interface UserAdminRequestTable {
  email: string
  name: string
}

export interface SubscriptionTable {
  contact: string,
  topics: string[],
  type_contact: 'email' | 'sms'
}

export type ChatCount = Selectable<ChatCountTable>
export type NewChatCount = Insertable<ChatCountTable>
export type ChatCountUpdate = Updateable<ChatCountTable>

export type UserAdmin = Selectable<UserAdminTable>

export type NewUserAdmin = Insertable<UserAdminTable>