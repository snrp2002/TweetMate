import { useState, type FormEvent } from 'react';
import classes from './AuthForm.module.css';
import { Button } from '../UI/Form/Button';
import Input from '../UI/Form/Input';
import { forgotPassword } from '../../api/auth';
import { toErrorMessage } from '../../api/client';

/**
 * Requests a reset link.
 *
 * The success copy is deliberately vague about whether the address exists —
 * the server answers the same way for both, and the UI must not undo that by
 * being more specific.
 */
export default function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (email.trim() === '') return;

    setBusy(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(toErrorMessage(requestError, 'Could not send the reset link.'));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <div>
        <h2 className={classes.asideTitle}>Check your inbox</h2>
        <p className={classes.asideText}>
          If <b>{email.trim()}</b> has an account, a reset link is on its way. It expires in 30
          minutes.
        </p>
        <div className={classes.submit}>
          <Button type="button" onClick={onBack}>
            Back to sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className={classes.asideTitle}>Reset your password</h2>
      <p className={classes.asideText}>
        Enter the address you signed up with and we&rsquo;ll send you a link.
      </p>

      <form onSubmit={handleSubmit}>
        <Input>
          <label htmlFor="forgotEmail">Email</label>
          <input
            type="email"
            id="forgotEmail"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Input>

        {error && (
          <p role="alert" className={classes.error}>
            {error}
          </p>
        )}

        <div className={classes.submit}>
          <Button type="submit" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </div>
      </form>

      <button type="button" className={classes.linkButton} onClick={onBack}>
        Back to sign in
      </button>
    </div>
  );
}
