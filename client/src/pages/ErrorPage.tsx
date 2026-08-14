import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom';

function describe(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} — ${error.statusText}`;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'An unexpected error occurred.';
}

export default function ErrorPage() {
  // The previous version rendered the raw error object, which React cannot
  // render as a child — so the error boundary itself threw.
  const error = useRouteError();

  return (
    <div style={{ padding: '2rem', color: 'white', textAlign: 'center' }}>
      <h1>Something went wrong</h1>
      <p>{describe(error)}</p>
      <Link to="/">Go to Home</Link>
    </div>
  );
}
