import { Loader2 } from "lucide-react";

export default function Spinner({ size = 24, label }: { size?: number; label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
      <Loader2 size={size} className="animate-spin" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}
