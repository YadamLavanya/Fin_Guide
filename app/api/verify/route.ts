import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendVerificationEmail } from '@/utils/email';
import crypto from 'crypto';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.emailVerified) {
    return NextResponse.json({ verified: true });
  }

  // Delete any existing verification tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { identifier: user.email }
  });

  // Create new verification token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1 hour from now

  await prisma.verificationToken.create({
    data: {
      identifier: user.email,
      token: token,
      expires: expires,
    }
  });

  // Send verification email
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({
    message: 'Verification email sent'
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  // If token is provided, handle verification
  if (token) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      }),
      prisma.verificationToken.delete({
        where: { token }
      })
    ]);

    return NextResponse.json({ verified: true });
  }

  // If no token, just check verification status
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ verified: !!user.emailVerified });
}
