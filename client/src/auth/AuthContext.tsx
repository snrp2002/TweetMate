import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { signIn as signInRequest, signUp as signUpRequest } from '../api/auth';
import {
  clearStoredSession,
  millisecondsUntilExpiry,
  readStoredSession,
  writeStoredSession,
} from './storage';
import type {
  AuthUser,
  EmailSignInInput,
  EmailSignUpInput,
  GoogleAuthInput,
  Session,
} from '../types/api';

interface AuthContextValue {
  session: Session | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  signIn: (input: EmailSignInInput | GoogleAuthInput) => Promise<void>;
  signUp: (input: EmailSignUpInput | GoogleAuthInput) => Promise<void>;
  signOut: () => void;
  /** Adopts a session obtained outside sign-in — currently a password reset. */
  applySession: (session: Session) => void;
  /** Applied after a profile edit so the navbar avatar updates immediately. */
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  const persist = useCallback((next: Session) => {
    writeStoredSession(next);
    setSession(next);
  }, []);

  // Sign the user out the moment the token expires, rather than waiting for
  // the next request to notice.
  useEffect(() => {
    clearTimeout(timeoutRef.current);
    if (!session) return;

    const remaining = millisecondsUntilExpiry(session.token);
    if (remaining <= 0) {
      signOut();
      return;
    }
    timeoutRef.current = setTimeout(signOut, remaining);
    return () => clearTimeout(timeoutRef.current);
  }, [session, signOut]);

  // Keep tabs in sync when another tab signs in or out.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === 'user') setSession(readStoredSession());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      signIn: async (input) => persist(await signInRequest(input)),
      signUp: async (input) => persist(await signUpRequest(input)),
      signOut,
      applySession: persist,
      updateUser: (user) => {
        setSession((current) => {
          if (!current) return current;
          const next: Session = { ...current, user };
          writeStoredSession(next);
          return next;
        });
      },
    }),
    [session, persist, signOut],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
