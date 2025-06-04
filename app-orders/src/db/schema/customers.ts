import { date, pgTable, text, timestamp } from 'drizzle-orm/pg-core'


export const customers = pgTable('customers', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  address: text().notNull(),
  state: text().notNull(),
  zipCode: text().notNull(),
  country: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  dateOfBirth: date({ mode: 'date' }).notNull(),
})