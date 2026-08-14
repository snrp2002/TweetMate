import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import classes from './AuthForm.module.css';
import GoogleSignInButton from './GoogleSignInButton';
import { Button } from '../UI/Form/Button';
import Input from '../UI/Form/Input';
import Loader from '../UI/Loader';
import { notifyError, notifySuccess } from '../UI/Popups';
import { useAuth } from '../../auth/AuthContext';
import { toErrorMessage } from '../../api/client';
import { config } from '../../config';
import type { GoogleAuthInput } from '../../types/api';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type FormData = typeof EMPTY_FORM;

const LABELS: Record<keyof FormData, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  password: 'password',
  confirmPassword: 'password confirmation',
};

export default function AuthForm() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const setMode = (next: boolean) => {
    if (next === isSignUp) return;
    setIsSignUp(next);
    setFormData(EMPTY_FORM);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((data) => ({ ...data, [name]: value }));
  };

  const finish = (message: string) => {
    notifySuccess(message);
    void navigate('/');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed: FormData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    };

    if (isSignUp) {
      for (const key of Object.keys(trimmed) as (keyof FormData)[]) {
        if (trimmed[key].trim() === '') {
          notifyError(`Enter your ${LABELS[key]}`);
          return;
        }
      }
      if (trimmed.password !== trimmed.confirmPassword) {
        notifyError('Those passwords do not match');
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignUp) {
        await signUp(trimmed);
        finish('Welcome to TweetMate');
      } else {
        await signIn({ email: trimmed.email, password: trimmed.password });
        finish('Welcome back');
      }
      setFormData(EMPTY_FORM);
    } catch (error) {
      notifyError(toErrorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const googleAuthenticate = async (input: GoogleAuthInput) => {
    if (isSignUp) {
      await signUp(input);
      finish('Welcome to TweetMate');
    } else {
      await signIn(input);
      finish('Welcome back');
    }
  };

  if (busy) return <Loader label={isSignUp ? 'Creating your account' : 'Signing you in'} />;

  return (
    <div>
      <div className={classes.tabs} role="tablist" aria-label="Authentication mode">
        <button
          type="button"
          role="tab"
          aria-selected={!isSignUp}
          className={`${classes.tab} ${!isSignUp ? classes.tabOn : ''}`}
          onClick={() => setMode(false)}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignUp}
          className={`${classes.tab} ${isSignUp ? classes.tabOn : ''}`}
          onClick={() => setMode(true)}
        >
          Create account
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <div className={classes.pair}>
            <Input>
              <label htmlFor="firstName">First name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                autoComplete="given-name"
                required
              />
            </Input>
            <Input>
              <label htmlFor="lastName">Last name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                autoComplete="family-name"
                required
              />
            </Input>
          </div>
        )}

        <Input>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Input>

        <Input>
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholder="••••••••"
            required
          />
        </Input>

        {isSignUp && (
          <Input>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="••••••••"
              required
            />
          </Input>
        )}

        <div className={classes.submit}>
          <Button type="submit">{isSignUp ? 'Create account' : 'Sign in'}</Button>
        </div>

        {config.googleClientId ? (
          <>
            <div className={classes.divider}>
              <span>or</span>
            </div>
            <GoogleSignInButton
              label={isSignUp ? 'Sign up with Google' : 'Continue with Google'}
              onAuthenticate={googleAuthenticate}
              onBusyChange={setBusy}
              onError={notifyError}
            />
          </>
        ) : null}
      </form>
    </div>
  );
}
