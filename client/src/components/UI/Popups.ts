import Swal from 'sweetalert2';
import classes from './Popups.module.css';

export const Confirm = Swal.mixin({
  showDenyButton: true,
  confirmButtonText: 'Confirm',
  denyButtonText: 'Cancel',
  width: '380px',
  background: '#16171b',
  color: '#edeae4',
  buttonsStyling: false,
  customClass: {
    popup: classes.confirm ?? '',
    title: classes.confirmTitle ?? '',
    actions: classes.confirmActions ?? '',
    confirmButton: classes.confirmButton ?? '',
    denyButton: classes.denyButton ?? '',
    icon: classes.confirmIcon ?? '',
  },
});

export const Notification = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3200,
  timerProgressBar: true,
  width: 'auto',
  background: '#16171b',
  color: '#edeae4',
  showClass: { popup: classes.toastIn ?? '' },
  customClass: {
    popup: classes.toast ?? '',
    title: classes.toastTitle ?? '',
    timerProgressBar: classes.toastBar ?? '',
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

export function notifySuccess(text: string): void {
  void Notification.fire({ title: text, iconHtml: '✓', customClass: { icon: classes.iconOk ?? '' } });
}

export function notifyError(text: string): void {
  void Notification.fire({ title: text, iconHtml: '!', customClass: { icon: classes.iconBad ?? '' } });
}

export function notifyWarning(text: string): void {
  void Notification.fire({ title: text, iconHtml: '!', customClass: { icon: classes.iconWarn ?? '' } });
}

export async function confirmAction(title: string): Promise<boolean> {
  const result = await Confirm.fire({ title });
  return result.isConfirmed;
}
