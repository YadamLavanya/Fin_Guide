"use client"

import { useState, useEffect } from 'react';
import { useTheme } from "next-themes";
import { toast } from "sonner";
import type { UserSettings, CategorySettings } from '@/lib/types';
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
  Trash2,
  MoreVertical
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'USD',
    theme: 'light',
    notifications: {
      email: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategorySettings[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySettings | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCategories();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSettingChange = async (updates: Partial<UserSettings>) => {
    setLoading(true);
    try {
      const newSettings = { ...settings, ...updates };
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) throw new Error('Failed to update settings');
      setSettings(newSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryAction = async (action: 'create' | 'update' | 'delete', category?: CategorySettings) => {
    try {
      const url = '/api/categories' + (category?.id ? `/${category.id}` : '');
      const method = action === 'create' ? 'POST' : action === 'update' ? 'PUT' : 'DELETE';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: action !== 'delete' ? JSON.stringify(category) : undefined,
      });

      if (!response.ok) throw new Error(`Failed to ${action} category`);
      
      await fetchCategories();
      toast.success(`Category ${action}d successfully`);
      setShowCategoryDialog(false);
      setEditingCategory(null);
    } catch (error) {
      toast.error(`Failed to ${action} category`);
    }
  };

  const handleDataExport = async () => {
    try {
      // First check if verification is needed
      const checkResponse = await fetch('/api/verify', {
        method: 'GET'
      });
      const { verified } = await checkResponse.json();

      if (!verified) {
        setShowVerifyDialog(true);
        return;
      }

      // If verified, show export confirmation dialog
      setShowExportDialog(true);
    } catch (error) {
      toast.error('Failed to check verification status');
    }
  };

  const handleExportConfirm = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Export failed');
      toast.success('Data export has been sent to your email');
      setShowExportDialog(false);
    } catch (error) {
      toast.error('Failed to export data');
    }
  };

  const handleVerificationConfirm = async () => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST'
      });
      const data = await response.json();
      toast.info(data.message || 'Please check your email to verify your account');
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setShowVerifyDialog(false);
    }
  };

  const handleDataImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Import failed');
      toast.success('Data imported successfully');
    } catch (error) {
      toast.error('Failed to import data');
    }
  };

  const handleClearData = async () => {
    try {
      const response = await fetch('/api/settings/clear-data', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear data');
      toast.success('All transactions cleared successfully');
      setShowClearDataDialog(false);
    } catch (error) {
      toast.error('Failed to clear data');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/settings/delete-account', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to delete account');
      toast.success('Account deletion initiated. You will be signed out shortly.');
      // Redirect to home page after a short delay
      setTimeout(() => window.location.href = '/', 2000);
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
      <div className="w-full h-full p-4 md:p-6 lg:p-8">
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
                  <Select
                    value={settings.currency}
                    onValueChange={(value) => handleSettingChange({ currency: value })}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                      <label className="font-medium">Theme</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Switch between light and dark mode
                    </p>
                  </div>
                  <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={(checked) => {
                      const newTheme = checked ? 'dark' : 'light';
                      setTheme(newTheme);
                      handleSettingChange({ theme: newTheme });
                    }}
                    disabled={loading}
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
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => 
                      handleSettingChange({ 
                        notifications: { ...settings.notifications, email: checked } 
                      })
                    }
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            {/* Categories
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
                  <Button 
                    variant="outline"
                    onClick={() => setShowCategoryDialog(true)}
                    disabled={loading}
                  >
                    Manage
                  </Button>
                </div>
              </div>

              <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Manage Categories</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Button
                      onClick={() => {
                        setEditingCategory({ id: '', name: '', isDefault: false });
                        setShowCategoryDialog(true);
                      }}
                    >
                      Add New Category
                    </Button>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-2 rounded-lg border">
                          <span>{category.name}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setEditingCategory(category)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleCategoryAction('delete', category)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory?.id ? 'Edit' : 'Add'} Category
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label>Name</label>
                      <Input
                        value={editingCategory?.name || ''}
                        onChange={(e) => setEditingCategory({
                          ...editingCategory!,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setEditingCategory(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleCategoryAction(
                          editingCategory?.id ? 'update' : 'create',
                          editingCategory!
                        )}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </section> */}

            {/* Data Management */}
            <section>
              <h2 className="text-lg font-semibold mb-4">Data Management</h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={handleDataExport}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => document.getElementById('import-input')?.click()}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4" />
                    Import Data
                  </Button>
                  <input
                    id="import-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleDataImport}
                  /> */}
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                    onClick={() => setShowClearDataDialog(true)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </section>

            {/* Account Actions */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
              <div className="space-y-4 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      This will permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteAccountDialog(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
      <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Email Verification Required</AlertDialogTitle>
            <AlertDialogDescription>
              To export your data, we need to verify your email address. Would you like to receive a verification email?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVerificationConfirm}>
              Send Verification Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all of your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showClearDataDialog} onOpenChange={setShowClearDataDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your transactions and financial records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearData}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a file containing all your financial records and send it to your email address.
              Do you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleExportConfirm}
            >
              Export Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}