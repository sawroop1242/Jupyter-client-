import React, { useState, useEffect } from 'react';
import type { IJupyterServer } from '../types';
import { PlusIcon, PencilIcon, TrashIcon, ServerIcon, SpinnerIcon } from './Icons';

interface ConnectionScreenProps {
  onConnect: (server: IJupyterServer) => void;
  onOpenUbuntuARM: () => void;
  error: string | null;
  isConnecting: boolean;
}

const ServerModal: React.FC<{
  server: IJupyterServer | null;
  onSave: (server: IJupyterServer) => void;
  onClose: () => void;
}> = ({ server, onSave, onClose }) => {
  const [name, setName] = useState(server?.name || '');
  const [url, setUrl] = useState(server?.url || '');
  const [token, setToken] = useState(server?.token || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: server?.id || crypto.randomUUID(),
      name,
      url: url.replace(/\/$/, ''), // Remove trailing slash
      token,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-blue-400 mb-6">{server ? 'Edit Server' : 'Add New Server'}</h2>
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-300 text-sm font-bold mb-2">Server Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My Local Server" required className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="url" className="block text-gray-300 text-sm font-bold mb-2">Server URL</label>
              <input type="url" id="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8888" required className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div className="mb-6">
              <label htmlFor="token" className="block text-gray-300 text-sm font-bold mb-2">Access Token</label>
              <input type="password" id="token" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Your server token" required className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>
          <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4 flex justify-end space-x-3 rounded-b-lg">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md text-gray-300 bg-gray-700 hover:bg-gray-600 transition duration-150">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-bold transition duration-150">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};


export const ConnectionScreen: React.FC<ConnectionScreenProps> = ({ onConnect, onOpenUbuntuARM, error, isConnecting }) => {
  const [servers, setServers] = useState<IJupyterServer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<IJupyterServer | null>(null);
  const [connectingId, setConnectingId] = useState<string|null>(null);

  useEffect(() => {
    try {
      const savedServers = localStorage.getItem('jupyterServersList');
      if (savedServers) {
        setServers(JSON.parse(savedServers));
      }
    } catch (e) {
      console.error("Failed to parse saved servers from localStorage", e);
      localStorage.removeItem('jupyterServersList');
    }
  }, []);
  
  useEffect(() => {
    if (!isConnecting) {
        setConnectingId(null);
    }
  }, [isConnecting]);

  const saveServers = (updatedServers: IJupyterServer[]) => {
    setServers(updatedServers);
    localStorage.setItem('jupyterServersList', JSON.stringify(updatedServers));
  };

  const handleSaveServer = (server: IJupyterServer) => {
    const existing = servers.find(s => s.id === server.id);
    if (existing) {
      saveServers(servers.map(s => s.id === server.id ? server : s));
    } else {
      saveServers([...servers, server]);
    }
    setIsModalOpen(false);
    setEditingServer(null);
  };

  const handleDeleteServer = (serverId: string) => {
    if (window.confirm('Are you sure you want to delete this server?')) {
      saveServers(servers.filter(s => s.id !== serverId));
    }
  };

  const handleConnect = (server: IJupyterServer) => {
    setConnectingId(server.id);
    onConnect(server);
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-center text-blue-400 mb-2">Jupyter Connect</h1>
            <p className="text-center text-gray-400 mb-6">Connect to and interact with your Jupyter server</p>
             {error && <p className="text-red-400 text-sm text-center mb-4 bg-red-900/30 p-3 rounded-md border border-red-500/30">{error}</p>}
        </div>

        <div className="mt-6">
            <div className="flex justify-between items-center mb-4 px-2">
                 <h2 className="text-lg font-semibold text-gray-300">Saved Servers</h2>
                 <button onClick={() => { setEditingServer(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md transition duration-300 text-sm">
                    <PlusIcon className="w-4 h-4" />
                    <span>Add New</span>
                 </button>
            </div>
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700/50 p-4 max-h-80 overflow-y-auto">
               {servers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No saved servers. Add one to get started!</p>
               ) : (
                <ul className="space-y-3">
                    {servers.map(server => (
                        <li key={server.id} className="bg-gray-900/50 p-3 rounded-md flex items-center justify-between border border-gray-700 hover:border-blue-500/50 transition-colors">
                           <div className="flex items-center space-x-4 min-w-0">
                             <ServerIcon />
                             <div className="min-w-0">
                                <p className="font-semibold truncate text-gray-100">{server.name}</p>
                                <p className="text-xs text-gray-400 truncate font-mono">{server.url}</p>
                             </div>
                           </div>
                           <div className="flex items-center space-x-1 flex-shrink-0">
                             <button onClick={() => { setEditingServer(server); setIsModalOpen(true); }} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white" aria-label="Edit"><PencilIcon/></button>
                             <button onClick={() => handleDeleteServer(server.id)} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-rose-400" aria-label="Delete"><TrashIcon/></button>
                             <button 
                                onClick={() => handleConnect(server)} 
                                disabled={isConnecting}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm py-1.5 px-4 rounded-md transition duration-150 disabled:bg-gray-600 flex items-center w-28 justify-center"
                             >
                                {isConnecting && connectingId === server.id ? <SpinnerIcon className="w-4 h-4" /> : null}
                                <span className="ml-2">{isConnecting && connectingId === server.id ? 'Connecting' : 'Connect'}</span>
                            </button>
                           </div>
                        </li>
                    ))}
                </ul>
               )}
            </div>
        </div>
      </div>

      {isModalOpen && <ServerModal server={editingServer} onSave={handleSaveServer} onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};
