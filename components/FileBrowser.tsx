import React, { useState, useEffect, useCallback } from 'react';
import { getContents } from '../services/jupyterService';
import type { IJupyterServer, IContent, ContentType } from '../types';
import { FolderIcon, NotebookIcon, FileIcon, SpinnerIcon, ChevronLeftIcon } from './Icons';

interface FileBrowserProps {
  server: IJupyterServer;
  onFileSelect: (path: string, type: ContentType) => void;
  onDisconnect: () => void;
}

const FileItem: React.FC<{ item: IContent; onClick: () => void }> = ({ item, onClick }) => {
  const getIcon = () => {
    if (item.type === 'directory') return <FolderIcon />;
    if (item.type === 'notebook') return <NotebookIcon />;
    return <FileIcon />;
  };

  return (
    <li
      onClick={onClick}
      className="flex items-center p-3 hover:bg-blue-500/10 rounded-md cursor-pointer transition-colors duration-150 space-x-4"
    >
      <span className="text-blue-400">{getIcon()}</span>
      <span className="truncate">{item.name}</span>
    </li>
  );
};

export const FileBrowser: React.FC<FileBrowserProps> = ({ server, onFileSelect, onDisconnect }) => {
  const [path, setPath] = useState('');
  const [contents, setContents] = useState<IContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContents = useCallback(async (currentPath: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getContents(server, currentPath);
      if (data.type === 'directory' && Array.isArray(data.content)) {
        const sortedContents = data.content.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        setContents(sortedContents);
      } else {
        // Handle case where content is not a directory or not an array, e.g., viewing a file directly
        setContents([]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch files.');
    } finally {
      setIsLoading(false);
    }
  }, [server]);

  useEffect(() => {
    fetchContents(path);
  }, [path, fetchContents]);

  const handleItemClick = (item: IContent) => {
    if (item.type === 'directory') {
      setPath(item.path);
    } else {
      onFileSelect(item.path, item.type);
    }
  };
  
  const goBack = () => {
    if (path) {
      const newPath = path.substring(0, path.lastIndexOf('/'));
      setPath(newPath);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col p-2 md:p-4">
      <header className="flex items-center justify-between p-4 bg-gray-800 rounded-t-lg border-b border-gray-700">
        <div className="flex items-center space-x-3 min-w-0">
            {path && <button onClick={goBack} className="p-2 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"><ChevronLeftIcon /></button>}
            <h1 className="text-xl font-semibold truncate text-gray-200">
                <span className="text-gray-500">/</span>
                {path}
            </h1>
        </div>
        <button onClick={onDisconnect} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors">Disconnect</button>
      </header>
      <main className="flex-1 bg-gray-800 rounded-b-lg p-3 overflow-y-auto">
        {isLoading && <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8"/></div>}
        {error && <div className="text-red-400 p-4 bg-red-900/30 rounded-md m-2">{error}</div>}
        {!isLoading && !error && (
          <ul>
            {contents.map((item) => (
              <FileItem key={item.path} item={item} onClick={() => handleItemClick(item)} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
