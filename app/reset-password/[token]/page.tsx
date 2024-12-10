"use client";
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/passwordValidation";
import debounce from "lodash/debounce";

export default function VerificationPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const type = searchParams.get("type"); // "email" or "reset"

  useEffect(() => {
    if (type === "email") {
      verifyEmail();
    }
  }, [type]);

  const verifyEmail = async () => {
    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage("Email verified successfully!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      // Validate password
      const validationResult = validatePassword(password);
      if (!validationResult.isValid) {
        setError(validationResult.errors.join(" "));
        return;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setMessage("Password reset successful!");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Create a debounced version of password validation
  const debouncedValidatePassword = useCallback(
    debounce((password: string) => {
      const validationResult = validatePassword(password);
      setPasswordStrength(validationResult.errors);
    }, 300),
    []
  );

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    debouncedValidatePassword(newPassword);
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedValidatePassword.cancel();
    };
  }, [debouncedValidatePassword]);

  if (type === "email") {
    return (
      <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
        <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
          Email Verification
        </h2>
        {message && <p className="text-green-500 mt-2">{message}</p>}
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-white dark:bg-black">
      <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
        Create New Password
      </h2>
      <form className="my-8" onSubmit={handleResetPassword}>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="password">New Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
          />
          {passwordStrength.length > 0 && (
            <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
              {passwordStrength.map((error, index) => (
                <div key={index}>{error}</div>
              ))}
            </div>
          )}
        </LabelInputContainer>

        <LabelInputContainer className="mb-4">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </LabelInputContainer>

        <button
          className="bg-gradient-to-br from-black dark:from-zinc-900 to-neutral-600 block w-full text-white rounded-md h-10 font-medium disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>

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
    <div className={`flex flex-col space-y-2 w-full ${className}`}>
      {children}
    </div>
  );
};