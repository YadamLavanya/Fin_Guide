import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { defaultCurrency, defaultLanguage, defaultTheme } from '@/prisma/default-data';
import { validatePassword } from '@/lib/passwordValidation';

const defaultExpenseCategories = [
  { name: 'Food', icon: '🛒' },
  { name: 'Housing', icon: '🏠' },
  { name: 'Bills', icon: '📄' },
  { name: 'Transport', icon: '🚗' },
  { name: 'Entertainment', icon: '☕' },
  { name: 'Shopping', icon: '🎁' },
  { name: 'Other', icon: '📱' },
];

const defaultIncomeCategories = [
  { name: 'Salary', icon: '💼' },
  { name: 'Investment', icon: '📈' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Rental', icon: '🏠' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Other', icon: '📝' },
];

async function setupUserDefaults(userId: string) {
  // Get or create category types
  const [expenseType, incomeType] = await Promise.all([
    prisma.categoryType.upsert({
      where: { name: 'Expense' },
      update: {},
      create: { name: 'Expense', icon: '💰' },
    }),
    prisma.categoryType.upsert({
      where: { name: 'Income' },
      update: {},
      create: { name: 'Income', icon: '💵' },
    }),
  ]);

  // Create default expense categories
  for (const category of defaultExpenseCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: userId,
          name: category.name,
        },
      },
      update: {
        icon: category.icon,
        typeId: expenseType.id,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
      create: {
        name: category.name,
        icon: category.icon,
        typeId: expenseType.id,
        userId: userId,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
    });
  }

  // Create default income categories
  for (const category of defaultIncomeCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: userId,
          name: category.name,
        },
      },
      update: {
        icon: category.icon,
        typeId: incomeType.id,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
      create: {
        name: category.name,
        icon: category.icon,
        typeId: incomeType.id,
        userId: userId,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
    });
  }

  // Ensure payment methods exist
  const defaultPaymentMethods = [
    { name: 'CASH', icon: '💵' },
    { name: 'CREDIT_CARD', icon: '💳' },
    { name: 'DEBIT_CARD', icon: '💳' },
    { name: 'BANK_TRANSFER', icon: '🏦' },
    { name: 'CHECK', icon: '📝' },
    { name: 'CRYPTO', icon: '₿' },
    { name: 'OTHER', icon: '🔄' },
  ];

  await Promise.all(
    defaultPaymentMethods.map(method =>
      prisma.paymentMethod.upsert({
        where: { name: method.name as PaymentMethodEnum },
        update: {},
        create: {
          name: method.name as PaymentMethodEnum,
          icon: method.icon,
        },
      })
    )
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName } = body;

    // Input validation
    if (!email?.trim() || !password?.trim() || !firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(" ") },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { auth: true }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 400 }
      );
    }

    const passwordSalt = crypto.randomBytes(16).toString('hex');
    const hashedPassword = await bcrypt.hash(password + passwordSalt, 10);

    const [currency, language, theme] = await Promise.all([
      prisma.currency.findFirst() || prisma.currency.create({ data: defaultCurrency }),
      prisma.language.findFirst() || prisma.language.create({ data: defaultLanguage }),
      prisma.theme.findFirst() || prisma.theme.create({ data: defaultTheme })
    ]);

    const newUser = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        auth: {
          create: {
            password: hashedPassword,
            passwordSalt,
            passwordHashVersion: 1,
          }
        },
        preferences: {
          create: {
            currencyId: currency.id,
            languageId: language.id,
            themeId: theme.id,
          }
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      }
    });

    // Setup default categories and payment methods
    await setupUserDefaults(newUser.id);

    return new NextResponse(JSON.stringify(newUser), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Error creating user:", error);
    return new NextResponse(
      JSON.stringify({ error: "Registration failed." }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}