"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (getToken()) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#EAF9E7] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#4CA771] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
