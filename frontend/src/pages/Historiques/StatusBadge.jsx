import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, Calendar } from "lucide-react";

export const StatusBadge = ({ status }) => {
  const config = {
    confirmed: {
      label: "Confirmé",
      icon: CheckCircle,
      className: "bg-medical-green text-success-foreground hover:bg-medical-green/80"
    },
    pending: {
      label: "En attente",
      icon: Clock,
      className: "bg-medical-orange text-warning-foreground hover:bg-medical-orange/80"
    },
    cancelled: {
      label: "Annulé",
      icon: XCircle,
      className: "bg-medical-red text-destructive-foreground hover:bg-medical-red/80"
    },
    completed: {
      label: "Terminé",
      icon: Calendar,
      className: "bg-primary-light text-primary border-primary/20"
    }
  };

  const { label, icon: Icon, className } = config[status] || {};

  return (
    <Badge className={`${className} flex items-center gap-1 px-3 py-1 text-xs font-medium transition-all duration-200`}>
      {Icon && <Icon className="h-3 w-3" />}
      {label || "Inconnu"}
    </Badge>
  );
};
