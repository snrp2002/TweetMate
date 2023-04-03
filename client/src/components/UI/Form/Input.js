import classes from './Input.module.css';
const Input = (props) => {
    return (
        <div className={classes.input}>
            {props.children}
        </div>
    )
}
export default Input;