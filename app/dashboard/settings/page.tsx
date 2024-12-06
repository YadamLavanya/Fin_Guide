"use client"

import { useState } from 'react';
import { useTheme } from "next-themes";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  Upload,
  Download,
  Tags,
  Trash2
} from "lucide-react";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { theme, setTheme } = useTheme();
  const isDarkMode = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return (
    <div className="container h-[calc(100vh-2rem)] mx-auto py-4">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {/* Preferences */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <label className="font-medium">Currency</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose your preferred currency
                  </p>
                </div>
                <Select defaultValue="USD">
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <label className="font-medium">Theme</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                </div>
                <Switch
                  checked={isDarkMode}
                  onCheckedChange={toggleTheme}
                />
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <label className="font-medium">Email Notifications</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your expenses
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>
          </section>

          {/* Categories */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Categories</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Tags className="w-4 h-4" />
                    <label className="font-medium">Manage Categories</label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, or remove expense categories
                  </p>
                </div>
                <Button variant="outline">Manage</Button>
              </div>
            </div>
          </section>

          {/* Data Management */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Data Management</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Data
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Import Data
                </Button>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </Button>
              </div>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}