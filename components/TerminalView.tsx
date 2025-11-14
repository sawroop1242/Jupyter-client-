import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import type { IUbuntuARMConfig } from '../types';
import { connectToTerminal, sendCommand, closeTerminal } from '../services/ubuntuArmService';

interface TerminalViewProps {
  config: IUbuntuARMConfig;
  onBack: () => void;
  onDisconnect: () => void;
}

export const TerminalView: React.FC<TerminalViewProps> = ({ config, onBack, onDisconnect }) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js terminal
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
        black: '#000000',
        red: '#cd3131',
        green: '#0dbc79',
        yellow: '#e5e510',
        blue: '#2472c8',
        magenta: '#bc3fbc',
        cyan: '#11a8cd',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#e5e5e5',
      },
      rows: 30,
      cols: 80,
    });

    // Add addons
    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    
    fitAddonRef.current = fitAddon;
    xtermRef.current = term;

    // Open terminal in DOM
    term.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    term.writeln('\x1b[1;32m╔═══════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;32m║       Ubuntu ARM Terminal - Connecting...            ║\x1b[0m');
    term.writeln('\x1b[1;32m╚═══════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln(`\x1b[1;36mEnvironment:\x1b[0m ${config.name}`);
    term.writeln(`\x1b[1;36mArchitecture:\x1b[0m ${config.architecture}`);
    term.writeln(`\x1b[1;36mDistribution:\x1b[0m ${config.distribution}`);
    term.writeln('');

    // Connect to WebSocket
    try {
      const ws = connectToTerminal(
        config,
        (data) => {
          // Handle incoming data from terminal
          try {
            const message = JSON.parse(data);
            if (message.type === 'output') {
              term.write(message.data);
            } else if (message.type === 'error') {
              term.write(`\x1b[1;31m${message.data}\x1b[0m`);
            }
          } catch {
            // If not JSON, write raw data
            term.write(data);
          }
        },
        (error) => {
          setError(error.message);
          term.writeln(`\x1b[1;31m\r\nConnection Error: ${error.message}\x1b[0m`);
          setIsConnected(false);
        },
        () => {
          term.writeln('\x1b[1;33m\r\nConnection closed.\x1b[0m');
          setIsConnected(false);
        }
      );

      wsRef.current = ws;

      ws.addEventListener('open', () => {
        setIsConnected(true);
        setError(null);
        term.writeln('\x1b[1;32mConnected successfully!\x1b[0m');
        term.writeln('');
        term.write('$ ');
      });

      // Handle user input
      let currentLine = '';
      term.onData((data) => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;

        const code = data.charCodeAt(0);

        // Handle Enter key
        if (code === 13) {
          term.write('\r\n');
          if (currentLine.trim()) {
            sendCommand(ws, currentLine + '\n');
          }
          currentLine = '';
          return;
        }

        // Handle Backspace
        if (code === 127) {
          if (currentLine.length > 0) {
            currentLine = currentLine.slice(0, -1);
            term.write('\b \b');
          }
          return;
        }

        // Handle Ctrl+C
        if (code === 3) {
          term.write('^C\r\n');
          sendCommand(ws, '\x03');
          currentLine = '';
          return;
        }

        // Handle Ctrl+D
        if (code === 4) {
          term.write('^D\r\n');
          sendCommand(ws, '\x04');
          currentLine = '';
          return;
        }

        // Regular character input
        if (code >= 32 && code <= 126) {
          currentLine += data;
          term.write(data);
        }
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      term.writeln(`\x1b[1;31mFailed to connect: ${errorMessage}\x1b[0m`);
    }

    // Handle window resize
    const handleResize = () => {
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (wsRef.current) {
        closeTerminal(wsRef.current);
      }
      if (xtermRef.current) {
        xtermRef.current.dispose();
      }
    };
  }, [config]);

  const handleDisconnect = () => {
    if (wsRef.current) {
      closeTerminal(wsRef.current);
    }
    onDisconnect();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-white font-medium">{config.name}</span>
            <span className="text-gray-400 text-sm">({config.architecture})</span>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-900 border-b border-red-700 text-red-100 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Terminal Container */}
      <div className="flex-1 p-4 overflow-hidden">
        <div
          ref={terminalRef}
          className="w-full h-full rounded-lg overflow-hidden shadow-2xl"
          style={{ backgroundColor: '#1e1e1e' }}
        />
      </div>

      {/* Footer Info */}
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-gray-400 text-xs text-center">
        Ubuntu ARM Terminal • Press Ctrl+C to interrupt • Ctrl+D to send EOF
      </div>
    </div>
  );
};
