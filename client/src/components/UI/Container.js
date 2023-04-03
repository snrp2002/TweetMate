import classes from './Container.module.css';
const Container = (props) => {
    return (
        <div className={`${props.className} ${classes.container}`}>
            {props.children}
        </div>
    )
}
export default Container;