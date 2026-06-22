import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  loading?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#C0E6BA] p-6">
      <div className="w-10 h-10 bg-[#EAF9E7] rounded-lg flex items-center justify-center mb-4">
        <Icon className="w-5 h-5 text-[#4CA771]" />
      </div>
      {loading ? (
        <div className="h-9 w-14 bg-[#EAF9E7] rounded-md animate-pulse mb-1" />
      ) : (
        <p className="text-3xl font-semibold text-[#013237]">{value}</p>
      )}
      <p className="text-sm text-[#013237]/50 mt-1">{label}</p>
    </div>
  );
}
