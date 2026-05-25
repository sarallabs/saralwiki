"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function LoginContent() {
  const params = useSearchParams();
  const router = useRouter();
  const error = params.get("error");
  const errorMsg =
    error === "suspended"
      ? "Your account has been suspended. Please contact an admin."
      : error
      ? "Invalid email or password."
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credError, setCredError] = useState("");

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setCredError("");
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setCredError("Invalid email or password.");
      } else {
        router.push("/dashboard");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[hsl(var(--background))] relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-500/25">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gradient">SaralOps</h1>
          <p className="mt-2 text-[hsl(var(--muted-foreground))] text-sm text-center">
            Unified workspace for Saral Vidhya &amp; Saral Labs
          </p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <h2 className="text-xl font-semibold text-center mb-2">Welcome back</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-sm text-center mb-6">
            Sign in with your email and password.
          </p>

          {(errorMsg || credError) && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {errorMsg ?? credError}
            </div>
          )}

          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Email address</label>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input-field pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-50"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</> : "Sign in"}
            </button>
            <div className="flex items-center justify-between mt-4">
              <Link href="/signup" className="text-xs text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors underline-offset-2 hover:underline">
                Create an account
              </Link>
              <Link href="/reset-password" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors underline-offset-2 hover:underline">
                Forgot password?
              </Link>
            </div>
          </form>

          <p className="mt-6 text-xs text-[hsl(var(--muted-foreground))] text-center">
            Sign in using your email and password.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
