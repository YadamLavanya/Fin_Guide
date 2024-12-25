"use client";
import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;

    try {
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
      setError(err.message);
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
                Welcome Back
              </h2>
              <p className="text-muted-foreground">
                Sign in to continue to CurioPay
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
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
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground">Password</Label>
                  <Link 
                    href="/reset-password" 
                    className="text-sm text-primary hover:text-primary/90"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  placeholder="••••••••" 
                  type="password" 
                  required
                  className="h-12 bg-background border-input"
                />
              </LabelInputContainer>

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
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/register" 
                    className="text-primary hover:text-primary/90 text-sm"
                  >
                    Don't have an account? Sign up
                  </Link>
                </div>
              </div>

              {/* Commented out Google Sign In
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
                <span>Sign in with Google</span>
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
