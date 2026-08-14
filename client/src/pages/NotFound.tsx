import { Link } from 'react-router-dom';
import NotFoundImage from '../images/404Image2.svg';
import classes from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={classes.notFound}>
      <img src={NotFoundImage} alt="" />
      <div className={classes.text}>
        <h1>Oops!</h1>
        <h2>Look like you&apos;re lost</h2>
        <h5>The page you are looking for is not available!</h5>
        <Link to="/" className={classes.home}>
          Go to Home
        </Link>
      </div>
    </div>
  );
}
