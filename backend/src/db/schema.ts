import { integer, pgTable, varchar,text, date } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: text().notNull(),
  dateOfBirth: date("date_of_birth"),
  phoneNumber: text("phone_number"),
});
