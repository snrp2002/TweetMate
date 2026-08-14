import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. See server/.env.example.`,
    );
  }
  return value;
}

function optionalList(name: string): string[] | undefined {
  const raw = process.env[name];
  if (!raw) return undefined;
  const values = raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

export const env = {
  port: Number(process.env['PORT'] ?? 5000),
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  /**
   * Audience that Google access tokens must be issued for. Defaults to the
   * project's existing client ID so Google sign-in works with no extra config;
   * client IDs are public identifiers, not secrets.
   */
  googleClientId:
    process.env['GOOGLE_CLIENT_ID'] ??
    '895748341443-s8kp5gak0283dm129har14cgel95hdn2.apps.googleusercontent.com',
  /** Allowed browser origins. `undefined` means "reflect any origin". */
  corsOrigins: optionalList('CORS_ORIGINS'),
} as const;
