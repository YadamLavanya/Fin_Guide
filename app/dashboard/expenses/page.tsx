"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
  Repeat,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const ICONS = {
  Food: <ShoppingCart className="w-4 h-4" />,
  Housing: <Home className="w-4 h-4" />,
  Bills: <Receipt className="w-4 h-4" />,
  Transport: <Car className="w-4 h-4" />,
  Entertainment: <Coffee className="w-4 h-4" />,
  Shopping: <Gift className="w-4 h-4" />,
  Other: <Smartphone className="w-4 h-4" />,
};

const PAYMENT_METHODS = [
  { name: "CASH", icon: <Wallet className="w-4 h-4" /> },
  { name: "CREDIT_CARD", icon: <CreditCard className="w-4 h-4" /> },
  { name: "DEBIT_CARD", icon: <CreditCard className="w-4 h-4" /> },
  { name: "BANK_TRANSFER", icon: <Building2 className="w-4 h-4" /> },
  { name: "OTHER", icon: <MoreHorizontal className="w-4 h-4" /> },
];

type ExpenseCategory = keyof typeof ICONS;
type PaymentMethod = (typeof PAYMENT_METHODS)[number]["name"] | "OTHER_CUSTOM";

interface Expense {
  id: string;
  date: string;
  description: string;
  category: { name: string; icon: string };
  amount: number;
  paymentMethod: { name: PaymentMethod };
  recurring?: {
    pattern: {
      type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      frequency: number;
    };
    startDate: string;
    endDate?: string | null;
    nextProcessDate: string;
  };
}

interface SortConfig {
  key: keyof Expense;
  direction: "ascending" | "descending";
}

interface ExpenseFormData {
  description: string;
  amount: number;
  category: string;
  paymentMethod: PaymentMethod;
  date: string;
  recurring?: {
    pattern: {
      type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      frequency: number;
    };
    startDate: string;
    endDate?: string;
  };
}

const convertToCSV = (expenses: Expense[]) => {
  const headers = [
    "Date",
    "Description",
    "Category",
    "Amount",
    "Payment Method",
  ];
  const rows = expenses.map((expense) => [
    new Date(expense.date).toLocaleDateString(),
    expense.description,
    expense.category.name,
    expense.amount.toFixed(2),
    expense.paymentMethod.name,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csvContent;
};

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "date",
    direction: "ascending",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | "all">("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "range" | "month">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchExpenses = async () => {
    try {
      const response = await fetch("/api/expense");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load your expenses. Please try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const validateExpenseForm = (formData: FormData): ExpenseFormData | null => {
    const amount = parseFloat(formData.get("amount") as string);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return null;
    }

    const data: ExpenseFormData = {
      description: formData.get("description") as string,
      amount,
      category: formData.get("category") as string,
      paymentMethod: formData.get("paymentMethod") as PaymentMethod,
      date: formData.get("date") as string,
    };

    if (isRecurring) {
      const frequency = parseInt(formData.get("frequency") as string, 10);
      const recurringType = formData.get("recurringType") as "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
      
      if (!recurringType) {
        toast({
          title: "Error",
          description: "Please select a recurring frequency type",
          variant: "destructive",
        });
        return null;
      }

      if (isNaN(frequency) || frequency <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid frequency",
          variant: "destructive",
        });
        return null;
      }

      data.recurring = {
        pattern: {
          type: recurringType,
          frequency: frequency
        },
        startDate: data.date,
        endDate: (formData.get("endDate") as string) || undefined,
      };
    }

    return data;
  };

  const handleAddExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const validatedData = validateExpenseForm(formData);
    if (!validatedData) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/expense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add expense");
      }

      toast({
        title: "Success",
        description: "Expense added successfully.",
      });
      await fetchExpenses();
      setIsAddExpenseOpen(false);  // Add this line
      resetFormState();  // Already exists in handleDialogClose
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description:
          "Could not add expense. Please check your input and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditExpense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const validatedData = validateExpenseForm(formData);
    if (!validatedData) {
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/expense", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedExpense?.id, ...validatedData }),
      });

      if (!response.ok) {
        throw new Error("Failed to update expense");
      }

      toast({
        title: "Success",
        description: "Expense updated successfully.",
      });
      await fetchExpenses();
      handleDialogClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Error",
        description: "Could not update expense. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      const response = await fetch(`/api/expense?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Expense deleted successfully.",
        });
        fetchExpenses();
      } else {
        throw new Error("Failed to delete expense");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete expense. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSort = (key: keyof Expense) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const sortedData = [...expenses].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
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

  const defaultCategories = [
    { name: "Food", icon: <ShoppingCart className="w-4 h-4" /> },
    { name: "Housing", icon: <Home className="w-4 h-4" /> },
    { name: "Bills", icon: <Receipt className="w-4 h-4" /> },
    { name: "Transport", icon: <Car className="w-4 h-4" /> },
    { name: "Entertainment", icon: <Coffee className="w-4 h-4" /> },
    { name: "Shopping", icon: <Gift className="w-4 h-4" /> },
    { name: "Other", icon: <Smartphone className="w-4 h-4" /> },
  ];

  const handleRowClick = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsEditExpenseOpen(true);
  };

  const handlePaymentMethodChange = (value: PaymentMethod) => {
    setSelectedPaymentMethod(value);
    if (value !== "OTHER_CUSTOM") {
      setCustomPaymentMethod("");
    }
  };

  const handleExport = () => {
    try {
      const csvContent = convertToCSV(filteredData);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `expenses-${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "Success",
        description: "Expenses exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not export expenses. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getDefaultPaymentMethod = (expense: Expense | null) => {
    if (!expense) return "CASH";
    return PAYMENT_METHODS.some((pm) => pm.name === expense.paymentMethod.name)
      ? expense.paymentMethod.name
      : "OTHER_CUSTOM";
  };

  const resetFormState = () => {
    setIsRecurring(false);
    setSelectedPaymentMethod("CASH");
    setCustomPaymentMethod("");
    setSelectedExpense(null);
  };

  const handleDialogClose = () => {
    setIsAddExpenseOpen(false);
    setIsEditExpenseOpen(false);
    resetFormState();
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
    <div className="relative">
      <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-2xl font-bold">
                Expense Tracker
              </CardTitle>
              <Dialog open={isAddExpenseOpen} onOpenChange={setIsAddExpenseOpen}>
                <DialogTrigger asChild>
                  <Button className="shrink-0" onClick={() => setIsAddExpenseOpen(true)}>Add Expense</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                      Enter the details of your expense below
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense}>
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
                        <SelectContent className="bg-white">
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
                        <SelectContent className="bg-white">
                          {PAYMENT_METHODS.map(({ name, icon }) => (
                            <SelectItem key={name} value={name}>
                              <span className="flex items-center gap-2">
                                {icon}
                                {name.replace("_", " ")}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedPaymentMethod === "OTHER_CUSTOM" && (
                        <Input
                          name="customPaymentMethod"
                          type="text"
                          placeholder="Enter custom payment method"
                          value={customPaymentMethod}
                          onChange={(e) =>
                            setCustomPaymentMethod(e.target.value)
                          }
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
                            <SelectContent className="bg-white">
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
              <div className="flex flex-col gap-4 shrink-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:max-w-sm"
                  />
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) =>
                      setSelectedCategory(value as ExpenseCategory | "all")
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-zinc-950">
                      <SelectItem value="all">
                        <span className="flex items-center gap-2">
                          All Categories
                        </span>
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

              {/* Expense Table/Cards */}
              <div className="flex-1 min-h-0">
                {/* Desktop Table View */}
                <div className="hidden md:block rounded-md border overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50 sticky top-0">
                        <tr>
                          <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            onClick={() => handleSort('date')}
                          >
                            Date
                            {sortConfig.key === 'date' && (
                              <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                            )}
                          </th>
                          <th className="w-[30%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            onClick={() => handleSort('description')}
                          >
                            Description
                            {sortConfig.key === 'description' && (
                              <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                            )}
                          </th>
                          <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            onClick={() => handleSort('category')}
                          >
                            Category
                            {sortConfig.key === 'category' && (
                              <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                            )}
                          </th>
                          <th className="w-[15%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            onClick={() => handleSort('amount')}
                          >
                            Amount
                            {sortConfig.key === 'amount' && (
                              <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                            )}
                          </th>
                          <th className="w-[20%] px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                            onClick={() => handleSort('paymentMethod')}
                          >
                            Payment Method
                            {sortConfig.key === 'paymentMethod' && (
                              <span>{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                            )}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedData.map((expense, index) => (
                          <tr
                            key={expense.id}
                            onClick={() => handleRowClick(expense)}
                            className={`
                              ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
                              ${selectedRows.includes(expense.id) ? 'bg-primary/10' : ''}
                              hover:bg-muted cursor-pointer transition-colors
                            `}
                          >
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap">
                              {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td className="w-[30%] px-6 py-4">
                              <div className="flex items-center gap-2 max-w-[300px]">
                                {expense.recurring && Object.keys(expense.recurring).length > 0 && (
                                  <Repeat className="w-4 h-4 shrink-0 text-slate-950" />
                                )}
                                <span className="truncate">{expense.description}</span>
                              </div>
                            </td>
                            <td className="w-[20%] px-6 py-4">
                              <span className="flex items-center gap-2">
                                {ICONS[expense.category.name as ExpenseCategory]}
                                <span className="truncate">{expense.category.name}</span>
                              </span>
                            </td>
                            <td className="w-[15%] px-6 py-4 whitespace-nowrap text-destructive">
                              -${expense.amount.toFixed(2)}
                            </td>
                            <td className="w-[20%] px-6 py-4">
                              <span className="flex items-center gap-2">
                                {PAYMENT_METHODS.find(pm => pm.name === expense.paymentMethod.name)?.icon}
                                <span className="truncate">{expense.paymentMethod.name.replace('_', ' ')}</span>
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
                  {paginatedData.map((expense) => (
                    <div
                      key={expense.id}
                      onClick={() => handleRowClick(expense)}
                      className="rounded-lg border bg-card p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            {expense.recurring && Object.keys(expense.recurring).length > 0 && (
                              <Repeat className="w-4 h-4 shrink-0 text-slate-950" />
                            )}
                            <span className="font-medium truncate">{expense.description}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(expense.date).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="text-destructive font-semibold whitespace-nowrap ml-4">
                          -${expense.amount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2 mt-3">
                        <div className="flex items-center gap-2 text-sm">
                          {ICONS[expense.category.name as ExpenseCategory]}
                          <span className="truncate">{expense.category.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {PAYMENT_METHODS.find(pm => pm.name === expense.paymentMethod.name)?.icon}
                          <span className="truncate">{expense.paymentMethod.name.replace('_', ' ')}</span>
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

              <div className="flex flex-col sm:flex-row justify-between items-center mt-auto pt-4 gap-4 shrink-0">
                <p className="text-lg font-semibold order-2 sm:order-1">
                  Total: ${totalAmount.toFixed(2)}
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
          </Card>
        </div>
      </div>
      <Dialog open={isEditExpenseOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Modify the expense details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditExpense}>
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
              <Select
                name="category"
                defaultValue={selectedExpense?.category.name}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-white">
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
                defaultValue={getDefaultPaymentMethod(selectedExpense)}
                value={selectedPaymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {PAYMENT_METHODS.map(({ name, icon }) => (
                    <SelectItem key={name} value={name}>
                      <span className="flex items-center gap-2">
                        {icon}
                        {name.replace("_", " ")}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPaymentMethod === "OTHER_CUSTOM" && (
                <Input
                  name="customPaymentMethod"
                  defaultValue={selectedExpense?.paymentMethod.name}
                  type="text"
                  placeholder="Enter custom payment method"
                  value={customPaymentMethod}
                  onChange={(e) => setCustomPaymentMethod(e.target.value)}
                  required
                />
              )}
              <Input
                name="date"
                type="date"
                defaultValue={selectedExpense?.date.split("T")[0]}
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
    </div>
  );
}
