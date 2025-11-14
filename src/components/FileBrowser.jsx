import React, { useState, useEffect, useCallback } from 'react';
import { getContents } from '../services/jupyterService';
import { FolderIcon, NotebookIcon, FileIcon, SpinnerIcon, ChevronLeftIcon } from './Icons';
const FileItem = ({ item, onClick }) => {
    const getIcon = () => {
        if (item.type === 'directory')
            return <FolderIcon />;
        if (item.type === 'notebook')
            return <NotebookIcon />;
        return <FileIcon />;
    };
    return (<li onClick={onClick} className="flex items-center p-3 hover:bg-sky-900/40 rounded-md cursor-pointer transition-colors duration-150 space-x-4 border border-transparent">
      <span className="text-sky-400">{getIcon()}</span>
      <span className="truncate">{item.name}</span>
    </li>);
};
export const FileBrowser = ({ server, onFileSelect, onDisconnect }) => {
    const [path, setPath] = useState('');
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchContents = useCallback(async (currentPath) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await getContents(server, currentPath);
            if (data.type === 'directory' && Array.isArray(data.content)) {
                const sortedContents = data.content.sort((a, b) => {
                    if (a.type === 'directory' && b.type !== 'directory')
                        return -1;
                    if (a.type !== 'directory' && b.type === 'directory')
                        return 1;
                    return a.name.localeCompare(b.name);
                });
                setContents(sortedContents);
            }
            else {
                // Handle case where content is not a directory or not an array, e.g., viewing a file directly
                setContents([]);
            }
        }
        catch (e) {
            setError(e.message || 'Failed to fetch files.');
        }
        finally {
            setIsLoading(false);
        }
    }, [server]);
    useEffect(() => {
        fetchContents(path);
    }, [path, fetchContents]);
    const handleItemClick = (item) => {
        if (item.type === 'directory') {
            setPath(item.path);
        }
        else {
            onFileSelect(item.path, item.type);
        }
    };
    const goBack = () => {
        if (path) {
            const newPath = path.substring(0, path.lastIndexOf('/'));
            setPath(newPath);
        }
    };
    return (<div className="min-h-screen bg-slate-900 flex flex-col p-2 md:p-4">
      <header className="flex items-center justify-between p-4 bg-slate-800 rounded-t-lg border-b border-slate-700">
        <div className="flex items-center space-x-3 min-w-0">
            {path && <button onClick={goBack} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"><ChevronLeftIcon /></button>}
            <h1 className="text-xl font-semibold truncate text-slate-200">
                <span className="text-slate-500">/</span>
                {path}
            </h1>
        </div>
        <button onClick={onDisconnect} className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded-md transition-colors">Disconnect</button>
      </header>
      <main className="flex-1 bg-slate-800 rounded-b-lg p-3 overflow-y-auto">
        {isLoading && <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-8 h-8"/></div>}
        {error && <div className="text-red-400 p-4 bg-red-900/30 rounded-md m-2">{error}</div>}
        {!isLoading && !error && (<ul>
            {contents.map((item) => (<FileItem key={item.path} item={item} onClick={() => handleItemClick(item)}/>))}
          </ul>)}
      </main>
    </div>);
};
