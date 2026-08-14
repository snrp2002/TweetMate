import { useGoogleLogin } from '@react-oauth/google';
import { ButtonAlt } from '../UI/Form/Button';
import { GoogleMark } from '../UI/Icon';
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
 *
 * The access token is handed straight to our API. The browser deliberately does
 * not read the Google profile itself: the server verifies the token with Google
 * and derives the identity, so a caller cannot simply claim an email address.
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
        await onAuthenticate({ google: true, accessToken: tokenResponse.access_token });
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
