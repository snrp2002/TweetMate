import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import classes from '../components/Auth/AuthForm.module.css';
import page from './ResetPasswordPage.module.css';
import { Button } from '../components/UI/Form/Button';
import Input from '../components/UI/Form/Input';
import Loader from '../components/UI/Loader';
import { notifySuccess } from '../components/UI/Popups';
import { useAuth } from '../auth/AuthContext';
import { resetPassword } from '../api/auth';
import { toErrorMessage } from '../api/client';

/**
 * Lands here from the emailed link, which carries the token and the address.
 *
 * A successful reset returns a session, so the user is signed in immediately
 * rather than being bounced back to a login form.
 */
export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { applySession } = useAuth();

  const token = params.get('token') ?? '';
  const email = params.get('email') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkIsUsable = token !== '' && email !== '';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Use at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Those passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      applySession(await resetPassword({ token, email, password, confirmPassword }));
      notifySuccess('Password updated');
      void navigate('/');
    } catch (resetError) {
      setError(toErrorMessage(resetError, 'Could not reset your password.'));
    } finally {
      setBusy(false);
    }
  };

  if (busy) return <Loader label="Updating your password" />;

  return (
    <div className={page.wrap}>
      <div className={page.panel}>
        <h1 className={page.title}>
          Choose a <i>new password</i>
        </h1>

        {linkIsUsable ? (
          <>
            <p className={page.text}>
              For <b>{email}</b>
            </p>

            <form onSubmit={handleSubmit}>
              <Input>
                <label htmlFor="newPassword">New password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
              </Input>

              <Input>
                <label htmlFor="confirmNewPassword">Confirm password</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  required
                />
              </Input>

              {error && (
                <p role="alert" className={classes.error}>
                  {error}
                </p>
              )}

              <div className={classes.submit}>
                <Button type="submit">Update password</Button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className={page.text}>
              That link is missing something. Request a fresh one — reset links expire after 30
              minutes and can only be used once.
            </p>
            <div className={classes.submit}>
              <Button type="button" onClick={() => void navigate('/auth')}>
                Back to sign in
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
