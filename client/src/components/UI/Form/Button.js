import classes from './Button.module.css';
export const Button = (props) => {
    return( 
        <button type={props.type} onClick={props.onClick} className={classes.buttonNormal}>
            {props.children}
        </button>
    );
}
export const ButtonAlt = (props) => {
    return (
        <button type={props.type} onClick={props.onClick} className={classes.buttonAlt}>
            {props.children}
        </button>
    );
}