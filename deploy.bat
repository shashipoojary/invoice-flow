@echo off
echo 🚀 Preparing for Vercel deployment...

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing git repository...
    git init
    git add .
    git commit -m "Initial commit - Ready for Vercel deployment"
)

REM Check if remote origin exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo ⚠️  No GitHub remote found!
    echo Please create a GitHub repository and add it as origin:
    echo git remote add origin https://github.com/yourusername/your-repo-name.git
    echo git push -u origin main
    pause
    exit /b 1
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git add .
git commit -m "Ready for Vercel deployment - %date% %time%"
git push origin main

echo ✅ Code pushed to GitHub!
echo.
echo 🎯 Next steps:
echo 1. Go to https://vercel.com
echo 2. Click 'New Project'
echo 3. Import your GitHub repository
echo 4. Set environment variables:
echo    - JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
echo    - DATABASE_URL=file:./invoice_flow.db
echo 5. Click 'Deploy'
echo.
echo 🎉 Your app will be live at: https://your-project-name.vercel.app
pause
