"use client"

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { 
  ShoppingCart, 
  Home, 
  Receipt, 
  Car, 
  Coffee, 
  Gift, 
  Smartphone,
  Download,
  CreditCard,
  Wallet,
  Building2,
  MoreHorizontal,
  Repeat
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import {
  Toast,
  ToastProvider,
  ToastViewport,
} from "@/components/ui/toast"

const ICONS = {
  Food: <ShoppingCart className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Bills: <Receipt className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Entertainment: <Coffee className="w-4 h-4" />,
  Shopping: <Gift className="w-4 h-4" />,
  Other: <Smartphone className="w-4 h-4" />
};

const PAYMENT_METHODS = [
  { name: 'CASH', icon: <Wallet className="w-4 h-4" /> },
  { name: 'CREDIT_CARD', icon: <CreditCard className="w-4 h-4" /> },
  { name: 'DEBIT_CARD', icon: <CreditCard className="w-4 h-4" /> },
  { name: 'BANK_TRANSFER', icon: <Building2 className="w-4 h-4" /> },
  { name: 'OTHER', icon: <MoreHorizontal className="w-4 h-4" /> },
];

type ExpenseCategory = keyof typeof ICONS;
type PaymentMethod = typeof PAYMENT_METHODS[number]['name'] | 'OTHER_CUSTOM';

interface Expense {
  id: string;
  date: string;
  description: string;
  category: { name: string; icon: string };
  amount: number;
  paymentMethod: { name: PaymentMethod };
  recurring?: {
    pattern: {
      type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
      frequency: number;
    };
    nextProcessDate: string;
  };
}

interface SortConfig {
  key: keyof Expense;
  direction: 'ascending' | 'descending';
}

const convertToCSV = (expenses: Expense[]) => {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
  const rows = expenses.map(expense => [
    new Date(expense.date).toLocaleDateString(),
    expense.description,
    expense.category.name,
    expense.amount.toFixed(2),
    expense.paymentMethod.name
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  return csvContent;
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>('');
  const { toast } = useToast();
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (title: string, description: string, variant: "default" | "destructive" = "default") => {
    toast({
      title,
      description,
      variant,
    });
  };

  const fetchExpenses = async () => {
    const response = await fetch('/api/expense');
    const data = await response.json();
    setExpenses(data);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const frequencyValue = formData.get('frequency');
    const selectedPaymentMethod = formData.get('paymentMethod') as PaymentMethod;
    const customPayment = formData.get('customPaymentMethod') as string;

    const expenseData = {
      description: formData.get('description'),
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category'),
      paymentMethod: selectedPaymentMethod === 'OTHER_CUSTOM' ? customPayment : selectedPaymentMethod,
      date: formData.get('date'),
      ...(isRecurring && {
        recurring: {
          pattern: {
            type: formData.get('recurringType'),
            frequency: frequencyValue ? parseInt(frequencyValue as string, 10) : null,
          },
          startDate: formData.get('date'),
          endDate: formData.get('endDate') || null,
        },
      }),
    };

    // Validate frequency before sending
    if (isRecurring && (!expenseData.recurring.pattern.frequency || isNaN(expenseData.recurring.pattern.frequency))) {
      showToast("Error", "Please enter a valid frequency for recurring expenses.", "destructive");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add expense');
      }

      showToast("Success", "Expense added successfully");
      fetchExpenses();
      setIsAddExpenseOpen(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const expenseData = {
        id: selectedExpense?.id,
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount') as string),
        category: formData.get('category'),
        paymentMethod: formData.get('paymentMethod'),
        date: formData.get('date'),
      };

      const response = await fetch('/api/expense', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      showToast("Success", "Expense updated successfully");
      fetchExpenses();
      setIsEditExpenseOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      showToast("Error", errorMessage, "destructive");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expense?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast("Success", "Expense deleted successfully");
        fetchExpenses();
      } else {
        throw new Error('Failed to delete expense');
      }
    } catch (error) {
      showToast("Error", "Failed to delete expense", "destructive");
    }
  };

  const handleSort = (key: keyof Expense) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const sortedData = [...expenses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const filteredData = sortedData.filter(item => 
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || item.category.name === selectedCategory)
  );

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

  const defaultCategories = [
    { name: 'Food', icon: <ShoppingCart className="w-4 h-4" /> },
    { name: 'Housing', icon: <Home className="w-4 h-4" /> },
    { name: 'Bills', icon: <Receipt className="w-4 h-4" /> },
    { name: 'Transport', icon: <Car className="w-4 h-4" /> },
    { name: 'Entertainment', icon: <Coffee className="w-4 h-4" /> },
    { name: 'Shopping', icon: <Gift className="w-4 h-4" /> },
    { name: 'Other', icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditExpenseOpen(true);
  };

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setSelectedPaymentMethod(value);
    if (value !== 'OTHER_CUSTOM') {
      setCustomPaymentMethod('');
    }
  };

  const handleExport = () => {
    const csvContent = convertToCSV(filteredData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `expenses-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button>Add Expense</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                      Enter the details of your expense below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleAddExpense(new FormData(e.currentTarget));
                  }}>
                    <div className="grid gap-4 py-4">
                      <Input 
                        name="description" 
                        type="text" 
                        placeholder="Description" 
                        maxLength={255}
                        pattern="^[a-zA-Z0-9\s\-_.,!?()]+$"
                        required 
                      />
                      <Input 
                        name="amount" 
                        type="number" 
                        placeholder="Amount" 
                        step="0.01"
                        min="0.01"
                        max="999999999.99"
                        required 
                      />
                      <Select name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {defaultCategories.map(({ name, icon }) => (
                            <SelectItem key={name} value={name}>
                              <span className="flex items-center gap-2">
                                {icon}
                                {name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        name="paymentMethod"
                        value={selectedPaymentMethod}
                        onValueChange={handlePaymentMethodChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Payment Method" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {PAYMENT_METHODS.map(({ name, icon }) => (
                            <SelectItem key={name} value={name}>
                              <span className="flex items-center gap-2">
                                {icon}
                                {name.replace('_', ' ')}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPaymentMethod === 'OTHER_CUSTOM' && (
                        <Input
                          name="customPaymentMethod"
                          type="text"
                          placeholder="Enter custom payment method"
                          value={customPaymentMethod}
                          onChange={(e) => setCustomPaymentMethod(e.target.value)}
                          required
                        />
                      )}
                      <Input name="date" type="date" required />
                      
                      <div className="flex items-center gap-4">
                        <Switch
                          id="recurring"
                          checked={isRecurring}
                          onCheckedChange={setIsRecurring}
                        />
                        <Label htmlFor="recurring">Recurring Payment</Label>
                      </div>
                      
                      {isRecurring && (
                        <div className="grid gap-2">
                          <Select name="recurringType">
                            <SelectTrigger>
                              <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent className='bg-white'>
                              <SelectItem value="DAILY">Daily</SelectItem>
                              <SelectItem value="WEEKLY">Weekly</SelectItem>
                              <SelectItem value="MONTHLY">Monthly</SelectItem>
                              <SelectItem value="YEARLY">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            name="frequency"
                            type="number"
                            placeholder="Every X days/weeks/months/years"
                          />
                          <Input
                            name="endDate"
                            type="date"
                            placeholder="End Date (Optional)"
                          />
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              {/* Search controls */}
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={value => setSelectedCategory(value as ExpenseCategory | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-950">
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">All Categories</span>
                    </SelectItem>
                    {Object.entries(ICONS).map(([value, icon]) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          {icon}
                          {value}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-h-0 rounded-md border">
                <div className="h-full overflow-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          {['Date', 'Description', 'Category', 'Amount', 'Payment Method'].map(header => (
                            <th
                              key={header}
                              onClick={() => handleSort(header.toLowerCase().replace(' ', '') as keyof Expense)}
                              className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            >
                              {header}
                              {sortConfig.key === header.toLowerCase().replace(' ', '') && (
                                <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
  {filteredData.map((expense, index) => (
    <tr
      key={expense.id}
      onClick={() => handleRowClick(expense)}
      className={`
        ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
        ${selectedRows.includes(expense.id) ? 'bg-primary/10' : ''}
        hover:bg-muted cursor-pointer transition-colors
      `}
    >
      <td className="px-6 py-4 whitespace-nowrap">{new Date(expense.date).toLocaleDateString()}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          {expense.recurring && <Repeat className="w-4 h-4" />}
          {expense.description}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="flex items-center gap-2">
          {ICONS[expense.category.name as ExpenseCategory]}
          {expense.category.name}
        </span>
      </td>
      <td className="px-6 py-4">${expense.amount.toFixed(2)}</td>
      <td className="px-6 py-4">
        <span className="flex items-center gap-2">
          {PAYMENT_METHODS.find(pm => pm.name === expense.paymentMethod.name)?.icon}
          {expense.paymentMethod.name.replace('_', ' ')}
        </span>
      </td>
    </tr>
  ))}
</tbody>

                    </table>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-auto pt-4 shrink-0">
                  <p className="text-lg font-semibold">
                    Total: ${totalAmount.toFixed(2)}
                  </p>
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <Dialog open={isEditExpenseOpen} onOpenChange={setIsEditExpenseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Modify the expense details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            handleEditExpense(new FormData(e.currentTarget));
          }}>
            <div className="grid gap-4 py-4">
              <Input 
                name="description" 
                type="text" 
                placeholder="Description" 
                maxLength={255}
                pattern="^[a-zA-Z0-9\s\-_.,!?()]+$"
                defaultValue={selectedExpense?.description}
                required 
              />
              <Input 
                name="amount" 
                type="number" 
                placeholder="Amount" 
                step="0.01"
                min="0.01"
                max="999999999.99"
                defaultValue={selectedExpense?.amount}
                required 
              />
              <Select name="category" defaultValue={selectedExpense?.category.name}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {defaultCategories.map(({ name, icon }) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {icon}
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                name="paymentMethod"
                value={selectedPaymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className='bg-white'>
                  {PAYMENT_METHODS.map(({ name, icon }) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {icon}
                        {name.replace('_', ' ')}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input 
                name="date" 
                type="date" 
                defaultValue={selectedExpense?.date.split('T')[0]}
                required 
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  if (selectedExpense && !isSubmitting) {
                    handleDeleteExpense(selectedExpense.id);
                    setIsEditExpenseOpen(false);
                  }
                }}
                disabled={isSubmitting}
              >
                Delete
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        <ToastViewport />
    </ToastProvider>
  );
}