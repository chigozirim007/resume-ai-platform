# TailorFolio - Tailor every resume to the role

TailorFolio is a high-performance, full-stack platform designed to help job seekers tailor their resumes and cover letters using the power of Google Gemini AI. Transitioned from Stripe to **Paystack** for global accessibility, it features a hyper-dynamic UI and robust backend architecture.

---

## 🌊 Drips.network Wave - Contributor's Guide

This project is currently part of a **Drips.network Open Source Wave**! We have documented **38 bounty-ready issues** ranging from critical security fixes to advanced feature enhancements.

### 🛠️ How to Contribute:
1.  **Browse the Backlog:** Check our [GitHub Issues](https://github.com/chigozirim007/resume-ai-platform/issues) for tasks labeled `critical`, `medium`, or `low`.
2.  **Get Assigned:** Comment on an issue you'd like to work on. Once assigned, you're free to start!
3.  **Submit a PR:** Fork the repo, build your fix, and submit a Pull Request. Please include screenshots or a video of your changes.
4.  **Get Paid:** Once your PR is reviewed and merged, you will be eligible for the Wave rewards.

---

## ✨ Features
- **AI Analysis:** Deep match-score analysis between resumes and job descriptions.
- **Smart Tailoring:** Automatic generation of tailored resumes and cover letters.
- **Paystack Integration:** Seamless global billing and subscription management.
- **Hyper-Dynamic UI:** Premium, animated interface built with Framer Motion.
- **Real-time Extraction:** Intelligent text extraction from PDF resumes.

## 🛠️ Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, TanStack Query.
- **Backend:** Node.js (Express), TypeScript.
- **Database:** PostgreSQL via Drizzle ORM.
- **Auth:** Supabase Auth (with proactive local DB syncing).
- **AI:** Google Gemini 1.5 Pro/Flash.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/chigozirim007/resume-ai-platform.git
cd resume-ai-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy the `.env.example` file and add your keys:
```bash
cp .env.example .env
```
*Required: PAYSTACK_SECRET_KEY, GEMINI_API_KEY, SUPABASE_URL, DATABASE_URL.*

### 4. Run the project
```bash
# Start backend and frontend together
npm run dev
```

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
