"use client";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset link");
      }
      
      setMessage(data.message);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Reset Password
      </h2>
      <p className="text-neutral-600 text-sm max-w-sm mt-2 dark:text-neutral-300">
        Enter your email to receive a reset link.
      </p>

      <form className="my-8" onSubmit={handleSubmit}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
            required
          />
        </LabelInputContainer>

        <button
          className="bg-gradient-to-br from-black dark:from-zinc-900 to-neutral-600 block w-full text-white rounded-md h-10 font-medium disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="text-sm mt-4">
          <Link href="/login" className="text-blue-500 hover:underline">
            Back to Login
          </Link>
        </div>

        {message && <p className="text-green-500 mt-2">{message}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </form>
    </div>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};