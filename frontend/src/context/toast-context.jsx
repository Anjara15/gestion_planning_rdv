import { createContext } from "react";

export const ToastContext = createContext({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});