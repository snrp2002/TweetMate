import Swal from "sweetalert2";
import classes from "./Popups.module.css";
export const Confirm = Swal.mixin({
  showDenyButton: true,
  confirmButtonText: "Yes",
  width: "300px",
  background: "#3a3b3c",
  color: "#fff",
  customClass: {
    popup: classes.confirm,
    title: classes.confirmTitle,
    actions: classes.confirmActions,
    icon: classes.confirmIcon
  },
});
export const Notification = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: "fit-content",
  padding: "10px",
  background: "#3a3b3c",
  customClass: {
    popup: classes.notification,
    timerProgressBar: classes.notificationTimerProgressBar
  },
  color: "white",
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});
