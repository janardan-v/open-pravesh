import {
  integer,
  pgTable,
  varchar,
  text,
  date,
  uuid,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: text().notNull(),
  dateOfBirth: date("date_of_birth"),
  phoneNumber: text("phone_number"),
});

export const clientsTable = pgTable("clients", {
  id: uuid().primaryKey().defaultRandom(),
  clientName: varchar("cleint_name", { length: 255 }).notNull(),
  clientSecret: text("client_secret").notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: text().notNull(),
  redirectUri:text("redirect_uri").notNull(),
  hostedUri:text("hosted_uri")
});
