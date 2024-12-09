"use client";  // Add this at the top since we're using client-side features
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center"
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CurioPay
            </h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4"
          >
            <Link href="/login">
              <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white">
                Sign Up
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6"
          >
            Master Your Money, Shape Your Future
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            Take control of your finances with smart expense tracking, intelligent budgeting, 
            and personalized insights that help you make better financial decisions.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex gap-4 justify-center"
          >
            <Link href="/register">
              <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white text-lg px-8 py-6">
                Start Tracking Free
              </Button>
            </Link>
            <Button variant="outline" className="text-gray-700 border-slate-600 text-lg px-8 py-6">
              View Features
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Smart Expense Tracking",
              description: "Automatically categorize and track your spending patterns with AI-powered insights"
            },
            {
              title: "Intelligent Budgeting",
              description: "Create customized budgets that adapt to your spending habits and financial goals"
            },
            {
              title: "Financial Insights",
              description: "Get personalized recommendations to improve your savings and optimize spending"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* New Stats Section */}
      {/* <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="grid md:grid-cols-3 gap-8 text-center"
          >
            {[
            ].map((item, index) => (
              <div key={index} className="p-6">
                <h3 className="text-4xl font-bold text-blue-600 mb-2">{item.stat}</h3>
                <p className="text-gray-600">{item.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section> */}

      {/* New Benefits Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center mb-12 text-gray-900"
          >
            Take Control of Your Financial Future
          </motion.h2>
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Personal Finance Dashboard</h3>
              <p className="text-gray-600">View all your accounts, track expenses, and monitor your financial health in one place.</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-xl shadow-lg"
            >
              <h3 className="text-xl font-semibold mb-4">Smart Savings Goals</h3>
              <p className="text-gray-600">Set and achieve your financial goals with AI-powered recommendations and progress tracking.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            © 2024 CurioPay. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
