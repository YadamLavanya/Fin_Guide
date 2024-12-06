"use client"

import { useState } from 'react';
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
  Download
} from "lucide-react"

const CATEGORIES = [
  { value: 'Food', icon: <ShoppingCart className="w-4 h-4" /> },
  { value: 'Housing', icon: <Home className="w-4 h-4" /> },
  { value: 'Bills', icon: <Receipt className="w-4 h-4" /> },
  { value: 'Transport', icon: <Car className="w-4 h-4" /> },
  { value: 'Entertainment', icon: <Coffee className="w-4 h-4" /> },
  { value: 'Shopping', icon: <Gift className="w-4 h-4" /> },
  { value: 'Other', icon: <Smartphone className="w-4 h-4" /> }
] as const;

type ExpenseCategory = typeof CATEGORIES[number]['value'];

interface Expense {
  id: number;
  date: string;
  description: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: string;
}

interface SortConfig {
  key: keyof Expense;
  direction: 'ascending' | 'descending';
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: 1, date: '2024-03-01', description: 'Groceries', category: 'Food', amount: 99.99, paymentMethod: 'Credit Card' },
    { id: 2, date: '2024-03-02', description: 'Rent', category: 'Housing', amount: 1500, paymentMethod: 'Bank Transfer' },
    { id: 3, date: '2024-03-03', description: 'Netflix', category: 'Entertainment', amount: 15.99, paymentMethod: 'Credit Card' },
  ]);
  
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'ascending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');
  const [selectedRows, setSelectedRows] = useState<number[]>([]);

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
    (selectedCategory === 'all' || item.category === selectedCategory)
  );

  const totalAmount = filteredData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="container h-[calc(100vh-2rem)] mx-auto py-4">
      <Card className="h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
          <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
          <div className="flex items-center gap-2">
            <Button>Add Expense</Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
          {/* Search controls - fixed at top */}
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
                {CATEGORIES.map(({value, icon}) => (
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
                        onClick={() => setSelectedRows(prev => 
                          prev.includes(expense.id) 
                            ? prev.filter(id => id !== expense.id)
                            : [...prev, expense.id]
                        )}
                        className={`
                          ${index % 2 === 0 ? 'bg-background' : 'bg-muted/50'}
                          ${selectedRows.includes(expense.id) ? 'bg-primary/10' : ''}
                          hover:bg-muted cursor-pointer transition-colors
                        `}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">{expense.description}</td>
                        <td className="px-6 py-4">
                          <span className="flex items-center gap-2">
                            {CATEGORIES.find(cat => cat.value === expense.category)?.icon}
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">${expense.amount.toFixed(2)}</td>
                        <td className="px-6 py-4">{expense.paymentMethod}</td>
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
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
}