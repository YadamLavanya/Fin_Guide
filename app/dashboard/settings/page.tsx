"use client"

import { useState, useEffect } from 'react';
import { useTheme } from "@/components/theme/theme-provider";
import { useToast } from "@/components/ui/use-toast";
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
  MoreVertical,
  Brain,
  Check,
  EyeIcon,
  EyeOffIcon,
  Link,
  Palette
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
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { themes } from "@/lib/themes";

interface LLMProvider {
  id: string;
  name: string;
  svgPath: string;  // Changed from icon to svgPath
  description: string;
  requiresApiKey: boolean;
  apiKeyPlaceholder?: string;
  apiKeyLink?: string;
  extraSettings?: {
    baseUrl?: boolean;
    modelOptions?: string[];
    customModel?: boolean;
    contextLength?: boolean;
    temperature?: boolean;
    systemPrompt?: boolean;
  };
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    currency: 'USD',
    notifications: { email: true }
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<CategorySettings[]>([]);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategorySettings | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showLLMDialog, setShowLLMDialog] = useState(false);
  const [selectedLLM, setSelectedLLM] = useState<string>('gpt-4'); // or whatever default
  const [showApiKey, setShowApiKey] = useState<{[key: string]: boolean}>({});
  const [apiKeys, setApiKeys] = useState<{[key: string]: string}>(() => {
    if (typeof window !== 'undefined') {
      return JSON.parse(localStorage.getItem('llm-api-keys') || '{}');
    }
    return {};
  });
  const [ollamaSettings, setOllamaSettings] = useState({
    baseUrl: 'http://localhost:11434',
    model: 'llama2',
  });
  const [showProviderConfig, setShowProviderConfig] = useState(false);
  const [ollamaConfig, setOllamaConfig] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('ollama-config');
      return savedConfig ? JSON.parse(savedConfig) : {
        baseUrl: 'http://localhost:11434',
        model: 'llama2',
        customModel: '',
        contextLength: 4096,
        temperature: 0.7,
      };
    }
    return {
      baseUrl: 'http://localhost:11434',
      model: 'llama2',
      customModel: '',
      contextLength: 4096,
      temperature: 0.7,
    };
  });
  const [defaultLLM, setDefaultLLM] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('default-llm') || 'openai';
    }
    return 'openai';
  });

  const llmProviders: LLMProvider[] = [
    // {
    //   id: 'openai',
    //   name: 'OpenAI',
    //   svgPath: '/openai.svg',
    //   description: 'GPT-3.5, GPT-4, and more',
    //   requiresApiKey: true,
    //   apiKeyPlaceholder: 'sk-...',
    //   apiKeyLink: 'https://platform.openai.com/api-keys',
    // },
    // {
    //   id: 'anthropic',
    //   name: 'Anthropic',
    //   svgPath: '/anthropic.svg',
    //   description: 'Claude and Claude Instant',
    //   requiresApiKey: true,
    //   apiKeyPlaceholder: 'sk-ant-...',
    //   apiKeyLink: 'https://console.anthropic.com/account/keys',
    // },
    {
      id: 'ollama',
      name: 'Ollama',
      svgPath: '/ollama.png', // Using PNG for Ollama
      description: 'Run models locally',
      requiresApiKey: false,
      extraSettings: {
        baseUrl: true,
        customModel: true,
        contextLength: true,
        temperature: true,
      },
    },
    // {
    //   id: 'google',
    //   name: 'Google AI',
    //   svgPath: '/google.svg',
    //   description: 'PaLM and Gemini',
    //   requiresApiKey: true,
    //   apiKeyPlaceholder: 'AIza...',
    //   apiKeyLink: 'https://makersuite.google.com/app/apikeys',
    // },
    {
      id: 'cohere',
      name: 'Cohere',
      svgPath: '/cohere.svg',
      description: 'Command and Generate',
      requiresApiKey: true,
      apiKeyPlaceholder: 'co-...',
      apiKeyLink: 'https://dashboard.cohere.com/api-keys',
    },
    // {
    //   id: 'mistral',
    //   name: 'Mistral AI',
    //   svgPath: '/mistral.svg',
    //   description: 'Mistral-7B and more',
    //   requiresApiKey: true,
    //   apiKeyPlaceholder: 'mis-...',
    //   apiKeyLink: 'https://console.mistral.ai/api-keys/',
    // },
    // {
    //   id: 'azure',
    //   name: 'Azure OpenAI',
    //   svgPath: '/azure.svg',
    //   description: 'Azure-hosted models',
    //   requiresApiKey: true,
    //   apiKeyPlaceholder: 'azure-key',
    //   apiKeyLink: 'https://portal.azure.com/',
    // },
    {
      id: 'groq',
      name: 'Groq',
      svgPath: '/groq.svg',
      description: 'Ultra-fast inference',
      requiresApiKey: true,
      apiKeyPlaceholder: 'gsk_...',
      apiKeyLink: 'https://console.groq.com/keys',
      extraSettings: {
        modelOptions: ['mixtral-8x7b-32768', 'llama2-70b-4096'],
      },
    },
  ];

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
      toast({
        title: "Error",
        description: "Could not load your settings. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not load your categories. Please try again later.",
        variant: "destructive",
      });
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
      
      // Update localStorage and state
      Object.entries(updates).forEach(([key, value]) => {
        if (key === 'notifications') {
          localStorage.setItem('email-notifications', value.email.toString());
        } else {
          localStorage.setItem(key, value as string);
        }
      });
      
      setSettings(newSettings);
      toast({
        title: "Success",
        description: "Your settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update your settings. Please try again later.",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: `Category ${action === 'create' ? 'created' : action === 'update' ? 'updated' : 'deleted'} successfully.`,
      });
      setShowCategoryDialog(false);
      setEditingCategory(null);
    } catch (error) {
      toast({
        title: "Error",
        description: `Could not ${action} category. Please try again later.`,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: "Could not verify your export request. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleExportConfirm = async () => {
    try {
      const response = await fetch('/api/export', {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error('Export failed');
      toast({
        title: "Success",
        description: "Your data export has been sent to your email address.",
      });
      setShowExportDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not export your data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleVerificationConfirm = async () => {
    try {
      const response = await fetch('/api/verify', {
        method: 'POST'
      });
      const data = await response.json();
      toast({
        title: "Success",
        description: "Please check your email for the verification link.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not send verification email. Please try again later.",
        variant: "destructive",
      });
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
      toast({
        title: "Success",
        description: "Your data has been imported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not import your data. Please ensure the file format is correct.",
        variant: "destructive",
      });
    }
  };

  const handleClearData = async () => {
    try {
      const response = await fetch('/api/settings/clear-data', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear data');
      toast({
        title: "Success",
        description: "All your data has been cleared successfully.",
      });
      setShowClearDataDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not clear your data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch('/api/settings/delete-account', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to delete account');
      toast({
        title: "Success",
        description: "Your account will be deleted shortly. You will be redirected...",
      });
      // Redirect to home page after a short delay
      setTimeout(() => window.location.href = '/', 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not delete your account. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleLLMSelection = async (llmId: string) => {
    try {
      setSelectedLLM(llmId);
      // Add your API call here to update the LLM preference
      toast({
        title: "Success",
        description: "LLM preference updated successfully.",
      });
      setShowLLMDialog(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update LLM preference.",
        variant: "destructive",
      });
    }
  };

  const handleApiKeyChange = (providerId: string, value: string) => {
    const newApiKeys = { ...apiKeys, [providerId]: value };
    setApiKeys(newApiKeys);
    localStorage.setItem('llm-api-keys', JSON.stringify(newApiKeys));
  };

  const handleOllamaSettingsChange = (settings: typeof ollamaSettings) => {
    setOllamaSettings(settings);
    localStorage.setItem('ollama-settings', JSON.stringify(settings));
  };

  const handleOllamaConfigChange = (updates: Partial<typeof ollamaConfig>) => {
    const newConfig = { ...ollamaConfig, ...updates };
    setOllamaConfig(newConfig);
    localStorage.setItem('ollama-config', JSON.stringify(newConfig));

    // Also update the provider settings in apiKeys
    if (selectedLLM === 'ollama') {
      const ollamaProviderConfig = {
        baseUrl: newConfig.baseUrl,
        model: newConfig.customModel || newConfig.model,
        contextLength: newConfig.contextLength,
        temperature: newConfig.temperature
      };
      handleApiKeyChange('ollama-config', JSON.stringify(ollamaProviderConfig));
    }
  };

  // Add this function to handle default LLM change
  const handleDefaultLLMChange = (llmId: string) => {
    setDefaultLLM(llmId);
    localStorage.setItem('default-llm', llmId);
    toast({
      title: "Success",
      description: "Default LLM updated successfully.",
    });
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground">
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
                      <Palette className="w-4 h-4" />
                      <label className="font-medium">Theme</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred theme
                    </p>
                  </div>
                  <Select
                    value={theme}
                    onValueChange={(value) => {
                      setTheme(value);
                      localStorage.setItem('app-theme', value);
                    }}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent className='bg-white'>
                      {themes.map((t) => (
                        <SelectItem key={t.name} value={t.name}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

            {/* Add this new section before Data Management */}
            <section>
              <h2 className="text-lg font-semibold mb-4">AI Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      <label className="font-medium">Language Model</label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Choose your preferred AI language model
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Select value={defaultLLM} onValueChange={handleDefaultLLMChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Choose default LLM" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {llmProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      onClick={() => setShowLLMDialog(true)}
                      className="flex items-center gap-2"
                    >
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </section>

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
      <Dialog open={showLLMDialog} onOpenChange={setShowLLMDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Choose Language Model</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {llmProviders.map((provider) => (
              <div
                key={provider.id}
                className={`relative cursor-pointer group`}
                onClick={() => {
                  setSelectedLLM(provider.id);
                  setShowProviderConfig(true);
                }}
              >
                <div className={`
                  p-4 rounded-lg border-2 
                  ${selectedLLM === provider.id ? 'border-primary' : 'border-border'}
                  hover:border-primary transition-colors
                  aspect-square flex flex-col items-center justify-center gap-2
                  bg-card
                `}>
                  <div className="w-12 h-12 relative">
                    <Image
                      src={provider.svgPath}
                      alt={provider.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <h3 className="font-semibold">{provider.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {provider.description}
                  </p>
                  {selectedLLM === provider.id && (
                    <div className="absolute top-2 right-2">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showProviderConfig} onOpenChange={setShowProviderConfig}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {llmProviders.find(p => p.id === selectedLLM)?.name}</DialogTitle>
          </DialogHeader>
          {selectedLLM === 'ollama' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Base URL</Label>
                <Input
                  value={ollamaConfig.baseUrl}
                  onChange={(e) => handleOllamaConfigChange({ baseUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                />
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={ollamaConfig.model}
                  onValueChange={(value) => handleOllamaConfigChange({ model: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="llama2">Llama 2</SelectItem>
                    <SelectItem value="codellama">Code Llama</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                    <SelectItem value="custom">Custom Model</SelectItem>
                  </SelectContent>
                </Select>
                {ollamaConfig.model === 'custom' && (
                  <Input
                    className="mt-2"
                    placeholder="Enter custom model name"
                    value={ollamaConfig.customModel}
                    onChange={(e) => handleOllamaConfigChange({ customModel: e.target.value })}
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Context Length</Label>
                <Input
                  type="number"
                  value={ollamaConfig.contextLength}
                  onChange={(e) => handleOllamaConfigChange({ contextLength: parseInt(e.target.value) })}
                  min={1}
                  max={32768}
                />
              </div>
              <div className="space-y-2">
                <Label>Temperature</Label>
                <Input
                  type="number"
                  value={ollamaConfig.temperature}
                  onChange={(e) => handleOllamaConfigChange({ temperature: parseFloat(e.target.value) })}
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>
            </div>
          ) : selectedLLM === 'groq' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Model</Label>
                <div className="space-y-2">
                  <Select
                    value={apiKeys[`${selectedLLM}-model`] || 'mixtral-8x7b-32768'}
                    onValueChange={(value) => handleApiKeyChange(`${selectedLLM}-model`, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Model</SelectItem>
                      {llmProviders.find(p => p.id === selectedLLM)?.extraSettings?.modelOptions?.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {apiKeys[`${selectedLLM}-model`] === 'custom' && (
                    <Input
                      placeholder="Enter custom model name"
                      value={apiKeys[`${selectedLLM}-custom-model`] || ''}
                      onChange={(e) => handleApiKeyChange(`${selectedLLM}-custom-model`, e.target.value)}
                    />
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>API Key</Label>
                  <a
                    href={llmProviders.find(p => p.id === selectedLLM)?.apiKeyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Get API Key <Link className="h-3 w-3" />
                  </a>
                </div>
                <div className="relative">
                  <Input
                    type={showApiKey[selectedLLM] ? 'text' : 'password'}
                    value={apiKeys[selectedLLM] || ''}
                    onChange={(e) => handleApiKeyChange(selectedLLM, e.target.value)}
                    placeholder={llmProviders.find(p => p.id === selectedLLM)?.apiKeyPlaceholder}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(prev => ({
                      ...prev,
                      [selectedLLM]: !prev[selectedLLM]
                    }))}
                  >
                    {showApiKey[selectedLLM] ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>API Key</Label>
                  {llmProviders.find(p => p.id === selectedLLM)?.apiKeyLink && (
                    <a
                      href={llmProviders.find(p => p.id === selectedLLM)?.apiKeyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Get API Key <Link className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showApiKey[selectedLLM] ? 'text' : 'password'}
                    value={apiKeys[selectedLLM] || ''}
                    onChange={(e) => handleApiKeyChange(selectedLLM, e.target.value)}
                    placeholder={llmProviders.find(p => p.id === selectedLLM)?.apiKeyPlaceholder}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                    onClick={() => setShowApiKey(prev => ({
                      ...prev,
                      [selectedLLM]: !prev[selectedLLM]
                    }))}
                  ></Button>
                    <Button>
                    {showApiKey[selectedLLM] ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}