import classes from "./Modal.module.css";
export const Modal = (props) => {
  return (
    <div className={`${classes.modal} ${props.className}`}>
      {props.children}
    </div>
  );
};
export const Overlay = (props) => {
  const overlayClickHandler = () => {
    props.setShowModal(false);
  };
  return <div className={`${classes.overlay} ${props.className}`} onClick={overlayClickHandler}></div>;
};
