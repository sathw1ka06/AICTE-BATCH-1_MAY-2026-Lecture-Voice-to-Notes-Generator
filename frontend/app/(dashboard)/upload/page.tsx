"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileAudio, CheckCircle, AlertCircle, X } from "lucide-react";
import { uploadFile } from "@/lib/api";
import type { Lecture } from "@/types";

const ALLOWED_EXTENSIONS = [".mp3", ".wav", ".m4a"];

function isValidAudio(file: File): boolean {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (isValidAudio(dropped)) {
      setFile(dropped);
      setError(null);
    } else {
      setError("Please upload an MP3, WAV, or M4A file.");
    }
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (isValidAudio(selected)) {
      setFile(selected);
      setError(null);
    } else {
      setError("Please upload an MP3, WAV, or M4A file.");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      await uploadFile<Lecture>("/lecture/upload", form);
      setSuccess(true);
      setTimeout(() => router.push("/history"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#013237]">Upload Lecture</h1>
        <p className="text-[#013237]/60 mt-1 text-sm">
          Upload an audio file to begin transcription.
        </p>
      </div>

      <div className="max-w-2xl">
        {success ? (
          <div className="border-2 border-[#4CA771] bg-white rounded-2xl p-12 text-center">
            <CheckCircle className="w-12 h-12 text-[#4CA771] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#013237]">
              Upload successful!
            </h3>
            <p className="text-[#013237]/60 text-sm mt-2">
              Redirecting to history…
            </p>
          </div>
        ) : (
          <>
            {/* Drop zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${
                isDragging
                  ? "border-[#4CA771] bg-[#C0E6BA]/20"
                  : file
                  ? "border-[#4CA771] bg-white"
                  : "border-[#C0E6BA] bg-white hover:border-[#4CA771] hover:bg-[#EAF9E7]"
              }`}
            >
              {file ? (
                <div>
                  <FileAudio className="w-12 h-12 text-[#4CA771] mx-auto mb-4" />
                  <p className="text-[#013237] font-medium">{file.name}</p>
                  <p className="text-[#013237]/50 text-sm mt-1">
                    {formatBytes(file.size)}
                  </p>
                  <button
                    onClick={() => setFile(null)}
                    className="mt-3 inline-flex items-center gap-1 text-xs text-[#013237]/50 hover:text-red-500 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-[#4CA771] mx-auto mb-4" />
                  <p className="text-[#013237] font-medium">
                    Drop your audio file here
                  </p>
                  <p className="text-[#013237]/50 text-sm mt-1">or</p>
                  <label className="mt-4 inline-block cursor-pointer">
                    <span className="px-4 py-2 bg-[#4CA771] text-white rounded-lg text-sm font-medium hover:bg-[#3d8f5f] transition-colors">
                      Browse Files
                    </span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".mp3,.wav,.m4a"
                      onChange={handleSelect}
                    />
                  </label>
                  <p className="text-[#013237]/40 text-xs mt-4">
                    Supports MP3 · WAV · M4A
                  </p>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Upload button */}
            {file && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#4CA771] text-white rounded-lg font-medium text-sm hover:bg-[#3d8f5f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Lecture
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
