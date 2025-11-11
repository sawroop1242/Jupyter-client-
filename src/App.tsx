import React, { useState } from 'react';
import { ConnectionScreen } from './components/ConnectionScreen';
import { FileBrowser } from './components/FileBrowser';
import { NotebookView } from './components/NotebookView';
import type { IJupyterServer, ContentType } from './types';
import { getContents } from './services/jupyterService';

type View = 'connect' | 'browse' | 'notebook';

interface AppState {
  view: View;
  server: IJupyterServer | null;
  currentPath: string;
  connectionError: string | null;
  isConnecting: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'connect',
    server: null,
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

  const renderView = () => {
    const { view, server, connectionError, isConnecting } = state;

    if (view === 'notebook' && server) {
      return <NotebookView server={server} path={state.currentPath} onBack={handleBackToFileBrowser} />;
    }
    
    if (view === 'browse' && server) {
      return <FileBrowser server={server} onFileSelect={handleFileSelect} onDisconnect={handleDisconnect} />;
    }
    
    return <ConnectionScreen onConnect={handleConnect} error={connectionError} isConnecting={isConnecting}/>;
  };

  return <div className="font-sans">{renderView()}</div>;
};

export default App;
