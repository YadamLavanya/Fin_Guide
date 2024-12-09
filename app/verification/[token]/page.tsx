"use client"

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"

interface VerificationPageProps {
  params: {
    token: string;
  };
}

const VerificationPage: React.FC<VerificationPageProps> = ({ params }) => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/verify?token=${params.token}`);
        const data = await response.json();

        if (response.ok && data.verified) {
          setStatus('success');
          setMessage('Your email has been verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred during verification');
      }
    };

    verifyEmail();
  }, [params.token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AlertDialog open={true}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {status === 'loading' ? 'Verifying Email' : 
               status === 'success' ? 'Email Verified' : 'Verification Failed'}
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-2">
              {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => router.push('/dashboard/settings')}
            >
              Return to Settings
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VerificationPage;
