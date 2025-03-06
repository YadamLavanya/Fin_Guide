Finguide: AI-Powered Financial Budgeting Platform
📌 Overview
    
    Finguide is a financial budgeting platform that helps users track income, expenses, and savings while receiving AI-driven financial insights. The system automatically categorizes transactions, provides real-time budget tracking, and offers goal-based financial planning to improve money management.

🎯 Objective
  
  ✔ Real-time tracking of financial transactions.
  
  ✔ AI-powered financial insights for better decision-making.
  
  ✔ Smart expense categorization for easy budgeting.
  
  ✔ Goal-based financial planning to help users save effectively.
  
  ✔ Simple and secure platform for personal finance management.

🛠️ Technologies Used
  Component	Technology Used
  Frontend	Next.js + TypeScript + Tailwind CSS
  Backend	Next.js API Routes + Prisma ORM
  Database	PostgreSQL (via Docker)
  Authentication	bcrypt.js + Crypto Module (Secure Password Handling)
  AI Models	OpenAI, Google Gemini, Mistral
  Data Visualization	Chart.js / Recharts
  Deployment	Local & Cloud-based

🚀 Features
  ✔ Secure User Authentication: Register & log in with encrypted credentials.
  ✔ Real-Time Budget Tracking: Monitor income and expenses instantly.
  ✔ AI-Powered Financial Insights: Get personalized budgeting recommendations.
  ✔ Smart Expense Categorization: Transactions are automatically classified.
  ✔ Goal-Based Financial Planning: Set and track savings targets.
  ✔ Subscription & Recurring Payment Tracking: Manage ongoing expenses.
  ✔ Interactive Charts & Visualizations: Analyze spending patterns easily.
  ✔ Budget Alerts & Notifications: Get reminders when exceeding limits.

📥 Installation & Setup
  1️⃣ Clone the Repository
    git clone https://github.com/your-username/finguide.git
    cd finguide
  2️⃣ Install Dependencies
    npm install
  3️⃣ Set Up Environment Variables
    Create a .env file and add:
    DATABASE_URL=postgresql://user:password@localhost:5432/finguide
    NEXTAUTH_SECRET=your_secret_key
  4️⃣ Run PostgreSQL Using Docker
    docker-compose up -d
  5️⃣ Run Prisma Migrations
    npx prisma migrate dev
    npx prisma db seed
  6️⃣ Start the Development Server
    npm run dev
The application will be available at http://localhost:3000.

🎯 How to Use Finguide
  1️⃣ Sign Up / Log In: Create an account securely.
  2️⃣ Add Income & Expenses: Manually enter transactions or let AI categorize them.
  3️⃣ View Insights: Check AI-generated financial recommendations.
  4️⃣ Set Goals: Define savings targets & track progress.
  5️⃣ Monitor Trends: Use charts to analyze spending patterns.

🔒 Security Measures
  ✔ bcrypt.js for password hashing.
  ✔ AES-256 encryption for financial data protection.
  ✔ Local deployment option for enhanced privacy.

📄 Future Enhancements
  ✅ Email Verification before login.
  ✅ Fraud Detection using AI-powered alerts.
  ✅ Voice Commands for expense tracking.

👥 Contributors
  Y.Lavanya
  T.Venkata Arun Kumar
  G.Neha Vaishnavi
  P.Poojitha
  Mr. K. Jaya Prakash sir
