"use client";

import { User, Mail, Calendar } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initial = user.name.charAt(0).toUpperCase();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#013237]">Profile</h1>
        <p className="text-[#013237]/60 mt-1 text-sm">Your account information.</p>
      </div>

      <div className="max-w-lg">
        <div className="bg-white rounded-xl border border-[#C0E6BA] p-8">
          {/* Avatar + name */}
          <div className="flex items-center gap-5 mb-8 pb-8 border-b border-[#EAF9E7]">
            <div className="w-16 h-16 bg-[#4CA771] rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0">
              {initial}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#013237]">{user.name}</h2>
              <p className="text-[#013237]/50 text-sm mt-0.5">Student</p>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <InfoRow
              icon={User}
              label="Full Name"
              value={user.name}
            />
            <InfoRow
              icon={Mail}
              label="Email Address"
              value={user.email}
            />
            <InfoRow
              icon={Calendar}
              label="Member Since"
              value={formatDate(user.created_at)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[#EAF9E7] rounded-lg">
      <div className="w-9 h-9 bg-[#C0E6BA] rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-[#4CA771]" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#013237]/50 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-[#013237]">{value}</p>
      </div>
    </div>
  );
}
