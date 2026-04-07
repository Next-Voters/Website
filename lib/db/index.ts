import { Kysely } from 'kysely'
import { NeonDialect } from 'kysely-neon'
import { neon } from '@neondatabase/serverless'
import { Database } from '@/types/database'

let _db: Kysely<Database> | null = null

export function getDb(): Kysely<Database> {
  if (!_db) {
    _db = new Kysely<Database>({
      dialect: new NeonDialect({
        neon: neon(process.env.DATABASE_URL as string),
      }),
    })
  }
  return _db
}

// Keep backward-compatible named export
export const db = new Proxy({} as Kysely<Database>, {
  get(_target, prop) {
    return getDb()[prop as keyof Kysely<Database>]
  },
})
