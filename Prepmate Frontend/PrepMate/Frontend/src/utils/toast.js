export const APP_TOAST_EVENT = 'prepmate:toast';

export const showToast = ({
  message,
  title = 'Saved',
  type = 'success',
  duration = 2600,
} = {}) => {
  if (!message) return;

  window.dispatchEvent(
    new CustomEvent(APP_TOAST_EVENT, {
      detail: { title, message, type, duration },
    })
  );
};
