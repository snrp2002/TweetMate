import React from "react";
import classes from "./Loader.module.css";
import loaderImage from "../../images/loader.gif"
export default function Loader() {
  return (
    <div className={classes.loader}>
      <img src={loaderImage} alt="loader" width='100px'/>
      <p>Loading...</p>
    </div>
  );
}