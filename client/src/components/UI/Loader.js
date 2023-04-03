import React from "react";
import classes from "./Loader.module.css";

export default function Loader() {
  return (
    <div className={classes["spinner-container"]}>
      <div className={classes["loading-spinner"]}>
      </div>
    </div>
  );
}