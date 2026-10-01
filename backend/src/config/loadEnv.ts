// Loads backend/.env by path (not the current directory), so `npm run dev`, `npm --prefix backend …`
// and `node backend/dist/server.js` all read the same file. Works from src/config and dist/config.
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const ENV_PATH = fileURLToPath(new URL('../../.env', import.meta.url));
dotenv.config({ path: ENV_PATH, quiet: true });
