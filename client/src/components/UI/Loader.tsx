import classes from './Loader.module.css';

export default function Loader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className={classes.loader} role="status" aria-live="polite">
      <div className={classes.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className={classes.label}>{label}</p>
    </div>
  );
}
