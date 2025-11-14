const plugin = {
  async init($page, cacheFile, cacheFileUrl) {
    // Plugin initialization
    const { editor } = editorManager;

    // Add command to run Ubuntu ARM
    editorManager.editor.commands.addCommand({
      name: 'runUbuntuArm',
      description: 'Run Ubuntu ARM Environment',
      bindKey: { win: 'Ctrl-Alt-U', mac: 'Cmd-Alt-U' },
      exec: () => {
        this.showUbuntuTerminal();
      }
    });

    // Add menu item
    const menuItem = tag('span', {
      className: 'icon ubuntu-arm',
      textContent: 'Ubuntu ARM',
      onclick: () => {
        this.showUbuntuTerminal();
      }
    });

    acode.addIcon('ubuntu-arm', menuItem);

    console.log('Ubuntu ARM Plugin initialized');
  },

  async showUbuntuTerminal() {
    const dialog = tag('div', {
      className: 'ubuntu-arm-container'
    });

    const terminal = tag('div', {
      className: 'ubuntu-arm-terminal',
      id: 'ubuntu-terminal'
    });

    const controlBar = tag('div', {
      className: 'ubuntu-arm-controls'
    });

    const startBtn = tag('button', {
      textContent: 'Start Ubuntu ARM',
      className: 'ubuntu-btn start-btn',
      onclick: () => this.startUbuntuArm(terminal)
    });

    const stopBtn = tag('button', {
      textContent: 'Stop',
      className: 'ubuntu-btn stop-btn',
      onclick: () => this.stopUbuntuArm(terminal)
    });

    const clearBtn = tag('button', {
      textContent: 'Clear',
      className: 'ubuntu-btn clear-btn',
      onclick: () => {
        terminal.innerHTML = '';
      }
    });

    controlBar.append(startBtn, stopBtn, clearBtn);
    dialog.append(controlBar, terminal);

    const ubuntuDialog = acode.prompt('Ubuntu ARM Runner', '', 'ubuntu-arm', {
      required: false,
      placeholder: 'Enter command...',
      onsubmit: async (command) => {
        if (command) {
          await this.executeCommand(terminal, command);
        }
      }
    });

    ubuntuDialog.innerHTML = '';
    ubuntuDialog.appendChild(dialog);
  },

  async startUbuntuArm(terminal) {
    this.appendToTerminal(terminal, '=== Starting Ubuntu ARM Environment ===\n', 'system');

    try {
      // Check if proot-distro or similar is available
      const checkCmd = 'command -v proot-distro || command -v proot';
      const result = await this.executeShellCommand(checkCmd);

      if (result.includes('proot')) {
        this.appendToTerminal(terminal, 'Found proot, setting up Ubuntu ARM...\n', 'success');

        // Install Ubuntu ARM using proot-distro
        const setupCmd = 'proot-distro install ubuntu --override-alias ubuntu-arm';
        this.appendToTerminal(terminal, 'Installing Ubuntu ARM (this may take a few minutes)...\n', 'info');

        const installResult = await this.executeShellCommand(setupCmd);
        this.appendToTerminal(terminal, installResult + '\n', 'output');

        this.appendToTerminal(terminal, 'Ubuntu ARM environment ready!\n', 'success');
        this.appendToTerminal(terminal, 'You can now enter commands to run in Ubuntu ARM\n', 'info');

        this.ubuntuRunning = true;
      } else {
        this.appendToTerminal(terminal, 'Error: proot-distro not found. Please install Termux and proot-distro first.\n', 'error');
        this.appendToTerminal(terminal, 'Install with: pkg install proot-distro\n', 'info');
      }
    } catch (error) {
      this.appendToTerminal(terminal, `Error: ${error.message}\n`, 'error');
    }
  },

  async stopUbuntuArm(terminal) {
    this.appendToTerminal(terminal, '=== Stopping Ubuntu ARM Environment ===\n', 'system');
    this.ubuntuRunning = false;

    try {
      // Kill any running proot processes
      await this.executeShellCommand('pkill -9 proot');
      this.appendToTerminal(terminal, 'Ubuntu ARM environment stopped.\n', 'success');
    } catch (error) {
      this.appendToTerminal(terminal, `Error stopping: ${error.message}\n`, 'error');
    }
  },

  async executeCommand(terminal, command) {
    if (!this.ubuntuRunning) {
      this.appendToTerminal(terminal, 'Please start Ubuntu ARM environment first.\n', 'error');
      return;
    }

    this.appendToTerminal(terminal, `$ ${command}\n`, 'command');

    try {
      // Execute command in Ubuntu ARM environment
      const prootCmd = `proot-distro login ubuntu-arm -- ${command}`;
      const result = await this.executeShellCommand(prootCmd);

      this.appendToTerminal(terminal, result + '\n', 'output');
    } catch (error) {
      this.appendToTerminal(terminal, `Error: ${error.message}\n`, 'error');
    }
  },

  async executeShellCommand(command) {
    // Use Acode's system plugin or Termux API to execute commands
    return new Promise((resolve, reject) => {
      try {
        // Try using Termux API if available
        if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.TermuxAPI) {
          cordova.plugins.TermuxAPI.execute(command, (result) => {
            resolve(result);
          }, (error) => {
            reject(new Error(error));
          });
        } else {
          // Fallback: show instructions
          resolve('Termux API not available. Please install Termux and run commands manually:\n' + command);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  appendToTerminal(terminal, text, type = 'output') {
    const line = tag('div', {
      className: `terminal-line ${type}`,
      textContent: text
    });

    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  },

  async destroy() {
    // Cleanup when plugin is destroyed
    if (this.ubuntuRunning) {
      await this.stopUbuntuArm();
    }
    console.log('Ubuntu ARM Plugin destroyed');
  }
};

if (window.acode) {
  const { editor, editorManager } = acode.require('editor');
  const { tag } = acode.require('helpers');

  acode.setPluginInit(plugin.id, async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
    if (!baseUrl.endsWith('/')) {
      baseUrl += '/';
    }

    plugin.baseUrl = baseUrl;
    await plugin.init($page, cacheFile, cacheFileUrl);
  });

  acode.setPluginUnmount(plugin.id, () => {
    plugin.destroy();
  });
}
