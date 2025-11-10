# Installation Guide for Fuel EU Maritime Project

## Prerequisites: Installing Node.js and npm

### Method 1: Official Installer (Recommended)

1. **Download Node.js**
   - Visit: https://nodejs.org/
   - Click on the **LTS (Long Term Support)** version button
   - This will download the Windows Installer (.msi) for 64-bit

2. **Install Node.js**
   - Run the downloaded `.msi` file
   - Click "Next" through the installation wizard
   - Accept the license agreement
   - Choose installation location (default is fine)
   - **Important**: Make sure "Add to PATH" is checked (it should be by default)
   - Click "Install"
   - Complete the installation

3. **Verify Installation**
   - **Close and reopen** your terminal/PowerShell/Command Prompt
   - Run these commands:
     ```bash
     node --version
     npm --version
     ```
   - You should see version numbers like:
     ```
     v20.10.0
     10.2.3
     ```

### Method 2: Using Windows Package Manager (winget)

If you have Windows 10/11 with winget installed:

1. Open PowerShell as Administrator
2. Run:
   ```bash
   winget install OpenJS.NodeJS.LTS
   ```
3. Close and reopen your terminal
4. Verify with `node --version` and `npm --version`

### Method 3: Using Chocolatey (if you have it)

1. Open PowerShell as Administrator
2. Run:
   ```bash
   choco install nodejs-lts
   ```
3. Close and reopen your terminal
4. Verify with `node --version` and `npm --version`

## Troubleshooting

### "node is not recognized" after installation

1. **Restart your terminal** - Close and reopen PowerShell/Command Prompt
2. **Check PATH environment variable**:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System variables", find "Path"
   - Make sure `C:\Program Files\nodejs\` is in the list
   - If not, add it and restart your terminal

3. **Reinstall Node.js** if PATH is still not working

### Verify Node.js Installation

After installation, run these commands in a new terminal:

```bash
# Check Node.js version (should show v18.x.x or v20.x.x)
node --version

# Check npm version (should show 9.x.x or 10.x.x)
npm --version

# Check where Node.js is installed
where node
```

## After Installing Node.js

Once Node.js and npm are installed, you can proceed with the project setup:

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Run the Backend

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

### 4. Run the Frontend (in a new terminal)

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## System Requirements

- **Operating System**: Windows 10/11 (64-bit)
- **Node.js**: Version 18.x or higher (LTS recommended)
- **npm**: Comes with Node.js (Version 9.x or higher)
- **Disk Space**: ~500 MB for Node.js + dependencies

## Need Help?

If you encounter any issues:
1. Make sure you downloaded the correct version (64-bit)
2. Run the installer as Administrator
3. Restart your computer after installation
4. Verify PATH environment variable includes Node.js
5. Use a fresh terminal window after installation

