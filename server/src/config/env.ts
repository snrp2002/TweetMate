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

  /**
   * Cloudinary. Entirely optional: when unset, images are stored inline as
   * base64 exactly as before, so the app runs unchanged without credentials.
   */
  cloudinary: {
    cloudName: process.env['CLOUDINARY_CLOUD_NAME'] ?? '',
    apiKey: process.env['CLOUDINARY_API_KEY'] ?? '',
    apiSecret: process.env['CLOUDINARY_API_SECRET'] ?? '',
  },

  /**
   * Transactional email, for password resets. Optional: without it the reset
   * routes report that they are unavailable instead of failing obscurely.
   */
  mail: {
    apiKey: process.env['BREVO_API_KEY'] ?? '',
    /** A sender address verified in Brevo. No domain needed. */
    from: process.env['MAIL_FROM'] ?? '',
    fromName: process.env['MAIL_FROM_NAME'] ?? 'TweetMate',
    /** Overridable so tests can point at a local stub instead of the network. */
    apiUrl: process.env['MAIL_API_URL'] ?? 'https://api.brevo.com/v3/smtp/email',
  },

  /** Where reset links point. Must be the deployed client origin. */
  clientUrl: (process.env['CLIENT_URL'] ?? 'http://localhost:3000').replace(/\/+$/, ''),
} as const;
