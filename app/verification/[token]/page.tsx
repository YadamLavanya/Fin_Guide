import type { PageProps } from 'next';
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

const VerificationPage = async ({ params }: PageProps) => {
  let status: 'loading' | 'success' | 'error' = 'loading';
  let message = 'Verifying your email...';

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verify?token=${params.token}`);
    const data = await response.json();

    if (response.ok && data.verified) {
      status = 'success';
      message = 'Your email has been verified successfully!';
    } else {
      status = 'error';
      message = data.error || 'Failed to verify email';
    }
  } catch (error) {
    status = 'error';
    message = 'An error occurred during verification';
  }

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
