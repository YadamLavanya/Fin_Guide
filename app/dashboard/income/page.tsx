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
  Briefcase,
  TrendingUp,
  Code,
  Building,
  Plus,
  Download,
  CreditCard,
  Wallet,
  Building2,
  Bitcoin,
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

const INCOME_CATEGORIES = {
  Salary: <Briefcase className="w-4 h-4" />,
  Investment: <TrendingUp className="w-4 h-4" />,
  Freelance: <Code className="w-4 h-4" />,
  Rental: <Building className="w-4 h-4" />,
  Other: <Plus className="w-4 h-4" />
} as const;

const PAYMENT_METHODS = [
  { name: 'BANK_TRANSFER', icon: <Building2 className="w-4 h-4" /> },
  { name: 'CHECK', icon: <CreditCard className="w-4 h-4" /> },
  { name: 'CASH', icon: <Wallet className="w-4 h-4" /> },
  { name: 'CRYPTO', icon: <Bitcoin className="w-4 h-4" /> },
  { name: 'OTHER', icon: <MoreHorizontal className="w-4 h-4" /> },
];

type IncomeCategory = keyof typeof INCOME_CATEGORIES;
type PaymentMethod = typeof PAYMENT_METHODS[number]['name'];

interface Income {
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
  key: keyof Income;
  direction: 'ascending' | 'descending';
}

export default function IncomePage() {
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { toast } = useToast();
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);

  // Fetch incomes from API
  const fetchIncomes = async () => {
    try {
      const response = await fetch('/api/income');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      setIncomes(data);
    } catch (error) {
      console.error('Failed to fetch incomes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch incomes. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchIncomes();
  }, []);

  // Handler functions similar to expenses but for income
  const handleAddIncome = async (formData: FormData) => {
    try {
      const response = await fetch('/api/income', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      toast({ title: "Success", description: "Income added successfully" });
      fetchIncomes();
      setIsAddIncomeOpen(false);
    } catch (error) {
      console.error('Failed to add income:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add income",
        variant: "destructive"
      });
    }
  };

  const handleEditIncome = async (formData: FormData) => {
    try {
      const incomeData = {
        id: selectedIncome?.id,
        description: formData.get('description'),
        amount: parseFloat(formData.get('amount') as string),
        category: formData.get('category'),
        paymentMethod: formData.get('paymentMethod'),
        date: formData.get('date'),
      };

      const response = await fetch('/api/income', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incomeData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      toast({ title: "Success", description: "Income updated successfully" });
      fetchIncomes();
      setIsEditIncomeOpen(false);
    } catch (error) {
      console.error('Failed to update income:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update income",
        variant: "destructive"
      });
    }
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      const response = await fetch(`/api/income?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      toast({ title: "Success", description: "Income deleted successfully" });
      fetchIncomes();
      setIsEditIncomeOpen(false);
    } catch (error) {
      console.error('Failed to delete income:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete income",
        variant: "destructive"
      });
    }
  };

  const handleRowClick = (income: Income) => {
    setSelectedIncome(income);
    setIsEditIncomeOpen(true);
  };

  const sortedData = [...incomes].sort((a, b) => {
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

  const handleExport = () => {
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      
      const headers = ['Date', 'Description', 'Category', 'Amount', 'Payment Method'];
      
      const csvData = filteredData.map(income => [
        `"${new Date(income.date).toLocaleDateString()}"`,
        `"${income.description.replace(/"/g, '""')}"`,
        `"${income.category.name}"`,
        `"${income.amount.toFixed(2)}"`,
        `"${income.paymentMethod.name}"`
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `income_export_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      toast({
        title: "Success",
        description: "Income data exported successfully",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Error",
        description: "Failed to export income data",
        variant: "destructive"
      });
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-2xl font-bold">Income Tracker</CardTitle>
              {/* Add Income Dialog */}
              <Dialog open={isAddIncomeOpen} onOpenChange={setIsAddIncomeOpen}>
                <DialogTrigger asChild>
                  <Button>Add Income</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Income</DialogTitle>
                    <DialogDescription>
                      Enter your income details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleAddIncome(new FormData(e.currentTarget));
                  }}>
                    <div className="grid gap-4 py-4">
                      <Input name="description" type="text" placeholder="Description" required />
                      <Input name="amount" type="number" placeholder="Amount" step="0.01" required />
                      <Select name="category">
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {Object.entries(INCOME_CATEGORIES).map(([name, icon]) => (
                            <SelectItem key={name} value={name}>
                              <span className="flex items-center gap-2">
                                {icon}
                                {name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select name="paymentMethod">
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
                      <Input name="date" type="date" required />
                      
                      <div className="flex items-center gap-4">
                        <Switch
                          id="recurring"
                          checked={isRecurring}
                          onCheckedChange={setIsRecurring}
                        />
                        <Label htmlFor="recurring">Recurring Income</Label>
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
                      <Button type="submit">Save</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              {/* Search and filter controls */}
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Input
                  type="text"
                  placeholder="Search income..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={value => setSelectedCategory(value as IncomeCategory | 'all')}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className='bg-white'>
                    <SelectItem value="all">All Categories</SelectItem>
                    {Object.entries(INCOME_CATEGORIES).map(([name, icon]) => (
                      <SelectItem key={name} value={name}>
                        <span className="flex items-center gap-2">
                          {icon}
                          {name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Income Table */}
              <div className="flex-1 min-h-0 rounded-md border">
                <div className="h-full overflow-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {['Date', 'Description', 'Category', 'Amount', 'Payment Method'].map(header => (
                          <th key={header} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((income, index) => (
                        <tr
                          key={income.id}
                          onClick={() => handleRowClick(income)}
                          className={`
                            ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
                            hover:bg-muted cursor-pointer transition-colors
                          `}
                        >
                          <td className="px-6 py-4">{new Date(income.date).toLocaleDateString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {income.recurring && <Repeat className="w-4 h-4" />}
                              {income.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2">
                              {INCOME_CATEGORIES[income.category.name as IncomeCategory]}
                              {income.category.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-success">+${income.amount.toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2">
                              {PAYMENT_METHODS.find(pm => pm.name === income.paymentMethod.name)?.icon}
                              {income.paymentMethod.name.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Edit Dialog */}
              <Dialog open={isEditIncomeOpen} onOpenChange={setIsEditIncomeOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Income</DialogTitle>
                    <DialogDescription>
                      Modify the income details below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleEditIncome(new FormData(e.currentTarget));
                  }}>
                    <div className="grid gap-4 py-4">
                      <Input 
                        name="description" 
                        type="text" 
                        placeholder="Description" 
                        defaultValue={selectedIncome?.description}
                        required 
                      />
                      <Input 
                        name="amount" 
                        type="number" 
                        placeholder="Amount" 
                        step="0.01" 
                        defaultValue={selectedIncome?.amount}
                        required 
                      />
                      <Select name="category" defaultValue={selectedIncome?.category.name}>
                        <SelectTrigger>
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className='bg-white'>
                          {Object.entries(INCOME_CATEGORIES).map(([name, icon]) => (
                            <SelectItem key={name} value={name}>
                              <span className="flex items-center gap-2">
                                {icon}
                                {name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select name="paymentMethod" defaultValue={selectedIncome?.paymentMethod.name}>
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
                        defaultValue={selectedIncome?.date.split('T')[0]}
                        required 
                      />
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          if (selectedIncome) {
                            handleDeleteIncome(selectedIncome.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* Footer */}
              <div className="flex justify-between items-center mt-auto pt-4 shrink-0">
                <p className="text-lg font-semibold">
                  Total Income: ${totalAmount.toFixed(2)}
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
      <ToastViewport />
    </ToastProvider>
  );
}
