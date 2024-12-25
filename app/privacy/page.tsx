import { Shield, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
        <p className="text-muted-foreground text-sm">Last updated: January 2024</p>
      </div>

      <Alert className="border-primary/50 bg-primary/10 text-primary">
        <Shield className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium">Local Deployment Recommended</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          <p className="mb-3">
            For maximum privacy and data security, we strongly recommend using local deployment. This ensures your financial data remains completely under your control.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="https://github.com/adhamafis/curiopay#installation">
              <Button variant="outline" size="sm" className="h-8 text-xs border-primary/50 hover:bg-primary/10">
                View Installation Guide <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Introduction</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              CurioPay is committed to protecting your privacy. This Privacy Policy explains how we handle your data when you use our open-source budget tracking application.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Data Collection and Storage</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>When using local deployment, all your financial data remains on your infrastructure.</li>
              <li>We do not collect, store, or have access to your financial information.</li>
              <li>API keys for LLM providers are stored securely in your browser and are not transmitted to our servers.</li>
              <li>Email addresses are only collected for verification and notification purposes if you opt in.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Data Usage</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Your financial data is processed locally on your deployment.</li>
              <li>When using LLM features, data is sent directly from your deployment to your chosen LLM provider.</li>
              <li>We have no access to your conversations with LLM providers.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Third-Party Services</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              When you use CurioPay with LLM providers (like Groq, Ollama, etc.), your data is subject to their respective privacy policies. We recommend reviewing their policies before use.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Data Security</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>We implement security best practices in our codebase.</li>
              <li>For local deployments, security depends on your infrastructure configuration.</li>
              <li>We recommend following our security guidelines in the documentation.</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Changes to This Policy</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We may update this Privacy Policy as needed. Significant changes will be communicated through our GitHub repository.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Contact</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              For privacy-related questions, please open an issue on our GitHub repository or contact the maintainers directly.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Link href="/">
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            Return to Main Page <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
} 