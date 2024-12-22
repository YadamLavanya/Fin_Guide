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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<IncomeCategory | "all">("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const { toast } = useToast();
  const [isEditIncomeOpen, setIsEditIncomeOpen] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "range" | "month">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditIncome = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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

  const filteredData = sortedData.filter((item) => {
    // Text search filter
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === "all" || item.category.name === selectedCategory;
    
    // Date filtering
    let matchesDate = true;
    const itemDate = new Date(item.date);
    
    if (dateFilter === "range" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end date
      matchesDate = itemDate >= start && itemDate <= end;
    } else if (dateFilter === "month" && selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      matchesDate = 
        itemDate.getFullYear() === parseInt(year) &&
        itemDate.getMonth() === parseInt(month) - 1;
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

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

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of the table/cards when page changes
    const contentElement = document.querySelector('.flex-1.min-h-0');
    if (contentElement) {
      contentElement.scrollTop = 0;
    }
  };

  return (
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
              <DialogContent className="sm:max-w-[425px] w-[95vw]">
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
                      <SelectTrigger className="w-full">
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
                      <SelectTrigger className="w-full">
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
                          <SelectTrigger className="w-full">
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
                          className="w-full"
                        />
                        <Input
                          name="endDate"
                          type="date"
                          placeholder="End Date (Optional)"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                      {isSubmitting ? "Saving..." : "Save"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
            {/* Search and filter controls */}
            <div className="flex flex-col gap-4 shrink-0">
              <div className="flex flex-col sm:flex-row gap-4">
                <Input
                  type="text"
                  placeholder="Search income..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full sm:max-w-sm"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={value => setSelectedCategory(value as IncomeCategory | 'all')}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
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

              {/* Date Filter Controls */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Select
                  value={dateFilter}
                  onValueChange={(value: "all" | "range" | "month") => {
                    setDateFilter(value);
                    // Reset other date filters when changing type
                    setStartDate("");
                    setEndDate("");
                    setSelectedMonth("");
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Date Filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="range">Date Range</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                  </SelectContent>
                </Select>

                {dateFilter === "range" && (
                  <>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full sm:w-auto"
                      />
                      <span className="hidden sm:inline">to</span>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  </>
                )}

                {dateFilter === "month" && (
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full sm:w-[180px]"
                  />
                )}
              </div>
            </div>

            {/* Income Table/Cards */}
            <div className="flex-1 min-h-0">
              {/* Desktop Table View */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <div className="w-full overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Description
                        </th>
                        <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Category
                        </th>
                        <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Payment Method
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((income, index) => (
                        <tr
                          key={income.id}
                          onClick={() => handleRowClick(income)}
                          className={`
                            ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
                            hover:bg-muted cursor-pointer transition-colors
                          `}
                        >
                          <td className="w-[15%] px-6 py-4 whitespace-nowrap">
                            {new Date(income.date).toLocaleDateString()}
                          </td>
                          <td className="w-[30%] px-6 py-4">
                            <div className="flex items-center gap-2 max-w-[300px]">
                              {income.recurring && <Repeat className="w-4 h-4 shrink-0" />}
                              <span className="truncate">{income.description}</span>
                            </div>
                          </td>
                          <td className="w-[20%] px-6 py-4">
                            <span className="flex items-center gap-2">
                              {INCOME_CATEGORIES[income.category.name as IncomeCategory]}
                              <span className="truncate">{income.category.name}</span>
                            </span>
                          </td>
                          <td className="w-[15%] px-6 py-4 text-success whitespace-nowrap">
                            +${income.amount.toFixed(2)}
                          </td>
                          <td className="w-[20%] px-6 py-4">
                            <span className="flex items-center gap-2">
                              {PAYMENT_METHODS.find(pm => pm.name === income.paymentMethod.name)?.icon}
                              <span className="truncate">{income.paymentMethod.name.replace('_', ' ')}</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 overflow-y-auto">
                {paginatedData.map((income) => (
                  <div
                    key={income.id}
                    onClick={() => handleRowClick(income)}
                    className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {income.recurring && <Repeat className="w-4 h-4 shrink-0" />}
                          <span className="font-medium truncate">{income.description}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(income.date).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="text-success font-semibold whitespace-nowrap ml-4">
                        +${income.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-2 mt-3">
                      <div className="flex items-center gap-2 text-sm">
                        {INCOME_CATEGORIES[income.category.name as IncomeCategory]}
                        <span className="truncate">{income.category.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {PAYMENT_METHODS.find(pm => pm.name === income.paymentMethod.name)?.icon}
                        <span className="truncate">{income.paymentMethod.name.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {filteredData.length > itemsPerPage && (
                <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
                  <div className="text-muted-foreground">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    >
                      First
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={i}
                            variant={currentPage === pageNumber ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNumber)}
                            className="w-8"
                          >
                            {pageNumber}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Last
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-auto pt-4 gap-4 shrink-0">
              <p className="text-lg font-semibold order-2 sm:order-1">
                Total Income: ${totalAmount.toFixed(2)}
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExport}
                className="w-full sm:w-auto order-1 sm:order-2"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>

          {/* Edit Dialog */}
          <Dialog open={isEditIncomeOpen} onOpenChange={setIsEditIncomeOpen}>
            <DialogContent className="sm:max-w-[425px] w-[95vw]">
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
                    maxLength={255}
                    pattern="^[a-zA-Z0-9\s\-_.,!?()]+$"
                    defaultValue={selectedIncome?.description}
                    required 
                  />
                  <Input 
                    name="amount" 
                    type="number" 
                    placeholder="Amount" 
                    step="0.01" 
                    min="0.01"
                    max="999999999.99"
                    defaultValue={selectedIncome?.amount}
                    required 
                  />
                  <Select name="category" defaultValue={selectedIncome?.category.name}>
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (selectedIncome && !isSubmitting) {
                        handleDeleteIncome(selectedIncome.id);
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    Delete
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full sm:w-auto"
                  >
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </div>
  );
}
