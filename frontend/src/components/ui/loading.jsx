import React from "react";
import { Loader2 } from "lucide-react";

const Loading = ({ message = "Chargement..." }) => {
  return (
    <div className="flex items-center justify-center p-6">
      <Loader2 className="animate-spin w-6 h-6 mr-3 text-blue-600" />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  );
};

export default Loading;
