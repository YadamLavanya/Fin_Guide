import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { sendDataExport } from '@/utils/email';
import { prisma } from '@/lib/prisma';
import JSZip from 'jszip';

export async function POST() {
  try {
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

    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: 'Email verification required',
        verified: false 
      }, { status: 403 });
    }

    // Fetch user data with specific field selection
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        expenses: {
          where: { isVoid: false },
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            categoryId: true,
            paymentMethodId: true,
            notes: true,
            createdAt: true
          }
        },
        incomes: {
          where: { isVoid: false },
          select: {
            id: true,
            date: true,
            description: true,
            amount: true,
            categoryId: true,
            paymentMethodId: true,
            notes: true,
            createdAt: true
          }
        },
        categories: {
          select: {
            id: true,
            name: true,
            typeId: true,
            budget: true,
            icon: true,
            color: true,
            isDefault: true
          }
        },
        preferences: {
          select: {
            monthlyBudget: true,
            currency: {
              select: {
                code: true,
                symbol: true
              }
            },
            language: {
              select: {
                code: true
              }
            },
            theme: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    if (!userData) {
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Create zip file with JSON data
    const zip = new JSZip();
    const exportData = {
      userInfo: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName
      },
      preferences: userData.preferences,
      expenses: userData.expenses,
      incomes: userData.incomes,
      categories: userData.categories,
      exportDate: new Date().toISOString()
    };

    zip.file('financial-data.json', JSON.stringify(exportData, null, 2));
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Send email with zip attachment
    await sendDataExport(user.email, zipBuffer);

    return NextResponse.json({ 
      success: true, 
      message: 'Data export sent to your email'
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate export' },
      { status: 500 }
    );
  }
}