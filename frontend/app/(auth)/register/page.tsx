"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EAF9E7] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#4CA771] rounded-xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#013237]">Create account</h1>
          <p className="text-[#013237]/60 text-sm mt-1">
            Start your learning journey today
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#C0E6BA] p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#013237] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full px-3.5 py-2.5 bg-[#EAF9E7] border border-[#C0E6BA] rounded-lg text-sm text-[#013237] placeholder-[#013237]/40 focus:outline-none focus:border-[#4CA771] focus:ring-1 focus:ring-[#4CA771] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013237] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#EAF9E7] border border-[#C0E6BA] rounded-lg text-sm text-[#013237] placeholder-[#013237]/40 focus:outline-none focus:border-[#4CA771] focus:ring-1 focus:ring-[#4CA771] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#013237] mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="w-full px-3.5 py-2.5 bg-[#EAF9E7] border border-[#C0E6BA] rounded-lg text-sm text-[#013237] placeholder-[#013237]/40 focus:outline-none focus:border-[#4CA771] focus:ring-1 focus:ring-[#4CA771] transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#013237]/40 hover:text-[#013237]/70 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-[#013237]/40 mt-1.5">Minimum 8 characters</p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#4CA771] text-white rounded-lg text-sm font-medium hover:bg-[#3d8f5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#013237]/60 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#4CA771] font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
