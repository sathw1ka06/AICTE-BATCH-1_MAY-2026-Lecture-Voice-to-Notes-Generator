"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Layers,
  HelpCircle,
  Copy,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type {
  LectureDetail,
  Transcript,
  Notes,
  Flashcard,
  QuizQuestion,
} from "@/types";

// ── Constants ─────────────────────────────────────────────────────────────────

const TERMINAL = ["Completed", "Failed"];
const POLL_MS = 3000;

const PROGRESS_MAP: Record<string, number> = {
  Uploaded: 0,
  Transcribing: 25,
  "Generating Notes": 50,
  "Generating Flashcards": 70,
  "Generating Quiz": 85,
  Completed: 100,
  Failed: 0,
};

const TABS = [
  { id: "transcript", label: "Transcript", icon: FileText },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "quiz", label: "Quiz", icon: HelpCircle },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

function downloadText(text: string, filename: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Processing UI ─────────────────────────────────────────────────────────────

function ProcessingView({ lecture }: { lecture: LectureDetail }) {
  const progress = PROGRESS_MAP[lecture.status] ?? lecture.progress;
  const isFailed = lecture.status === "Failed";

  return (
    <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
      {isFailed ? (
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
      ) : (
        <div className="w-16 h-16 bg-[#C0E6BA] rounded-2xl flex items-center justify-center mb-6 relative">
          <BookOpen className="w-8 h-8 text-[#4CA771]" />
          <span className="absolute -right-1 -top-1 w-4 h-4 border-2 border-[#4CA771] border-t-transparent rounded-full animate-spin bg-white" />
        </div>
      )}

      <h2 className="text-xl font-semibold text-[#013237] mb-1">
        {isFailed ? "Processing Failed" : `${lecture.status}…`}
      </h2>

      {isFailed && lecture.error_message && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mt-3 max-w-lg text-left">
          <span className="font-medium">Reason: </span>
          {lecture.error_message}
        </p>
      )}

      {!isFailed && (
        <>
          <p className="text-[#013237]/50 text-sm mb-8">
            This may take a few minutes for longer recordings.
          </p>
          <div className="w-full max-w-md">
            <div className="flex justify-between text-xs text-[#013237]/50 mb-2">
              <span>{lecture.status}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-[#C0E6BA] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4CA771] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Transcript Tab ────────────────────────────────────────────────────────────

function TranscriptTab({ transcript }: { transcript: Transcript }) {
  const [query, setQuery] = useState("");

  const highlighted = query.trim()
    ? transcript.transcript_text.replace(
        new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
        '<mark class="bg-yellow-200 rounded">$1</mark>'
      )
    : null;

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-white border border-[#C0E6BA] rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-[#013237]/40 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search transcript…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm text-[#013237] placeholder-[#013237]/40 bg-transparent outline-none"
          />
        </div>
        <button
          onClick={() => copyText(transcript.transcript_text)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#013237]/70 hover:text-[#013237] border border-[#C0E6BA] bg-white rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy
        </button>
        <button
          onClick={() =>
            downloadText(transcript.transcript_text, "transcript.txt")
          }
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#013237]/70 hover:text-[#013237] border border-[#C0E6BA] bg-white rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          Download
        </button>
      </div>

      {/* Content */}
      <div className="bg-white border border-[#C0E6BA] rounded-xl p-6 max-h-[60vh] overflow-y-auto">
        {highlighted ? (
          <p
            className="text-sm text-[#013237] leading-relaxed whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        ) : (
          <p className="text-sm text-[#013237] leading-relaxed whitespace-pre-wrap">
            {transcript.transcript_text}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Notes Tab ─────────────────────────────────────────────────────────────────

function NotesTab({ notes }: { notes: Notes }) {
  const n = notes.notes_json;

  const toText = (): string => {
    const lines: string[] = [];
    if (n.overview) lines.push(`OVERVIEW\n${n.overview}`);
    if (n.key_concepts?.length) lines.push(`\nKEY CONCEPTS\n${n.key_concepts.map((c) => `• ${c}`).join("\n")}`);
    if (n.definitions?.length) lines.push(`\nDEFINITIONS\n${n.definitions.map((d) => `• ${d}`).join("\n")}`);
    if (n.important_points?.length) lines.push(`\nIMPORTANT POINTS\n${n.important_points.map((p) => `• ${p}`).join("\n")}`);
    if (n.exam_notes?.length) lines.push(`\nEXAM NOTES\n${n.exam_notes.map((e) => `• ${e}`).join("\n")}`);
    return lines.join("\n");
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => copyText(toText())}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#013237]/70 hover:text-[#013237] border border-[#C0E6BA] bg-white rounded-lg transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy Notes
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[#013237]/70 hover:text-[#013237] border border-[#C0E6BA] bg-white rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Sections */}
      <div id="notes-print" className="space-y-4">
        {n.overview && (
          <NoteSection title="Overview">
            <p className="text-sm text-[#013237] leading-relaxed">{n.overview}</p>
          </NoteSection>
        )}
        {n.key_concepts?.length > 0 && (
          <NoteSection title="Key Concepts">
            <ul className="space-y-1">
              {n.key_concepts.map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#013237]">
                  <span className="text-[#4CA771] mt-0.5 flex-shrink-0">•</span>
                  {c}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}
        {n.definitions?.length > 0 && (
          <NoteSection title="Definitions">
            <ul className="space-y-1">
              {n.definitions.map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#013237]">
                  <span className="text-[#4CA771] mt-0.5 flex-shrink-0">•</span>
                  {d}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}
        {n.important_points?.length > 0 && (
          <NoteSection title="Important Points">
            <ul className="space-y-1">
              {n.important_points.map((p, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#013237]">
                  <span className="text-[#4CA771] mt-0.5 flex-shrink-0">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}
        {n.exam_notes?.length > 0 && (
          <NoteSection title="Exam Notes" accent>
            <ul className="space-y-1">
              {n.exam_notes.map((e, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#013237]">
                  <span className="text-[#4CA771] mt-0.5 flex-shrink-0">★</span>
                  {e}
                </li>
              ))}
            </ul>
          </NoteSection>
        )}
      </div>
    </div>
  );
}

function NoteSection({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-5 ${
        accent ? "border-[#4CA771]/30 bg-[#EAF9E7]" : "border-[#C0E6BA]"
      }`}
    >
      <h3 className="text-xs font-semibold text-[#013237]/50 uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

// ── Flashcards Tab ────────────────────────────────────────────────────────────

function FlashcardsTab({ flashcards }: { flashcards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (flashcards.length === 0) {
    return <EmptyContent message="No flashcards available." />;
  }

  const card = flashcards[index];

  const prev = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.max(0, i - 1)), 150);
  };
  const next = () => {
    setFlipped(false);
    setTimeout(() => setIndex((i) => Math.min(flashcards.length - 1, i + 1)), 150);
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Progress */}
      <p className="text-sm text-[#013237]/50">
        {index + 1} / {flashcards.length}
      </p>

      {/* Flip card */}
      <div
        className="w-full max-w-lg cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped((f) => !f)}
      >
        <div
          className="relative w-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
            minHeight: "220px",
          }}
        >
          {/* Front – Question */}
          <div
            className="absolute inset-0 bg-white border-2 border-[#C0E6BA] rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-xs font-semibold text-[#013237]/30 uppercase tracking-wider mb-4">
              Question
            </p>
            <p className="text-base font-medium text-[#013237]">{card.question}</p>
            <p className="text-xs text-[#013237]/30 mt-6">Tap to reveal answer</p>
          </div>

          {/* Back – Answer */}
          <div
            className="absolute inset-0 bg-[#EAF9E7] border-2 border-[#4CA771] rounded-2xl p-8 flex flex-col items-center justify-center text-center"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-xs font-semibold text-[#4CA771] uppercase tracking-wider mb-4">
              Answer
            </p>
            <p className="text-base font-medium text-[#013237]">{card.answer}</p>
            <p className="text-xs text-[#013237]/30 mt-6">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="w-10 h-10 rounded-full border border-[#C0E6BA] bg-white flex items-center justify-center text-[#013237]/60 hover:text-[#013237] hover:border-[#4CA771] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-1.5">
          {flashcards.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setFlipped(false);
                setIndex(i);
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === index ? "bg-[#4CA771]" : "bg-[#C0E6BA]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={next}
          disabled={index === flashcards.length - 1}
          className="w-10 h-10 rounded-full border border-[#C0E6BA] bg-white flex items-center justify-center text-[#013237]/60 hover:text-[#013237] hover:border-[#4CA771] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button
        onClick={() => {
          setFlipped(false);
          setIndex(0);
        }}
        className="flex items-center gap-2 text-sm text-[#013237]/50 hover:text-[#013237] transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Restart
      </button>
    </div>
  );
}

// ── Quiz Tab ──────────────────────────────────────────────────────────────────

const OPTION_KEYS = ["A", "B", "C", "D"] as const;

function QuizTab({ quiz }: { quiz: QuizQuestion[] }) {
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  if (quiz.length === 0) {
    return <EmptyContent message="No quiz questions available." />;
  }

  if (submitted) {
    const score = quiz.filter((q, i) => selected[i] === q.correct_answer).length;
    return <QuizResults quiz={quiz} selected={selected} score={score} onReset={() => { setSelected({}); setSubmitted(false); setCurrent(0); }} />;
  }

  const q = quiz[current];
  const optionMap: Record<string, string> = {
    A: q.option_a,
    B: q.option_b,
    C: q.option_c,
    D: q.option_d,
  };

  const isLast = current === quiz.length - 1;
  const allAnswered = quiz.every((_, i) => selected[i] !== undefined);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs text-[#013237]/50 mb-2">
          <span>Question {current + 1} of {quiz.length}</span>
          <span>{Object.keys(selected).length} answered</span>
        </div>
        <div className="h-1.5 bg-[#C0E6BA] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#4CA771] rounded-full transition-all"
            style={{ width: `${((current + 1) / quiz.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white border border-[#C0E6BA] rounded-xl p-6">
        <p className="text-base font-medium text-[#013237]">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {OPTION_KEYS.map((key) => {
          const isChosen = selected[current] === key;
          return (
            <button
              key={key}
              onClick={() => setSelected((s) => ({ ...s, [current]: key }))}
              className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                isChosen
                  ? "border-[#4CA771] bg-[#EAF9E7]"
                  : "border-[#C0E6BA] bg-white hover:border-[#4CA771]/50"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-semibold transition-colors ${
                  isChosen
                    ? "border-[#4CA771] bg-[#4CA771] text-white"
                    : "border-[#C0E6BA] text-[#013237]/50"
                }`}
              >
                {key}
              </span>
              <span className="text-sm text-[#013237] pt-0.5">{optionMap[key]}</span>
            </button>
          );
        })}
      </div>

      {/* Nav */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="flex items-center gap-2 px-4 py-2 text-sm text-[#013237]/60 hover:text-[#013237] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {isLast ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={!allAnswered}
            className="px-5 py-2 bg-[#4CA771] text-white text-sm font-medium rounded-lg hover:bg-[#3d8f5f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={() => setCurrent((c) => Math.min(quiz.length - 1, c + 1))}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#4CA771] hover:text-[#3d8f5f] transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

function QuizResults({
  quiz,
  selected,
  score,
  onReset,
}: {
  quiz: QuizQuestion[];
  selected: Record<number, string>;
  score: number;
  onReset: () => void;
}) {
  const pct = Math.round((score / quiz.length) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Score */}
      <div className="bg-white border border-[#C0E6BA] rounded-xl p-8 text-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold ${
            pct >= 70
              ? "bg-[#EAF9E7] text-[#4CA771]"
              : "bg-red-50 text-red-500"
          }`}
        >
          {pct}%
        </div>
        <h3 className="text-lg font-semibold text-[#013237]">
          {score} / {quiz.length} correct
        </h3>
        <p className="text-[#013237]/50 text-sm mt-1">
          {pct >= 70 ? "Great job!" : "Keep studying!"}
        </p>
        <button
          onClick={onReset}
          className="mt-5 flex items-center gap-2 px-4 py-2 text-sm text-[#013237]/60 hover:text-[#013237] border border-[#C0E6BA] rounded-lg mx-auto transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Retake Quiz
        </button>
      </div>

      {/* Review */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-[#013237]/50 uppercase tracking-wider">
          Review
        </h4>
        {quiz.map((q, i) => {
          const userAnswer = selected[i];
          const correct = q.correct_answer;
          const isCorrect = userAnswer === correct;
          const optionMap: Record<string, string> = {
            A: q.option_a,
            B: q.option_b,
            C: q.option_c,
            D: q.option_d,
          };

          return (
            <div
              key={q.id}
              className={`bg-white border-2 rounded-xl p-5 ${
                isCorrect ? "border-green-200" : "border-red-200"
              }`}
            >
              <div className="flex items-start gap-3 mb-3">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm font-medium text-[#013237]">{q.question}</p>
              </div>
              <div className="ml-8 space-y-1 text-xs">
                <p>
                  <span className="text-[#013237]/40">Your answer: </span>
                  <span
                    className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                  >
                    {userAnswer}) {optionMap[userAnswer] ?? "—"}
                  </span>
                </p>
                {!isCorrect && (
                  <p>
                    <span className="text-[#013237]/40">Correct: </span>
                    <span className="text-green-600 font-medium">
                      {correct}) {optionMap[correct]}
                    </span>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Empty / Loading helpers ───────────────────────────────────────────────────

function EmptyContent({ message }: { message: string }) {
  return (
    <div className="py-20 text-center text-[#013237]/40 text-sm">{message}</div>
  );
}

function TabSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-[#C0E6BA]/40 rounded-xl" />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LecturePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lecture, setLecture] = useState<LectureDetail | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("transcript");
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [notes, setNotes] = useState<Notes | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [contentLoading, setContentLoading] = useState(false);
  const contentFetched = useRef(false);

  // Initial fetch
  useEffect(() => {
    apiRequest<LectureDetail>(`/lecture/${id}`)
      .then(setLecture)
      .catch(() => router.replace("/history"));
  }, [id, router]);

  // Poll while processing
  useEffect(() => {
    if (!lecture) return;
    if (TERMINAL.includes(lecture.status)) return;

    const timer = setInterval(async () => {
      try {
        const updated = await apiRequest<LectureDetail>(`/lecture/${id}`);
        setLecture(updated);
      } catch {
        // ignore transient errors during polling
      }
    }, POLL_MS);

    return () => clearInterval(timer);
  }, [id, lecture?.status]);

  // Fetch all content when completed
  useEffect(() => {
    if (lecture?.status !== "Completed" || contentFetched.current) return;
    contentFetched.current = true;
    setContentLoading(true);

    Promise.allSettled([
      apiRequest<Transcript>(`/lecture/${id}/transcript`),
      apiRequest<Notes>(`/lecture/${id}/notes`),
      apiRequest<Flashcard[]>(`/lecture/${id}/flashcards`),
      apiRequest<QuizQuestion[]>(`/lecture/${id}/quiz`),
    ]).then(([t, n, fc, qz]) => {
      if (t.status === "fulfilled") setTranscript(t.value);
      if (n.status === "fulfilled") setNotes(n.value);
      if (fc.status === "fulfilled") setFlashcards(fc.value);
      if (qz.status === "fulfilled") setQuiz(qz.value);
      setContentLoading(false);
    });
  }, [id, lecture?.status]);

  if (!lecture) {
    return (
      <div className="p-8 flex justify-center">
        <div className="w-8 h-8 border-2 border-[#4CA771] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isCompleted = lecture.status === "Completed";
  const isProcessing = !TERMINAL.includes(lecture.status);

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[#013237]/50 hover:text-[#013237] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-[#013237]">{lecture.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              {lecture.duration && (
                <span className="flex items-center gap-1 text-xs text-[#013237]/40">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDuration(lecture.duration)}
                </span>
              )}
            </div>
          </div>

          {/* Status badge */}
          <StatusBadge status={lecture.status} />
        </div>
      </div>

      {/* Processing / Error view */}
      {!isCompleted && <ProcessingView lecture={lecture} />}

      {/* Tabs — only when completed */}
      {isCompleted && (
        <>
          {/* Tab nav */}
          <div className="flex gap-1 bg-white border border-[#C0E6BA] rounded-xl p-1 mb-6">
            {TABS.map(({ id: tabId, label, icon: Icon }) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tabId
                    ? "bg-[#4CA771] text-white"
                    : "text-[#013237]/60 hover:text-[#013237] hover:bg-[#EAF9E7]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {contentLoading ? (
            <TabSkeleton />
          ) : (
            <>
              {activeTab === "transcript" &&
                (transcript ? (
                  <TranscriptTab transcript={transcript} />
                ) : (
                  <EmptyContent message="Transcript not available." />
                ))}

              {activeTab === "notes" &&
                (notes ? (
                  <NotesTab notes={notes} />
                ) : (
                  <EmptyContent message="Notes not available." />
                ))}

              {activeTab === "flashcards" && (
                <FlashcardsTab flashcards={flashcards} />
              )}

              {activeTab === "quiz" && <QuizTab quiz={quiz} />}
            </>
          )}
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Uploaded: "bg-blue-50 text-blue-700 border border-blue-200",
    Transcribing: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    "Generating Notes": "bg-purple-50 text-purple-700 border border-purple-200",
    "Generating Flashcards": "bg-orange-50 text-orange-700 border border-orange-200",
    "Generating Quiz": "bg-pink-50 text-pink-700 border border-pink-200",
    Completed: "bg-green-50 text-green-700 border border-green-200",
    Failed: "bg-red-50 text-red-700 border border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] ?? "bg-gray-50 text-gray-600 border border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}
