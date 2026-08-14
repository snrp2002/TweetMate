import classes from './Loader.module.css';
import loaderImage from '../../images/loader.gif';

export default function Loader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className={classes.loader}>
      <img src={loaderImage} alt="" />
      <p>{label}</p>
    </div>
  );
}
