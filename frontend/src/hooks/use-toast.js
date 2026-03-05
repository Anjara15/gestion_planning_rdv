import { useContext } from "react";
import { ToastContext } from "@/context/toast-context";

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a Toaster provider");
  }

  const { addToast } = context;

  const success = (message, title = "Succès") => {
    addToast({
      title,
      description: message,
      variant: "default",
    });
  };

  const error = (message, title = "Erreur") => {
    addToast({
      title,
      description: message,
      variant: "destructive",
    });
  };

  const warning = (message, title = "Attention") => {
    addToast({
      title,
      description: message,
      variant: "default",
    });
  };

  const info = (message, title = "Information") => {
    addToast({
      title,
      description: message,
      variant: "default",
    });
  };

  return {
    ...context,
    success,
    error,
    warning,
    info,
  };
}
