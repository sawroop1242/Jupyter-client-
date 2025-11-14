# Acode Ubuntu ARM Runner Plugin

A powerful Acode plugin that enables you to run a full Ubuntu ARM Linux environment directly on your Android device. Perfect for mobile development, testing ARM applications, and running Linux tools on the go.

## Overview

This plugin integrates Ubuntu ARM (via proot-distro) into the Acode editor, providing:
- Full Ubuntu ARM environment on Android
- Terminal-like interface within Acode
- Execute Linux commands and scripts
- Install and use ARM-compiled packages
- No root access required

## Features

- **Native ARM Support**: Run ARM-compiled Linux applications natively on your Android device
- **Terminal Interface**: Built-in terminal with color-coded output
- **Easy Controls**: Start, stop, and clear terminal with simple buttons
- **Keyboard Shortcuts**: Quick access via Ctrl-Alt-U (Cmd-Alt-U on Mac)
- **Package Management**: Full access to Ubuntu's apt package manager
- **No Root Required**: Uses proot for containerization without requiring root access
- **Persistent Environment**: Your installed packages and files persist between sessions

## Architecture

```
acode-ubuntu-arm-plugin/
├── src/
│   ├── main.js          # Main plugin logic
│   └── styles.css       # UI styling
├── dist/                # Built plugin files
│   ├── main.js          # Bundled JavaScript
│   ├── plugin.json      # Plugin manifest
│   ├── readme.md        # User documentation
│   └── icon.png         # Plugin icon
├── plugin.json          # Source plugin manifest
├── package.json         # Node.js dependencies
├── build.js             # Build script
├── zip.js               # Package creation script
├── readme.md            # User guide
├── INSTALLATION.md      # Installation instructions
└── PROJECT_README.md    # This file
```

## Technology Stack

- **JavaScript**: Plugin implementation
- **CSS**: Custom styling for terminal interface
- **Node.js**: Build tooling
- **proot-distro**: Ubuntu ARM containerization
- **Termux**: Android terminal emulator (required dependency)
- **Acode API**: Integration with Acode editor

## How It Works

1. **Plugin Initialization**: When Acode loads, the plugin registers itself and adds UI elements
2. **Termux Integration**: Communicates with Termux to execute proot commands
3. **Ubuntu ARM**: Uses proot-distro to run Ubuntu in a sandboxed ARM environment
4. **Command Execution**: Commands are sent to the Ubuntu ARM environment via proot
5. **Output Display**: Results are captured and displayed in the terminal interface

## Requirements

### Android Device
- **OS**: Android 7.0+ (ARM architecture)
- **Storage**: 500MB minimum, 2GB+ recommended
- **RAM**: 2GB minimum, 4GB+ recommended

### Software Dependencies
- **Acode**: v1.8.0 or higher (minVersionCode: 290)
- **Termux**: Latest version from F-Droid
- **proot-distro**: Installed via Termux
- **Termux:API**: For plugin-Termux communication

## Installation

### Quick Start

1. **Install Termux** from F-Droid
2. **Setup Termux**:
   ```bash
   pkg update && pkg upgrade
   pkg install proot-distro termux-api
   ```
3. **Install Plugin** in Acode:
   - Download `acode-ubuntu-arm-plugin.zip`
   - Open Acode → Settings → Plugins → Install from file
   - Select the ZIP file
   - Restart Acode

For detailed instructions, see [INSTALLATION.md](INSTALLATION.md).

## Usage

### Starting Ubuntu ARM

1. Press `Ctrl-Alt-U` or click the "Ubuntu ARM" icon
2. Click "Start Ubuntu ARM"
3. Wait for environment setup (first time only)

### Running Commands

Type Linux commands and press Enter:

```bash
# Check architecture
uname -m

# Update packages
apt update

# Install packages
apt install python3 git nodejs

# Run scripts
python3 script.py
./run.sh
```

### Examples

**Python Development**:
```bash
apt install python3 python3-pip
pip3 install numpy pandas
python3 my_script.py
```

**Node.js Development**:
```bash
apt install nodejs npm
npm init -y
npm install express
node server.js
```

**Compile C Programs**:
```bash
apt install build-essential
gcc -o program program.c
./program
```

For more examples, see [readme.md](readme.md).

## Building from Source

### Prerequisites
- Node.js 14+
- npm or yarn

### Build Steps

```bash
# Clone the repository
git clone https://github.com/yourusername/acode-ubuntu-arm-plugin.git
cd acode-ubuntu-arm-plugin

# Install dependencies
npm install

# Build the plugin
npm run build

# Create distribution package
npm run zip
```

The installable plugin will be at `acode-ubuntu-arm-plugin.zip`.

## Development

### Project Structure

- **src/main.js**: Core plugin logic
  - Plugin initialization
  - UI creation
  - Command execution
  - Terminal management

- **src/styles.css**: Terminal styling
  - Color schemes
  - Layout definitions
  - Responsive design

- **build.js**: Build automation
  - Bundles JS and CSS
  - Copies assets
  - Prepares distribution

### Adding Features

1. Edit `src/main.js` to add functionality
2. Update `src/styles.css` for styling
3. Run `npm run build` to test
4. Run `npm run zip` to package

### Debugging

Enable debug logging in main.js:
```javascript
const DEBUG = true;
console.log('Debug info:', data);
```

## Configuration

### Plugin Manifest (plugin.json)

```json
{
  "id": "com.acode.ubuntu.arm",
  "name": "Ubuntu ARM Runner",
  "version": "1.0.0",
  "main": "dist/main.js",
  "minVersionCode": 290
}
```

### Customization

Modify terminal colors in `src/styles.css`:
```css
.terminal-line.success {
  color: #98c379;  /* Change success color */
}
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| proot-distro not found | Install via: `pkg install proot-distro` |
| Termux API unavailable | Install Termux:API from F-Droid |
| Commands not executing | Start Ubuntu ARM environment first |
| Slow performance | Close other apps, use faster device |
| Storage space error | Free up 2GB+ space |

See [INSTALLATION.md](INSTALLATION.md) for detailed troubleshooting.

## Limitations

- **No systemd**: proot doesn't support systemd services
- **No GUI**: Terminal-only, no graphical applications
- **Performance**: Slower than native due to emulation overhead
- **Networking**: Some network operations may have limitations
- **Permissions**: Limited by Android security model

## Security Considerations

- Runs in sandboxed proot environment
- No root access to Android system
- Limited access to Android files
- Termux permissions apply
- Consider security when installing packages

## Performance Tips

1. **Close Background Apps**: Free up RAM
2. **Use Fast Storage**: Internal storage faster than SD card
3. **Limit Package Installs**: Only install what you need
4. **Clean Cache**: `apt clean` to free space
5. **Monitor Resources**: Use `htop` to check usage

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation
- Test on multiple devices
- Check for memory leaks

## Roadmap

### Version 1.1
- [ ] Command history with up/down arrows
- [ ] Multiple terminal tabs
- [ ] Save/load terminal sessions
- [ ] Custom color themes

### Version 1.2
- [ ] File browser integration
- [ ] Direct file editing in Ubuntu ARM
- [ ] Code execution shortcuts
- [ ] Package manager GUI

### Version 2.0
- [ ] Multiple distro support (Debian, Arch)
- [ ] VNC support for GUI apps
- [ ] SSH server integration
- [ ] Cloud sync for environments

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **Acode**: Amazing mobile code editor by [@deadlyjack](https://github.com/deadlyjack)
- **Termux**: Android terminal emulator and Linux environment
- **proot-distro**: Easy Linux distro installation on Android
- **Ubuntu**: Excellent Linux distribution

## Support

### Get Help
- **Documentation**: [readme.md](readme.md) and [INSTALLATION.md](INSTALLATION.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/acode-ubuntu-arm-plugin/issues)
- **Discussions**: [Acode Community](https://github.com/deadlyjack/Acode/discussions)

### Contact
- **GitHub**: [@yourusername](https://github.com/yourusername)
- **Email**: developer@acode.app

## Links

- [Acode Editor](https://acode.app)
- [Termux](https://termux.dev)
- [proot-distro](https://github.com/termux/proot-distro)
- [Ubuntu ARM](https://ubuntu.com/download/server/arm)

## Changelog

### v1.0.0 (2025-11-14)
- Initial release
- Ubuntu ARM environment support
- Terminal interface
- Command execution
- Package management
- Keyboard shortcuts
- Documentation and guides

---

Made with ❤️ for the Acode community
