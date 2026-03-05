import React from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

const EmptyState = ({ title = "Aucune donnée", description = "", actionLabel, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white/60 rounded-xl border border-gray-200">
      <Info className="w-8 h-8 text-muted-foreground mb-2" />
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      {description ? <p className="text-sm text-gray-500 mt-1">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
