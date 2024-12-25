import { ScrollText, ArrowRight, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2">
          <ScrollText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Terms of Service</h1>
        </div>
        <p className="text-muted-foreground text-sm">Last updated: January 2024</p>
      </div>

      <Alert className="border-yellow-600/50 bg-yellow-600/10 text-yellow-600 dark:text-yellow-500">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium">Important Notice</AlertTitle>
        <AlertDescription className="mt-2 text-sm">
          <p className="mb-3">
            By using CurioPay, you agree to these terms. For actual usage, we strongly recommend local deployment to maintain control over your financial data.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link href="https://github.com/adhamafis/curiopay#installation">
              <Button variant="outline" size="sm" className="h-8 text-xs border-yellow-600/50 hover:bg-yellow-600/10">
                View Installation Guide <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </AlertDescription>
      </Alert>

      <div className="grid gap-3">
        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              By using CurioPay, you agree to these Terms of Service. If you disagree with any part of these terms, you should not use the application.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Description of Service</h2>
            <p className="text-sm leading-relaxed text-muted-foreground mb-2">
              CurioPay is an open-source budget tracking application that provides:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>Financial tracking and management tools</li>
              <li>Integration with LLM providers for financial insights</li>
              <li>Local deployment options</li>
              <li>Data export capabilities</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              <li>You are responsible for maintaining the security of your deployment</li>
              <li>You must provide accurate information when using the application</li>
              <li>You are responsible for all activities that occur under your account</li>
              <li>You must comply with all applicable laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Intellectual Property</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              CurioPay is open-source software released under the MIT License. You may modify and distribute the software according to the license terms.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Disclaimer of Warranties</h2>
            <p className="text-xs leading-relaxed font-mono uppercase text-muted-foreground">
              THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Limitation of Liability</h2>
            <p className="text-xs leading-relaxed font-mono uppercase text-muted-foreground">
              IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Third-Party Services</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Use of third-party services (LLM providers, etc.) is subject to their respective terms of service. We are not responsible for any third-party services.
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50">
          <CardContent className="p-4 space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">Changes to Terms</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We reserve the right to modify these terms at any time. Changes will be communicated through our GitHub repository.
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