import React, { useState } from 'react';
import { ConnectionScreen } from './components/ConnectionScreen';
import { FileBrowser } from './components/FileBrowser';
import { NotebookView } from './components/NotebookView';
import { getContents } from './services/jupyterService';
const App = () => {
    const [state, setState] = useState({
        view: 'connect',
        server: null,
        currentPath: '',
        connectionError: null,
        isConnecting: false,
    });
    const handleConnect = async (server) => {
        setState(s => ({ ...s, isConnecting: true, connectionError: null }));
        try {
            // Test connection by fetching root contents
            await getContents(server, '');
            setState({ ...state, server, view: 'browse', connectionError: null, isConnecting: false });
        }
        catch (e) {
            const errorMessage = e.message.includes('Failed to fetch')
                ? 'Connection failed. Check URL, token, and server CORS policy.'
                : e.message;
            setState({ ...state, connectionError: errorMessage, view: 'connect', isConnecting: false });
        }
    };
    const handleDisconnect = () => {
        setState({ server: null, view: 'connect', currentPath: '', connectionError: null, isConnecting: false });
    };
    const handleFileSelect = (path, type) => {
        if (type === 'notebook') {
            setState({ ...state, view: 'notebook', currentPath: path });
        }
        else {
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
            return <NotebookView server={server} path={state.currentPath} onBack={handleBackToFileBrowser}/>;
        }
        if (view === 'browse' && server) {
            return <FileBrowser server={server} onFileSelect={handleFileSelect} onDisconnect={handleDisconnect}/>;
        }
        return <ConnectionScreen onConnect={handleConnect} error={connectionError} isConnecting={isConnecting}/>;
    };
    return <div className="font-sans">{renderView()}</div>;
};
export default App;
