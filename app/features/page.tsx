"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    title: "Expense Tracking",
    description: "Record and categorize your expenses with smart categorization and recurring payment support.",
    details: ["Auto-categorization", "Recurring expenses", "Multiple payment methods", "Receipt scanning"]
  },
  {
    title: "AI-Powered Insights",
    description: "Get personalized financial advice and insights powered by various LLM providers.",
    details: ["Multiple LLM providers", "Spending pattern analysis", "Custom financial advice", "Budget optimization"]
  },
  {
    title: "Budgeting Tools",
    description: "Set and manage budgets with intelligent alerts and recommendations.",
    details: ["Custom budget categories", "Real-time notifications", "Progress tracking", "Adaptive suggestions"]
  },
  {
    title: "Data Security",
    description: "Your financial data is protected with state-of-the-art security measures.",
    details: ["Local deployment option", "Encrypted storage", "API key protection", "Regular backups"]
  },
  {
    title: "Reports & Analytics",
    description: "Comprehensive reports and analytics to understand your spending habits.",
    details: ["Custom date ranges", "Export functionality", "Visual charts", "Trend analysis"]
  },
  {
    title: "Smart Notifications",
    description: "Stay informed with intelligent alerts about your spending and budget.",
    details: ["Email notifications", "Budget alerts", "Custom thresholds", "Weekly summaries"]
  }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Header Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
          >
            Powerful Features for Smart Finance
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-600 mb-8"
          >
            Discover all the tools you need to take control of your financial future
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full transition-all hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {feature.details.map((detail, idx) => (
                      <Badge 
                        key={idx}
                        variant="secondary"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                      >
                        {detail}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-6 sm:space-y-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Ready to Start Managing Your Finances?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="w-full sm:w-auto">
                <ShimmerButton className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-8 py-6">
                  Get Started Free
                </ShimmerButton>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <ShimmerButton className="w-full sm:w-auto border-2 border-slate-200 hover:bg-slate-50 px-8 py-6">
                  Login
                </ShimmerButton>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
