import { useGoogleLogin } from '@react-oauth/google';
import { ButtonAlt } from '../UI/Form/Button';
import { GoogleMark } from '../UI/Icon';
import { fetchGoogleProfile } from '../../api/auth';
import { toErrorMessage } from '../../api/client';
import type { GoogleAuthInput } from '../../types/api';

interface GoogleSignInButtonProps {
  label: string;
  onAuthenticate: (input: GoogleAuthInput) => Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onError: (message: string) => void;
}

/**
 * Isolated so `useGoogleLogin` only ever runs when a client ID is configured —
 * Google's script throws "Missing required parameter client_id" on mount
 * otherwise, which would take down the whole auth page.
 */
export default function GoogleSignInButton({
  label,
  onAuthenticate,
  onBusyChange,
  onError,
}: GoogleSignInButtonProps) {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      onBusyChange(true);
      try {
        const profile = await fetchGoogleProfile(tokenResponse.access_token);
        if (!profile.email_verified) {
          onError('That Google account is not verified.');
          return;
        }
        await onAuthenticate({
          google: true,
          email: profile.email,
          name: profile.name,
          ...(profile.picture ? { image: profile.picture } : {}),
        });
      } catch (error) {
        onError(toErrorMessage(error));
      } finally {
        onBusyChange(false);
      }
    },
    onError: () => onError('Google sign-in was cancelled.'),
  });

  return (
    <ButtonAlt type="button" onClick={() => login()}>
      <GoogleMark size={15} />
      {label}
    </ButtonAlt>
  );
}
