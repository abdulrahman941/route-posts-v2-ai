import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
}

export default function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
      <div className="mb-4 rounded-2xl bg-gray-100 p-5">
        <Icon size={28} />
      </div>
      <p className="font-semibold text-gray-600">{title}</p>
      {description && <p className="mt-1 text-sm">{description}</p>}
    </div>
  );
}
