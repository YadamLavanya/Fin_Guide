"use client"

import { useState } from 'react';
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

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    avatarUrl: '',
    monthlyBudget: 3000,
    joinedDate: '2024-01-01'
  });

  const stats = [
    { label: 'Total Expenses', value: '$12,450' },
    { label: 'Categories Used', value: '8' },
    { label: 'Tracked Since', value: 'Jan 2024' },
  ];

  return (
    <div className="container mx-auto py-4">
      <Card className="h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-8">
          {/* Profile Header */}
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile.avatarUrl} alt={profile.name} />
                <AvatarFallback>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-0 right-0 rounded-full bg-background shadow"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-semibold">{profile.name}</h2>
              <p className="text-sm text-muted-foreground">
                Member since {new Date(profile.joinedDate).toLocaleDateString()}
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
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
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
                    onChange={e => setProfile({...profile, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone
                  </label>
                  <Input 
                    value={profile.phone}
                    onChange={e => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Monthly Budget
                  </label>
                  <Input 
                    type="number"
                    value={profile.monthlyBudget}
                    onChange={e => setProfile({...profile, monthlyBudget: Number(e.target.value)})}
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
                  You&apos;re approaching your monthly budget limit
                </p>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-4 mt-auto pt-4">
            <Button variant="outline">Cancel</Button>
            <Button>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}