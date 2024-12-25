"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import zxcvbn from 'zxcvbn';
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupForm() {
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return null;
  }

  const validatePassword = (password: string): string[] => {
    const result = zxcvbn(password);
    const errors: string[] = [];
    
    if (result.score < 3) {
      if (result.feedback.warning) {
        errors.push(result.feedback.warning);
      }
      result.feedback.suggestions.forEach(suggestion => {
        errors.push(suggestion);
      });
      if (errors.length === 0) {
        errors.push("Password is too weak. Please choose a stronger password.");
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setFormError("");
    setPasswordError("");

    const firstname = (e.currentTarget.elements.namedItem("firstname") as HTMLInputElement).value;
    const lastname = (e.currentTarget.elements.namedItem("lastname") as HTMLInputElement).value;
    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const confirmPassword = (e.currentTarget.elements.namedItem("confirm-password") as HTMLInputElement).value;

    // Password validation
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setPasswordError(passwordErrors.join(" "));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName: firstname,
          lastName: lastname
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create account");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl: "/dashboard"
      });

      if (result?.error) {
        throw new Error(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
                Create Your Account
              </h2>
              <p className="text-muted-foreground">
                Join CurioPay to start managing your finances
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <LabelInputContainer>
                  <Label htmlFor="firstname" className="text-foreground">First Name</Label>
                  <Input 
                    id="firstname" 
                    placeholder="John" 
                    type="text" 
                    required
                    className="h-12 bg-background border-input"
                  />
                </LabelInputContainer>
                <LabelInputContainer>
                  <Label htmlFor="lastname" className="text-foreground">Last Name</Label>
                  <Input 
                    id="lastname" 
                    placeholder="Doe" 
                    type="text" 
                    required
                    className="h-12 bg-background border-input"
                  />
                </LabelInputContainer>
              </div>

              <LabelInputContainer>
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <Input 
                  id="email" 
                  placeholder="you@example.com" 
                  type="email" 
                  required
                  className="h-12 bg-background border-input"
                />
              </LabelInputContainer>

              <LabelInputContainer>
                <Label htmlFor="password" className="text-foreground">Password</Label>
                <Input 
                  id="password" 
                  placeholder="••••••••" 
                  type="password" 
                  required
                  className="h-12 bg-background border-input"
                />
              </LabelInputContainer>

              <LabelInputContainer>
                <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                <Input 
                  id="confirm-password" 
                  placeholder="••••••••" 
                  type="password" 
                  required
                  className="h-12 bg-background border-input"
                />
              </LabelInputContainer>

              {passwordError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm"
                >
                  {passwordError}
                </motion.p>
              )}

              {formError && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-destructive text-sm"
                >
                  {formError}
                </motion.p>
              )}

              <div className="space-y-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="text-primary hover:text-primary/90 text-sm"
                  >
                    Already have an account? Sign in
                  </Link>
                </div>
              </div>

              {/* Commented out Google Sign Up
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-input"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <button
                className="w-full h-12 flex items-center justify-center gap-2 border border-input rounded-lg text-foreground hover:bg-accent transition-colors"
                type="button"
                onClick={handleGoogleSignIn}
              >
                <IconBrandGoogle className="h-5 w-5" />
                <span>Sign up with Google</span>
              </button>
              */}
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