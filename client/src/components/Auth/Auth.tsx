import classes from './Auth.module.css';
import AuthForm from './AuthForm';

export default function Auth() {
  return (
    <div className={classes.auth}>
      <AuthForm />
    </div>
  );
}
