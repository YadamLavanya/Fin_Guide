import { PaymentMethodEnum } from '@prisma/client';

export const defaultCurrency = {
  code: 'USD',
  symbol: '$',
  name: 'US Dollar'
};

export const defaultLanguage = {
  code: 'en',
  name: 'English'
};

export const defaultTheme = {
  name: 'light'
};
