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
    type: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
    frequency: number;
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
  const [selectedCategory, setSelectedCategory] = useState<
    ExpenseCategory | "all"
  >("all");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [customPaymentMethod, setCustomPaymentMethod] = useState<string>("");
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (isRecurring) {
      const frequency = parseInt(formData.get("frequency") as string, 10);
      if (isNaN(frequency) || frequency <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid frequency",
          variant: "destructive",
        });
        return null;
      }
    }

    const data: ExpenseFormData = {
      description: formData.get("description") as string,
      amount,
      category: formData.get("category") as string,
      paymentMethod: formData.get("paymentMethod") as PaymentMethod,
      date: formData.get("date") as string,
    };

    if (isRecurring) {
      data.recurring = {
        type: formData.get("recurringType") as
          | "DAILY"
          | "WEEKLY"
          | "MONTHLY"
          | "YEARLY",
        frequency: parseInt(formData.get("frequency") as string, 10),
        startDate: formData.get("date") as string,
        endDate: (formData.get("endDate") as string) || undefined,
      };
    }

    return data;
  };

  const handleAddExpense = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

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
      fetchExpenses();
      setIsAddExpenseOpen(false);
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

  const handleEditExpense = async (formData: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

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
      fetchExpenses();
      setIsEditExpenseOpen(false);
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

  const filteredData = sortedData.filter(
    (item) =>
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedCategory === "all" || item.category.name === selectedCategory)
  );

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

  return (
    <div className="relative">
      <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
              <CardTitle className="text-2xl font-bold">
                Expense Tracker
              </CardTitle>
              <Dialog open={isAddExpenseOpen} onOpenChange={handleDialogClose}>
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
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddExpense(new FormData(e.currentTarget));
                    }}
                  >
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
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select
                  value={selectedCategory}
                  onValueChange={(value) =>
                    setSelectedCategory(value as ExpenseCategory | "all")
                  }
                >
                  <SelectTrigger className="w-[180px]">
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

              <div className="flex-1 min-h-0 rounded-md border">
                <div className="h-full overflow-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50 sticky top-0">
                      <tr>
                        {[
                          "Date",
                          "Description",
                          "Category",
                          "Amount",
                          "Payment Method",
                        ].map((header) => (
                          <th
                            key={header}
                            onClick={() =>
                              handleSort(
                                header
                                  .toLowerCase()
                                  .replace(" ", "") as keyof Expense
                              )
                            }
                            className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-primary"
                          >
                            {header}
                            {sortConfig.key ===
                              header.toLowerCase().replace(" ", "") && (
                              <span>
                                {sortConfig.direction === "ascending"
                                  ? " ▲"
                                  : " ▼"}
                              </span>
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
${index % 2 === 0 ? "bg-background" : "bg-muted/50"}
${selectedRows.includes(expense.id) ? "bg-primary/10" : ""}
hover:bg-muted cursor-pointer transition-colors
`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {expense.recurring &&
                                Object.keys(expense.recurring).length > 0 && (
                                  <Repeat className="w-4 h-4 text-slate-950" />
                                )}
                              {expense.description}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2">
                              {ICONS[expense.category.name as ExpenseCategory]}
                              {expense.category.name}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            ${expense.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2">
                              {
                                PAYMENT_METHODS.find(
                                  (pm) => pm.name === expense.paymentMethod.name
                                )?.icon
                              }
                              {expense.paymentMethod.name.replace("_", " ")}
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
      <Dialog open={isEditExpenseOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Modify the expense details below
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditExpense(new FormData(e.currentTarget));
            }}
          >
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
