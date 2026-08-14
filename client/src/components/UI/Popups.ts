import Swal from 'sweetalert2';
import classes from './Popups.module.css';

export const Confirm = Swal.mixin({
  showDenyButton: true,
  confirmButtonText: 'Yes',
  width: '300px',
  background: '#3a3b3c',
  color: '#fff',
  customClass: {
    popup: classes.confirm ?? '',
    title: classes.confirmTitle ?? '',
    actions: classes.confirmActions ?? '',
    icon: classes.confirmIcon ?? '',
  },
});

export const Notification = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  width: 'fit-content',
  padding: '10px',
  background: '#3a3b3c',
  color: 'white',
  customClass: {
    popup: classes.notification ?? '',
    timerProgressBar: classes.notificationTimerProgressBar ?? '',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export function notifySuccess(text: string): void {
  void Notification.fire({ icon: 'success', text });
}

export function notifyError(text: string): void {
  void Notification.fire({ icon: 'error', text });
}

export function notifyWarning(text: string): void {
  void Notification.fire({ icon: 'warning', text });
}

export async function confirmAction(title: string): Promise<boolean> {
  const result = await Confirm.fire({
    icon: 'question',
    title: `<h5 style="margin: 0;">${title}</h5>`,
  });
  return result.isConfirmed;
}
