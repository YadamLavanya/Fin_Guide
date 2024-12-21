"use client";
import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ErrorReport {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export default function ReportPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<string>('low');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [recentReports, setRecentReports] = useState<ErrorReport[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create Sentry event
      const eventId = Sentry.captureEvent({
        message: title,
        level: severity as Sentry.SeverityLevel,
        extra: {
          description,
          userSubmitted: true,
        },
      });

      // Add to recent reports
      const newReport: ErrorReport = {
        title,
        description,
        severity: severity as 'low' | 'medium' | 'high' | 'critical',
        timestamp: new Date().toISOString(),
      };

      setRecentReports(prev => [newReport, ...prev]);
      setSubmitStatus('success');
      setTitle('');
      setDescription('');
      setSeverity('low');

    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus(null), 3000);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-blue-500',
      medium: 'text-yellow-500',
      high: 'text-orange-500',
      critical: 'text-red-500',
    };
    return colors[severity as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <div className="min-h-screen w-full bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Error Report Form */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Report an Issue</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Issue Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief description of the issue"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="severity" className="text-sm font-medium">
                Severity
              </label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Detailed Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please provide as much detail as possible"
                required
                rows={5}
              />
            </div>

            {submitStatus && (
              <div className={`flex items-center gap-2 p-3 rounded ${
                submitStatus === 'success' 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}>
                {submitStatus === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span>
                  {submitStatus === 'success' 
                    ? 'Report submitted successfully'
                    : 'Error submitting report'}
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </form>
        </Card>

        {/* Recent Reports */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Recent Reports</h2>
          <div className="space-y-4">
            {recentReports.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent reports
              </p>
            ) : (
              recentReports.map((report, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-medium">{report.title}</h3>
                    <span className={`text-sm font-medium ${getSeverityColor(report.severity)}`}>
                      {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {report.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(report.timestamp).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
