## Curiopay: Open Source Budget Tracking App with LLM Insights

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status: Active](https://img.shields.io/badge/Status-Active-success.svg)](https://github.com/adhamafis/curiopay)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.0-38B2AC.svg)](https://tailwindcss.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/adhamafis/curiopay/issues)

**Curiopay** is a free, open-source budget tracking app that provides intelligent insights into your spending using Local Language Model (LLM) providers. It allows users to track expenses, set budgets, and interact with AI for personalized financial advice. With robust security and privacy features, Curiopay also lets you choose from a variety of LLM providers, manage your data securely, and easily deploy the app locally.

**Project Status**: Actively developed  
**Last Updated**: 23.12.2024  
**License**: [MIT](LICENSE)

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
  - [In Progress Features](#in-progress-features)
  - [Planned Features](#planned-features)
- [Installation](#installation)
  - [Local Deployment](#local-deployment)
  - [Setup Script](#setup-script)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Introduction

**Curiopay** is a modern, open-source budget tracking app designed to help users monitor and manage their spending. What sets **Curiopay** apart is its integration with Local Language Model (LLM) providers, offering users personalized financial insights. Whether you’re a casual user or a developer, Curiopay is fully customizable and designed with privacy and security in mind.

With **Curiopay**, users can:

- Track income and expenses
- Set and manage budgets
- Receive real-time notifications when their budget is exceeded
- Chat with LLM models to get personalized insights based on their financial data
- Export expense data
- Enjoy maximum security and flexibility with local deployment options

**Key Features:**

- Expense tracking with categories, payment methods, and dates
- Recurring expenses (daily, weekly, monthly)
- Budget alerts via app notifications and email
- Multiple LLM providers (Groq, Ollama, Cohere, OpenAI, and more)
- Security-focused design with API key storage in the browser
- Data export for analysis (CSV/JSON)
- Chat with LLM for personalized financial advice

---

## Screenshot
![Screenshot Description](https://i.imgur.com/ABefR8O.png)

---

## Features Overview

| Feature Category | Features |
|------------------|----------|
| **In Progress**  | Responsive UI for Mobile and Themes, More LLM Providers |
| **Planned**      | Support for Additional LLM Providers, Advanced Analytics, Mobile App, Receipt Scanning |

---

## Features

### Core Features

- **Enhanced Financial Dashboard**: Navigate your financial data with a modern interface featuring pagination and interactive components.
- **Intelligent Chat System**: Use Markdown-supported chat for clear communication and financial insights.
- **Expense Management**: Record and categorize expenses with robust validation and error feedback.
- **Budget Notifications**: Receive real-time alerts when your budget is exceeded via in-app notifications and email.
- **Multiple LLM Providers**: Choose from various LLM providers for local deployment, including Groq and Ollama.
- **AI Insights**: Analyze spending patterns with AI models for actionable financial recommendations.
- **Recurring Expenses**: Automate tracking of recurring payments for better financial management.
- **Data Export**: Export financial data in CSV or JSON format after email verification.
- **Security**: Secure API key storage in your browser for maximum data protection.
- **Email Verification**: Mandatory email verification for notifications and data export.
- **Chat with LLM**: Engage with LLM for personalized financial insights and advice.

### In Progress Features

- **Responsive UI for Mobile and Themes**: Work is ongoing to make the UI responsive for mobile devices and to add theme support.
- **More LLM Providers**: Most LLM providers have been integrated, though still in beta testing.

### Planned Features

- **Advanced Analytics**: We plan to introduce predictive spending, trend analysis, and AI-driven budget recommendations.
- **Mobile App**: A mobile version of the app is in the planning phase for better on-the-go financial management.
- **Receipt Scanning**: Receipt scanning is in the planning phase for better expense tracking.
- **Support for Additional LLM Providers**: Future updates will bring support for more LLM providers.

---

## Installation

### Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version 14.x or higher)
- [npm](https://www.npmjs.com/) (Node Package Manager)
- [Docker](https://www.docker.com/products/docker-desktop) (for running the PostgreSQL server in a container)

### Local Deployment

#### Setup Script

If you want an easy setup, the `setup.sh` script automates the installation and configuration process. This is perfect for users who are not familiar with manual setup or want to save time.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adhamafis/curiopay.git
   cd curiopay
   ```

2. **Run the setup script**:
   The `setup.sh` script will guide you through the environment setup and run Docker Compose to configure a local PostgreSQL server for the app. Simply run:
   ```bash
   ./setup.sh
   ```

   During the setup, the script will:

   - Create and configure a `.env` file with the necessary environment variables.
   - Set up Docker Compose to run a PostgreSQL server locally.
   - Prompt you to enter sensitive information for your `.env` file (e.g., SMTP credentials, database URL, etc.).

3. **Environment Variables**:

   The script will help you fill out your `.env` file. Here’s an example of the environment variables you'll need to configure:

   ```env
   BLOB_READ_WRITE_TOKEN=your-token-here
   DATABASE_URL=postgres://user:password@localhost:5432/curiopay
   NEXTAUTH_SECRET=your-nextauth-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-email-password
   SMTP_FROM=your-email@gmail.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   CRON_SECRET=your-cron-secret
   ```

   Replace the placeholder values with your own information:
   - **BLOB_READ_WRITE_TOKEN**: Token for managing BLOB storage (if needed).
   - **DATABASE_URL**: Your PostgreSQL connection string. This will be auto-generated by Docker.
   - **SMTP settings**: Required for email notifications.
   - **NEXTAUTH_SECRET**: A secret used for authentication sessions (generate using a secure random string).

---

### For Advanced Users

If you prefer manual setup or want full control over your environment, you can skip the `setup.sh` script and configure everything yourself:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/adhamafis/curiopay.git
   cd curiopay
   ```

2. **Create a `.env` file**:  
   Manually create and configure your `.env` file with the necessary environment variables (refer to the example above).

3. **Run Docker Compose**:  
   Set up a local PostgreSQL server by running:
   ```bash
   docker-compose up -d
   ```
---

## Usage

Once the app is running, you can:

- **Track your expenses**: Add your income and expenses, and categorize them by type (e.g., groceries, entertainment, rent).
- **Set your budget**: Define a budget on your profile page and get alerts if you exceed it.
- **Interact with AI**: Choose your LLM provider and start chatting to get financial insights tailored to your spending habits.
- **Export Data**: Export your income and expense data in CSV/JSON format after verifying your email.

---

## Contributing

I need **YOU** to help make **Curiopay** the best it can be! 🙌

**Curiopay** is an open-source project, and it's only going to improve with your contributions. Whether you're fixing bugs, adding features, or suggesting new ideas, your input is incredibly valuable. Together, we can make this a game-changing budget tracking app that stays free, open-source, and accessible to everyone.

Here’s how you can help:

1. **Fork the repository**: Click the "Fork" button at the top of this page to create your own copy of the project.
   
2. **Clone the repository** to your local machine:
   ```bash
   git clone https://github.com/adhamafis/curiopay.git
   cd curiopay
   ```

3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature
   ```

4. **Make your changes**: Implement your feature or fix the bug.
   
5. **Test thoroughly**: Ensure your changes work and don't introduce new issues.
   
6. **Commit your changes** with a descriptive message:
   ```bash
   git commit -am 'Add new feature or fix'
   ```

7. **Push your changes** to your fork:


   ```bash
   git push origin feature/your-feature
   ```

8. **Open a pull request**: Describe the changes you've made and why they're important. 

I believe that open-source projects thrive when everyone contributes—no matter how big or small. If you're new to open source, don't worry! You can still make a huge impact by providing bug reports, suggesting features, and testing the app. Your contribution can help improve **Curiopay** and make it even better for everyone!

Let’s keep **Curiopay** alive, evolving, and improving together. **Every contribution counts!** 🎉

---

## License

Curiopay is open-source software licensed under the [MIT License](LICENSE).

---

## Contact

If you have any questions, suggestions, or need assistance:

- **Email**: [adham.afis@gmail.com]
