"use client";
import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { validatePassword } from "@/lib/passwordValidation";
import debounce from "lodash/debounce";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex min-h-screen items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
          >
            <div className="rounded-2xl border bg-card p-8 shadow-lg">
              <Link href="/" className="inline-flex items-center text-primary hover:text-primary/90 mb-8 group">
                <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
                <span>Back to home</span>
              </Link>

              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Email Verification
                </h2>
                <p className="text-muted-foreground">
                  Verifying your email address...
                </p>
              </div>

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-500 text-sm"
                >
                  {message}
                </motion.p>
              )}
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm"
                >
                  {error}
                </motion.p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border bg-card p-8 shadow-lg">
            <Link href="/" className="inline-flex items-center text-primary hover:text-primary/90 mb-8 group">
              <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
              <span>Back to home</span>
            </Link>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Create New Password
              </h2>
              <p className="text-muted-foreground">
                Enter your new password below
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleResetPassword}>
              <LabelInputContainer>
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="h-12 bg-background border-input"
                />
                {passwordStrength.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-amber-600 dark:text-amber-400"
                  >
                    {passwordStrength.map((error, index) => (
                      <div key={index}>{error}</div>
                    ))}
                  </motion.div>
                )}
              </LabelInputContainer>

              <LabelInputContainer>
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-12 bg-background border-input"
                />
              </LabelInputContainer>

              {message && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-500 text-sm"
                >
                  {message}
                </motion.p>
              )}
              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm"
                >
                  {error}
                </motion.p>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? "Resetting password..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-primary hover:text-primary/90 text-sm"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
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
    <div className={cn("flex flex-col space-y-2", className)}>
      {children}
    </div>
  );
};