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

const SIGN_UP_LABELS: Record<keyof FormData, string> = {
  firstName: 'first name',
  lastName: 'last name',
  email: 'email',
  password: 'password',
  confirmPassword: 'confirm password',
};

export default function AuthForm() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const toggleMode = () => {
    setIsSignUp((value) => !value);
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
          notifyError(`Enter valid ${SIGN_UP_LABELS[key]}!!`);
          return;
        }
      }
      if (trimmed.password !== trimmed.confirmPassword) {
        notifyError('Passwords do not match!!');
        return;
      }
    }

    setBusy(true);
    try {
      if (isSignUp) {
        await signUp(trimmed);
        finish('Signed up successfully!');
      } else {
        await signIn({ email: trimmed.email, password: trimmed.password });
        finish('Signed in successfully!');
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
      finish('Signed up successfully!');
    } else {
      await signIn(input);
      finish('Signed in successfully!');
    }
  };

  if (busy) return <Loader />;

  return (
    <div className={classes.authForm}>
      <form onSubmit={handleSubmit}>
        {isSignUp && (
          <>
            <div>
              <Input>
                <label htmlFor="firstName">First Name*</label>
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
                <label htmlFor="lastName">Last Name*</label>
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
            <Input>
              <label htmlFor="email">Email Id*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </Input>
            <Input>
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </Input>
            <Input>
              <label htmlFor="confirmPassword">Confirm Password*</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
            </Input>
          </>
        )}

        {!isSignUp && (
          <>
            <Input>
              <label htmlFor="email">Email Id*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </Input>
            <Input>
              <label htmlFor="password">Password*</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </Input>
          </>
        )}

        <div className={classes.action}>
          <Button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</Button>
        </div>
        <div className={classes.google}>
          {config.googleClientId ? (
            <GoogleSignInButton
              label={isSignUp ? 'Sign Up with Google' : 'Sign In with Google'}
              onAuthenticate={googleAuthenticate}
              onBusyChange={setBusy}
              onError={notifyError}
            />
          ) : null}
        </div>
        <div className={classes.switch} onClick={toggleMode}>
          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
        </div>
      </form>
    </div>
  );
}
