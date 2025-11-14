# Installation Guide - Ubuntu ARM Runner Plugin for Acode

This guide will help you install and set up the Ubuntu ARM Runner plugin for Acode.

## Prerequisites

### 1. Install Acode
Download and install Acode from:
- [Google Play Store](https://play.google.com/store/apps/details?id=com.foxdebug.acode)
- [F-Droid](https://f-droid.org/packages/com.foxdebug.acode/)
- [GitHub Releases](https://github.com/deadlyjack/Acode/releases)

### 2. Install Termux
Termux is required to run the Ubuntu ARM environment:
- **Recommended**: [F-Droid](https://f-droid.org/packages/com.termux/) (most up-to-date)
- Alternative: Google Play Store (may be outdated)

### 3. Set Up Termux

Open Termux and run these commands:

```bash
# Update packages
pkg update && pkg upgrade

# Install proot-distro (required for Ubuntu ARM)
pkg install proot-distro

# Install Termux:API (for plugin integration)
pkg install termux-api

# Grant storage permissions
termux-setup-storage
```

## Plugin Installation

### Method 1: Install from File (Recommended)

1. **Build the plugin** (if you have the source):
   ```bash
   cd acode-ubuntu-arm-plugin
   npm install
   npm run build
   npm run zip
   ```

2. **Install in Acode**:
   - Open Acode
   - Tap the menu (☰) → Settings → Plugins
   - Tap "Install from file"
   - Navigate to and select `acode-ubuntu-arm-plugin.zip`
   - Wait for installation to complete
   - Restart Acode

### Method 2: Install from Acode Plugin Store

(Coming soon - once published to the official Acode plugin repository)

1. Open Acode
2. Go to Settings → Plugins
3. Search for "Ubuntu ARM Runner"
4. Tap "Install"
5. Restart Acode

## First-Time Setup

### 1. Grant Permissions

When you first run the plugin, you may need to grant permissions:
- Storage access (to read/write files)
- Termux API access (to execute commands)

### 2. Download Ubuntu ARM

The first time you start Ubuntu ARM:
1. Open Acode
2. Press `Ctrl-Alt-U` or tap the "Ubuntu ARM" icon
3. Click "Start Ubuntu ARM"
4. Wait for Ubuntu ARM to download (100-200 MB)
5. This may take 5-15 minutes depending on your internet speed

The download only happens once. Subsequent launches will be much faster!

## Verification

### Test the Installation

1. **Start Ubuntu ARM**:
   - Press `Ctrl-Alt-U` in Acode
   - Click "Start Ubuntu ARM"
   - Wait for "Ubuntu ARM environment ready!" message

2. **Run a test command**:
   ```bash
   uname -m
   ```
   Should output: `armv7l` or `aarch64`

3. **Check Ubuntu version**:
   ```bash
   cat /etc/os-release
   ```
   Should show Ubuntu information

4. **Test package manager**:
   ```bash
   apt update
   ```
   Should update package lists successfully

## Troubleshooting

### "proot-distro not found"

**Solution**:
```bash
# In Termux:
pkg install proot-distro
```

### "Termux API not available"

**Solution**:
```bash
# In Termux:
pkg install termux-api
```

Also install the Termux:API app from F-Droid:
https://f-droid.org/packages/com.termux.api/

### Plugin Not Showing in Acode

**Solutions**:
1. Restart Acode completely
2. Check if plugin is enabled: Settings → Plugins
3. Reinstall the plugin
4. Clear Acode cache: Settings → Clear cache

### Commands Not Executing

**Solutions**:
1. Make sure you clicked "Start Ubuntu ARM" first
2. Check Termux permissions in Android settings
3. Verify proot-distro is installed: `pkg list-installed | grep proot`
4. Try running commands directly in Termux first

### Slow Performance

**Tips**:
- First download takes time (one-time only)
- Use faster internet connection for initial setup
- Close other apps to free up memory
- Some commands naturally run slower on ARM

### Storage Space Issues

Ubuntu ARM requires:
- **Minimum**: 500 MB free space
- **Recommended**: 2+ GB for installing additional packages

**Check free space**:
```bash
# In Termux:
df -h
```

## Post-Installation

### Recommended Packages

After installation, install these useful packages:

```bash
# Update package list
apt update

# Essential tools
apt install -y nano vim git curl wget

# Development tools
apt install -y build-essential python3 python3-pip nodejs npm

# System utilities
apt install -y htop tree zip unzip
```

### Configure Environment

Create a custom setup script:

```bash
# In Ubuntu ARM terminal:
nano ~/.bashrc

# Add these lines:
export PS1='\[\e[32m\]\u@ubuntu-arm\[\e[m\]:\[\e[34m\]\w\[\e[m\]\$ '
alias ll='ls -lah'
alias update='apt update && apt upgrade'

# Save and reload:
source ~/.bashrc
```

## Uninstallation

### Remove Plugin

1. Open Acode
2. Go to Settings → Plugins
3. Find "Ubuntu ARM Runner"
4. Tap "Uninstall"

### Clean Up Termux Environment

```bash
# Remove Ubuntu ARM installation
proot-distro remove ubuntu-arm

# (Optional) Remove proot-distro if not needed
pkg uninstall proot-distro
```

## Support

### Get Help

- **Documentation**: See [readme.md](readme.md) for usage guide
- **GitHub Issues**: Report bugs and request features
- **Acode Community**: Join discussions on GitHub

### Useful Links

- [Acode Documentation](https://acode.app/docs)
- [Termux Wiki](https://wiki.termux.com/)
- [proot-distro GitHub](https://github.com/termux/proot-distro)
- [Ubuntu ARM Documentation](https://ubuntu.com/download/server/arm)

## Next Steps

Now that the plugin is installed:
1. Read the [readme.md](readme.md) for usage instructions
2. Try running some Linux commands
3. Install your favorite development tools
4. Build and test your projects on ARM architecture

Happy coding on Ubuntu ARM!
