"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, FileText, Layers, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/api";
import type { Stats } from "@/types";
import StatCard from "@/components/dashboard/StatCard";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total_lectures: 0,
    total_notes: 0,
    total_flashcards: 0,
    total_quizzes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<Stats>("/user/stats")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#013237]">
          {greeting()}, {firstName}
        </h1>
        <p className="text-[#013237]/60 mt-1 text-sm">
          Here&apos;s an overview of your learning activity.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Lectures"
          value={stats.total_lectures}
          icon={BookOpen}
          loading={loading}
        />
        <StatCard
          label="Notes Generated"
          value={stats.total_notes}
          icon={FileText}
          loading={loading}
        />
        <StatCard
          label="Flashcard Sets"
          value={stats.total_flashcards}
          icon={Layers}
          loading={loading}
        />
        <StatCard
          label="Quizzes"
          value={stats.total_quizzes}
          icon={HelpCircle}
          loading={loading}
        />
      </div>

      {/* Empty state */}
      {!loading && stats.total_lectures === 0 && (
        <div className="mt-16 text-center">
          <div className="w-16 h-16 bg-[#C0E6BA] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-[#4CA771]" />
          </div>
          <h3 className="text-lg font-medium text-[#013237]">No lectures yet</h3>
          <p className="text-[#013237]/60 mt-2 text-sm">
            Upload your first lecture to get started.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center mt-6 px-5 py-2.5 bg-[#4CA771] text-white rounded-lg text-sm font-medium hover:bg-[#3d8f5f] transition-colors"
          >
            Upload Lecture
          </Link>
        </div>
      )}
    </div>
  );
}
