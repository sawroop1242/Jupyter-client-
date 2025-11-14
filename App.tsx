import React, { useState } from 'react';
import { ConnectionScreen } from './components/ConnectionScreen';
import { FileBrowser } from './components/FileBrowser';
import { NotebookView } from './components/NotebookView';
import { UbuntuARMSetup } from './components/UbuntuARMSetup';
import { TerminalView } from './components/TerminalView';
import type { IJupyterServer, ContentType, IUbuntuARMConfig } from './types';
import { getContents } from './services/jupyterService';

type View = 'connect' | 'browse' | 'notebook' | 'ubuntu-setup' | 'terminal';

interface AppState {
  view: View;
  server: IJupyterServer | null;
  ubuntuConfig: IUbuntuARMConfig | null;
  currentPath: string;
  connectionError: string | null;
  isConnecting: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'connect',
    server: null,
    ubuntuConfig: null,
    currentPath: '',
    connectionError: null,
    isConnecting: false,
  });

  const handleConnect = async (server: IJupyterServer) => {
    setState(s => ({ ...s, isConnecting: true, connectionError: null }));
    try {
      // Test connection by fetching root contents
      await getContents(server, '');
      setState({ ...state, server, view: 'browse', connectionError: null, isConnecting: false });
    } catch (e: any) {
      const errorMessage = e.message.includes('Failed to fetch') 
        ? 'Connection failed. Check URL, token, and server CORS policy.' 
        : e.message;
      setState({ ...state, connectionError: errorMessage, view: 'connect', isConnecting: false });
    }
  };

  const handleDisconnect = () => {
    setState({ server: null, view: 'connect', currentPath: '', connectionError: null, isConnecting: false });
  };

  const handleFileSelect = (path: string, type: ContentType) => {
    if (type === 'notebook') {
      setState({ ...state, view: 'notebook', currentPath: path });
    } else {
      // For this version, only notebooks are viewable.
      alert("Only notebook files can be opened in this version.");
    }
  };

  const handleBackToFileBrowser = () => {
    setState({ ...state, view: 'browse', currentPath: '' });
  };

  const handleUbuntuARMConnect = (config: IUbuntuARMConfig) => {
    setState({ ...state, ubuntuConfig: config, view: 'terminal', connectionError: null });
  };

  const handleBackToConnect = () => {
    setState({ ...state, view: 'connect', ubuntuConfig: null, connectionError: null });
  };

  const handleOpenUbuntuARM = () => {
    setState({ ...state, view: 'ubuntu-setup', connectionError: null });
  };

  const handleTerminalDisconnect = () => {
    setState({ ...state, view: 'connect', ubuntuConfig: null });
  };

  const renderView = () => {
    const { view, server, ubuntuConfig, connectionError, isConnecting } = state;

    if (view === 'terminal' && ubuntuConfig) {
      return <TerminalView config={ubuntuConfig} onBack={handleBackToConnect} onDisconnect={handleTerminalDisconnect} />;
    }

    if (view === 'ubuntu-setup') {
      return <UbuntuARMSetup onConnect={handleUbuntuARMConnect} onBack={handleBackToConnect} error={connectionError} isConnecting={isConnecting} />;
    }

    if (view === 'notebook' && server) {
      return <NotebookView server={server} path={state.currentPath} onBack={handleBackToFileBrowser} />;
    }
    
    if (view === 'browse' && server) {
      return <FileBrowser server={server} onFileSelect={handleFileSelect} onDisconnect={handleDisconnect} />;
    }
    
    return <ConnectionScreen onConnect={handleConnect} onOpenUbuntuARM={handleOpenUbuntuARM} error={connectionError} isConnecting={isConnecting}/>;
  };

  return <div className="font-sans">{renderView()}</div>;
};

export default App;
