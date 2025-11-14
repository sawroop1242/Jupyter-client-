# Ubuntu ARM Runner - Acode Plugin

A powerful Acode plugin that allows you to run an Ubuntu ARM environment directly from your Android device using proot-distro. Perfect for running ARM-based Linux applications and development environments on mobile.

## Features

- Start and manage Ubuntu ARM environment from Acode
- Execute Linux commands in ARM architecture
- Terminal-like interface with command history
- Easy-to-use controls (Start, Stop, Clear)
- Keyboard shortcut support (Ctrl-Alt-U / Cmd-Alt-U)
- Color-coded output for better readability

## Prerequisites

Before using this plugin, you need to have:

1. **Termux** installed on your Android device
2. **proot-distro** installed in Termux

### Installation Steps

1. Install Termux from F-Droid (recommended) or Google Play Store
2. Open Termux and run:
   ```bash
   pkg update && pkg upgrade
   pkg install proot-distro
   ```

3. Install the plugin in Acode

## Usage

### Starting Ubuntu ARM

1. Open Acode
2. Click on the "Ubuntu ARM" icon in the toolbar, or use keyboard shortcut:
   - Windows/Linux: `Ctrl-Alt-U`
   - Mac: `Cmd-Alt-U`
3. Click the "Start Ubuntu ARM" button
4. Wait for the Ubuntu ARM environment to be set up (first time may take a few minutes)

### Running Commands

Once Ubuntu ARM is running:

1. Type your Linux command in the input field
2. Press Enter to execute
3. View the output in the terminal window

Example commands:
```bash
uname -m              # Check architecture (should show armv7l or aarch64)
apt update            # Update package lists
apt install python3   # Install Python 3
python3 --version     # Check Python version
```

### Stopping Ubuntu ARM

Click the "Stop" button to terminate the Ubuntu ARM environment and free up resources.

### Clearing Terminal

Click the "Clear" button to clear the terminal output while keeping the environment running.

## Architecture Support

This plugin supports ARM architectures commonly found on Android devices:
- ARMv7 (32-bit)
- ARMv8/AArch64 (64-bit)

The architecture is automatically detected based on your device.

## Troubleshooting

### "proot-distro not found" Error

If you see this error:
1. Make sure Termux is installed
2. Open Termux and run: `pkg install proot-distro`
3. Restart Acode and try again

### Commands Not Executing

- Make sure you clicked "Start Ubuntu ARM" before running commands
- Check that Termux has necessary permissions
- Try restarting the Ubuntu ARM environment

### Slow Performance

- First-time setup downloads Ubuntu ARM (100-200MB), which may take time
- Subsequent launches will be faster
- Complex commands may run slower on mobile devices due to hardware limitations

## Advanced Usage

### Installing Additional Packages

```bash
# Update package list
apt update

# Install development tools
apt install build-essential git vim

# Install programming languages
apt install nodejs npm python3-pip golang

# Install system utilities
apt install htop neofetch curl wget
```

### Running Scripts

You can run shell scripts, Python scripts, or any other executable:

```bash
# Create a script
echo '#!/bin/bash\necho "Hello from Ubuntu ARM!"' > hello.sh
chmod +x hello.sh
./hello.sh
```

## Limitations

- No systemd support (proot limitation)
- Some operations requiring kernel modules won't work
- Network operations may have limitations
- GUI applications not supported (terminal only)

## Security Notes

- Commands run within a sandboxed proot environment
- Limited access to Android system files
- Termux permissions apply to the environment

## Support

For issues and feature requests:
- GitHub: [Report an issue](https://github.com/yourusername/acode-ubuntu-arm-plugin/issues)
- Acode Community: [Join discussion](https://github.com/deadlyjack/Acode/discussions)

## License

MIT License - Feel free to modify and distribute

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built for [Acode Editor](https://acode.app)
- Uses [proot-distro](https://github.com/termux/proot-distro) for Ubuntu ARM environment
- Powered by [Termux](https://termux.dev)
