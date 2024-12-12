import { PrismaClient, PaymentMethodEnum } from '@prisma/client';
import { defaultCurrency, defaultLanguage, defaultTheme } from './default-data';

const prisma = new PrismaClient();

const paymentMethods = [
  { name: 'CASH', icon: '💵' },
  { name: 'CREDIT_CARD', icon: '💳' },
  { name: 'DEBIT_CARD', icon: '💳' },
  { name: 'BANK_TRANSFER', icon: '🏦' },
  { name: 'CHECK', icon: '📝' },
  { name: 'CRYPTO', icon: '₿' },
  { name: 'OTHER', icon: '🔄' },
] as const;

async function main() {
  // Ensure the users table exists
  const tableExists = await prisma.$queryRaw`SELECT to_regclass('public.users') IS NOT NULL as exists`;
  if (!tableExists[0].exists) {
    console.error("The table `public.users` does not exist in the current database.");
    process.exit(1);
  }

  // Seed currencies
  await prisma.currency.upsert({
    where: { code: defaultCurrency.code },
    update: {},
    create: defaultCurrency,
  });

  // Seed themes
  await prisma.theme.upsert({
    where: { name: defaultTheme.name },
    update: {},
    create: defaultTheme,
  });

  // Seed languages
  await prisma.language.upsert({
    where: { code: defaultLanguage.code },
    update: {},
    create: defaultLanguage,
  });

  // Seed category types
  await prisma.categoryType.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Expense', icon: '💰' },
      { name: 'Income', icon: '💵' },
    ],
  });

  // Find or create the default expense category type
  const expenseCategoryType = await prisma.categoryType.upsert({
    where: {
      id: 'default',
    },
    update: {},
    create: {
      id: 'default',
      name: 'Default Expense',
      icon: '💰',
    },
  });

  // Create default payment methods
  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { name: method.name as PaymentMethodEnum },
      update: { icon: method.icon },
      create: {
        name: method.name as PaymentMethodEnum,
        icon: method.icon,
      },
    });
  }

  // Create a demo user if it doesn't exist
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
    },
  });

  // Ensure default categories are created for the demo user
  const defaultCategories = [
    { name: 'Food', icon: '🛒' },
    { name: 'Housing', icon: '🏠' },
    { name: 'Bills', icon: '📄' },
    { name: 'Transport', icon: '🚗' },
    { name: 'Entertainment', icon: '☕' },
    { name: 'Shopping', icon: '🎁' },
    { name: 'Other', icon: '📱' },
  ];

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        userId_name: {
          userId: demoUser.id,
          name: category.name,
        },
      },
      update: {
        icon: category.icon,
        typeId: expenseCategoryType.id,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
      create: {
        name: category.name,
        icon: category.icon,
        typeId: expenseCategoryType.id,
        userId: demoUser.id,
        isSystem: true,
        isDefault: category.name === 'Other',
      },
    });
  }

  // Seed roles if necessary
  // Seed other default data as required
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });