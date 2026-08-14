import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import classes from './ErrorPage.module.css';

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} — ${error.statusText}`;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

export default function ErrorPage() {
  // Renders the message, never the raw Error object — React cannot render an
  // Error as a child, which used to make the boundary itself throw.
  const error = useRouteError();

  return (
    <div className={classes.page}>
      <h1 className={classes.title}>Something went wrong</h1>
      <p className={classes.detail}>{describe(error)}</p>
      <Link to="/" className={classes.home}>
        Back to feed
      </Link>
    </div>
  );
}
