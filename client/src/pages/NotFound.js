import { Link } from 'react-router-dom';
import NotFoundImage from '../images/404Image2.svg';
import classes from './NotFound.module.css';
const NotFound = () => {
    return (
    <div className={classes.notFound}>
        <img src={NotFoundImage} alt='404NotFound'/>
        <div className={classes.text}>
            <h1>Oops!</h1>
            <h2>Look like you're lost</h2>
            <h5>The page you are looking for is not available!</h5>
            <Link to='/' className={classes.home}>Go to Home</Link>
        </div>
    </div>)
}
export default NotFound;