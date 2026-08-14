import { Link } from 'react-router-dom';
import classes from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={classes.page}>
      <p className={classes.code}>404</p>
      <h1 className={classes.title}>
        This page doesn&rsquo;t <i>exist</i>
      </h1>
      <p className={classes.text}>
        The link may be broken, or the post may have been deleted.
      </p>
      <Link to="/" className={classes.home}>
        Back to feed
      </Link>
    </div>
  );
}
