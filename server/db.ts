import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import 'dotenv/config';

// Use standard SQLite via better-sqlite3 (native binding)
// This is much more stable than PGlite for local environment on Windows
const sqlite = new Database('sqlite.db');

export const db = drizzle(sqlite, { schema });