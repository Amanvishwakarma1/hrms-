# 🚀 How the HRMS Codebase Was Prepared & Pushed to GitHub

**Repository**: [https://github.com/Amanvishwakarma1/hrms-](https://github.com/Amanvishwakarma1/hrms-)  
**Remote URL**: `https://github.com/Amanvishwakarma1/hrms-.git`  
**Branch**: `main`

---

## 📋 Summary of Steps Performed

### Step 1: Git Engine Setup
1. Verified Git installation (`git version 2.47.1`).
2. Configured Git user details:
   `git config user.name "Aman Vishwakarma"`
   `git config user.email "aman.vishwakarma2022@glbajajgroup.org"`

---

### Step 2: Storage & Backup Exclusion (.gitignore)
1. Created a comprehensive `.gitignore` to exclude:
   - `node_modules/` (dependencies restored via `npm install`)
   - `storage/` and `*.sqlite*` (large database files)
   - `uploads/` (local user media)
   - `dist/` (production build outputs)
   - `__pycache__/` and `venv/` (Python bytecode)

---

### Step 3: Git Initialization & Initial Commit
Executed the following Git commands inside repository:
```bash
# 1. Initialize Git repository
git init

# 2. Configure Git user
git config user.name "Aman Vishwakarma"
git config user.email "aman.vishwakarma2022@glbajajgroup.org"

# 3. Set branch to main
git branch -M main

# 4. Stage all source code files
git add .

# 5. Commit all code
git commit -m "Initial commit: HRMS, Attendance Tracking & Invoice Management Platform"

# 6. Link to GitHub remote
git remote add origin https://github.com/Amanvishwakarma1/hrms-.git
```

---

## 🔑 Step 4: Final Push to GitHub (1-Click or Command Line)

### Option A: 1-Click Push via Helper Script (Easiest)
1. Double-click the file: **`push_to_github.bat`**
2. It will automatically connect to GitHub and push your code!

---

### Option B: Push via GitHub Personal Access Token (PAT)
If GitHub prompts for a password in the terminal:
1. Open [https://github.com/settings/tokens](https://github.com/settings/tokens) in your browser.
2. Click **Generate new token (classic)**.
3. Check the **`repo`** checkbox and click **Generate token**.
4. Copy your token (starts with `ghp_...`).
5. Run the push command with your token:
```powershell
git push -u https://<YOUR_TOKEN>@github.com/Amanvishwakarma1/hrms-.git main
```

---

## ✅ What is Included in this Repository:
- **Frontend**: Vite + React single-page application (`src/modules/hrms`, `src/modules/invoice`, `components`, `views`, `services`).
- **Backend (Express)**: Node.js HRMS REST API, GPS attendance engine, live geofence, and Excel export engine.
- **Backend (FastAPI)**: Python invoice extractor microservice.
- **Configurations**: `package.json`, `vite.config.js`, `ecosystem.config.js`, `requirements.txt`.
