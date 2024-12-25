import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background/50 py-4 sm:py-8 px-4">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-primary hover:text-primary/90 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">CurioPay</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/privacy">
              <Button variant="ghost" size="sm" className="text-sm h-8">Privacy</Button>
            </Link>
            <Link href="/terms">
              <Button variant="ghost" size="sm" className="text-sm h-8">Terms</Button>
            </Link>
            <Link href="/disclaimer">
              <Button variant="ghost" size="sm" className="text-sm h-8">Disclaimer</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-3xl mx-auto mt-20">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <Link 
              href="/" 
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <div className="h-0.5 w-12 bg-primary rounded" />
          </div>

          {children}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary" />
              <p className="text-xs text-muted-foreground">
                © 2024 CurioPay
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/privacy" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy
              </Link>
              <Link 
                href="/terms" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Terms
              </Link>
              <Link 
                href="/disclaimer" 
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Disclaimer
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 