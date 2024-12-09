"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import type { ProfileData } from '@/lib/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Phone,
  CreditCard,
  AlertCircle,
  Camera,
  DollarSign
} from "lucide-react";
import ProfileSkeleton from './loading';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  // const [imageFile, setImageFile] = useState<File | null>(null);
  // const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [session]);

  const fetchProfile = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // const handleImageUpload = async (file: File) => {
  //   setUploadingImage(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append('file', file);
      
  //     const response = await fetch('/api/upload', {
  //       method: 'POST',
  //       body: formData,
  //     });
      
  //     if (!response.ok) throw new Error('Upload failed');
      
  //     const { url } = await response.json();
  //     return url;
  //   } catch (error) {
  //     toast.error('Failed to upload image');
  //     return null;
  //   } finally {
  //     setUploadingImage(false);
  //   }
  // };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: profile?.preferences?.currency?.code || 'USD'
    }).format(amount);
  };

  const getTrackedSince = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short',
      year: 'numeric'
    });
  };

  const stats = [
    { 
      label: 'Total Expenses', 
      value: formatCurrency(profile?.stats?.totalExpenses || 0)
    },
    { 
      label: 'Categories Used', 
      value: profile?.stats?.categoriesCount || 0
    },
    { 
      label: 'Tracked Since', 
      value: getTrackedSince(profile?.createdAt || '')
    },
  ];

  const handleSaveChanges = async () => {
    if (!profile) return;
    setLoading(true);
    
    try {
      let avatarUrl = profile.contactInfo?.avatarUrl;
      
      // if (imageFile) {
      //   avatarUrl = await handleImageUpload(imageFile);
      //   if (!avatarUrl) throw new Error('Failed to upload image');
      // }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          contactInfo: {
            phone: profile.contactInfo?.phone,
            avatarUrl
          },
          preferences: {
            monthlyBudget: profile.preferences?.monthlyBudget
          }
        }),
      });

      if (!response.ok) throw new Error('Update failed');
      
      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast.error('File size must be less than 5MB');
  //       return;
  //     }
  //     setImageFile(file);
  //   }
  // };

  if (!profile || loading) {
    return <ProfileSkeleton />;
  }

  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <div className="min-h-screen w-full bg-background text-foreground dark:bg-gray-950 dark:text-gray-100">
        <div className="w-full h-full p-4 md:p-6 lg:p-8">
          <Card className="h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold">Profile</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-8">
              {/* Profile Header */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.contactInfo?.avatarUrl} alt={profile.firstName} />
                    <AvatarFallback>
                      {profile.firstName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    id="avatar"
                    accept="image/*"
                    className="hidden"
                    // onChange={handleFileChange}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute bottom-0 right-0 rounded-full bg-background shadow"
                    // onClick={() => document.getElementById('avatar')?.click()}
                    disabled={uploadingImage}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold">{profile.firstName}</h2>
                  <p className="text-sm text-muted-foreground">
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                  
                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="rounded-lg border p-3 text-center"
                      >
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-semibold">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      <Input 
                        value={profile.firstName}
                        onChange={e => setProfile({...profile, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <Input 
                        type="email"
                        value={profile.email}
                        readOnly
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <Input 
                        value={profile.contactInfo?.phone || ''}
                        onChange={e => setProfile({...profile, contactInfo: {...profile.contactInfo, phone: e.target.value}})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Monthly Budget
                      </label>
                      <Input 
                        type="number"
                        value={profile.preferences?.monthlyBudget || 0}
                        onChange={e => setProfile({...profile, preferences: {...profile.preferences, monthlyBudget: Number(e.target.value)}})}
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Notifications */}
              <section>
                <h3 className="text-lg font-semibold mb-4">Notifications</h3>
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">
                    </p>
                  </div>
                </div>
              </section>

              <div className="flex justify-end gap-4 mt-auto pt-4">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleSaveChanges}>Save Changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Suspense>
  );
}