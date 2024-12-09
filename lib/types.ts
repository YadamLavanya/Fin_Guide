export interface ProfileData {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  contactInfo?: {
    phone?: string;
    avatarUrl?: string;
  };
  preferences?: {
    monthlyBudget: number;
    currency: {
      code: string;
      symbol: string;
    };
  };
  createdAt: string;
  notifications: {
    type: string;
    enabled: boolean;
  }[];
  stats?: {
    totalExpenses: number;
    categoriesCount: number;
  };
}

export interface UserSettings {
  currency: string;
  theme: string;
  notifications: {
    email: boolean;
  };
}

export interface CategorySettings {
  id: string;
  name: string;
  icon?: string;
  isDefault: boolean;
}