@echo off
setlocal
echo =======================================================
echo Pushing HRMS Repository to https://github.com/Amanvishwakarma1/hrms-.git
echo =======================================================
echo.
set "GIT_CMD=git"

"%GIT_CMD%" push -u origin main
echo.
if %errorlevel% equ 0 (
    echo [SUCCESS] Code successfully pushed to GitHub!
) else (
    echo [NOTE] If prompted for authentication:
    echo 1. Generate a GitHub Personal Access Token (Classic) at: https://github.com/settings/tokens
    echo 2. Check the 'repo' scope checkbox.
    echo 3. When Git asks for password in the terminal, paste your Token!
)
echo.
pause
