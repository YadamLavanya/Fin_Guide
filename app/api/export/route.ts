
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { sendDataExport } from '@/utils/email';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';


export async function POST() {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: 'Email verification required',
        verified: false 
      }, { status: 403 });
    }

    // Fetch user data
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        expenses: true,
        incomes: true,
        categories: true,
        preferences: true
      }
    });

    // Create zip file with JSON data
    const zip = new JSZip();

    // Add data files to zip
    zip.file('expenses.json', JSON.stringify(userData?.expenses, null, 2));
    zip.file('incomes.json', JSON.stringify(userData?.incomes, null, 2));
    zip.file('categories.json', JSON.stringify(userData?.categories, null, 2));
    zip.file('preferences.json', JSON.stringify(userData?.preferences, null, 2));

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Send email with zip attachment
    await sendDataExport(user.email, zipBuffer);

    return NextResponse.json({ success: true, message: 'Data export sent to email' });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}