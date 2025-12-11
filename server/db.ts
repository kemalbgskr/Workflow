import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as schema from "@shared/schema";
import 'dotenv/config';

// Use PGlite for local postgres without installation
// Data stored in .pglite folder
const client = new PGlite('./.pglite');

export const db = drizzle(client, { schema });