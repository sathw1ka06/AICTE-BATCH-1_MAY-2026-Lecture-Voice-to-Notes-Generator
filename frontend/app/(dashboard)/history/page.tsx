"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, FileAudio, Upload } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { Lecture } from "@/types";

const STATUS_STYLES: Record<string, string> = {
  Uploaded: "bg-blue-50 text-blue-700 border border-blue-200",
  Transcribing: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  "Generating Notes": "bg-purple-50 text-purple-700 border border-purple-200",
  "Generating Flashcards": "bg-orange-50 text-orange-700 border border-orange-200",
  "Generating Quiz": "bg-pink-50 text-pink-700 border border-pink-200",
  Completed: "bg-green-50 text-green-700 border border-green-200",
  Failed: "bg-red-50 text-red-700 border border-red-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Lecture[]>("/lecture/history")
      .then(setLectures)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#013237]">
            Lecture History
          </h1>
          <p className="text-[#013237]/60 mt-1 text-sm">
            All your uploaded lectures and their processing status.
          </p>
        </div>
        <Link
          href="/upload"
          className="flex items-center gap-2 px-4 py-2 bg-[#4CA771] text-white rounded-lg text-sm font-medium hover:bg-[#3d8f5f] transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#C0E6BA] overflow-hidden">
        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-2 border-[#4CA771] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-600 text-sm">{error}</div>
        ) : lectures.length === 0 ? (
          <div className="p-16 text-center">
            <FileAudio className="w-12 h-12 text-[#C0E6BA] mx-auto mb-4" />
            <h3 className="text-base font-medium text-[#013237]">
              No lectures yet
            </h3>
            <p className="text-[#013237]/60 mt-2 text-sm">
              Upload your first lecture to see it here.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[#EAF9E7] border-b border-[#C0E6BA]">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#013237]/50 uppercase tracking-wider">
                  Lecture Name
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#013237]/50 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#013237]/50 uppercase tracking-wider">
                  Duration
                </th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-[#013237]/50 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAF9E7]">
              {lectures.map((lecture) => (
                <tr
                  key={lecture.id}
                  className="hover:bg-[#EAF9E7]/60 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#EAF9E7] rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileAudio className="w-4 h-4 text-[#4CA771]" />
                      </div>
                      <span className="text-sm font-medium text-[#013237]">
                        {lecture.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#013237]/60">
                    {formatDate(lecture.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#013237]/60">
                    {lecture.duration ? (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {lecture.duration}
                      </span>
                    ) : (
                      <span className="text-[#013237]/30">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLES[lecture.status] ??
                        "bg-gray-50 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {lecture.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
