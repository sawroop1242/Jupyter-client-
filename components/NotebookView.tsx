import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNotebookContent, startKernel, shutdownKernel, getKernelSocketUrl, saveNotebookContent, interruptKernel, restartKernel } from '../services/jupyterService';
import type { IJupyterServer, INotebook, IKernel, ICell as ICellType, ICellOutput, CellType } from '../types';
import { Cell } from './Cell';
import { SpinnerIcon, ChevronLeftIcon, SaveIcon, StopIcon, RefreshIcon } from './Icons';
import { v4 as uuidv4 } from 'uuid';

interface NotebookViewProps {
  server: IJupyterServer;
  path: string;
  onBack: () => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({ server, path, onBack }) => {
  const [notebook, setNotebook] = useState<INotebook | null>(null);
  const [kernel, setKernel] = useState<IKernel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [runningCellId, setRunningCellId] = useState<string | null>(null);
  const [kernelStatus, setKernelStatus] = useState('disconnected');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isInterrupting, setIsInterrupting] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);


  const ws = useRef<WebSocket | null>(null);
  const inflightMessages = useRef(new Map<string, string>()); // msg_id -> cell_id

  const updateCell = useCallback((cellId: string, updates: Partial<ICellType>) => {
    setNotebook(prevNb => {
      if (!prevNb) return null;
      return {
        ...prevNb,
        cells: prevNb.cells.map(c => c.id === cellId ? { ...c, ...updates } : c)
      }
    });
  }, []);

  const initialize = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nb = await getNotebookContent(server, path);
      // Ensure every cell has a unique, client-side ID for state management
      const cellsWithIds = nb.cells.map(c => ({...c, id: c.metadata.id || uuidv4()}));
      setNotebook({...nb, cells: cellsWithIds});
      
      setKernelStatus('starting');
      const krnl = await startKernel(server);
      setKernel(krnl);
      setKernelStatus('connecting');

      const socketUrl = getKernelSocketUrl(server, krnl.id);
      ws.current = new WebSocket(socketUrl);

      ws.current.onopen = () => setKernelStatus('connected');
      ws.current.onclose = () => setKernelStatus('disconnected');
      ws.current.onerror = () => {
        setError('WebSocket connection error. Check server logs and network connection.');
        setKernelStatus('error');
      };

      ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const parent_msg_id = msg.parent_header?.msg_id;
        
        if (msg.msg_type === 'status') {
             setKernelStatus(msg.content.execution_state);
             // If the kernel is idle and we were waiting on a message, stop the running indicator
             if (msg.content.execution_state === 'idle' && parent_msg_id && inflightMessages.current.has(parent_msg_id)) {
                setRunningCellId(null);
                inflightMessages.current.delete(parent_msg_id);
             }
             return;
        }

        if (!parent_msg_id || !inflightMessages.current.has(parent_msg_id)) {
            return;
        }

        const cellId = inflightMessages.current.get(parent_msg_id)!;
        
        switch(msg.msg_type) {
            case 'execute_input':
                 updateCell(cellId, { execution_count: msg.content.execution_count });
                break;
            case 'stream':
            case 'execute_result':
            case 'display_data':
            case 'error':
                 setNotebook(prevNb => {
                    if (!prevNb) return null;
                    const newCells = prevNb.cells.map(c => {
                        if (c.id === cellId) {
                            const newOutputs = [...(c.outputs || []), msg.content as ICellOutput];
                            return {...c, outputs: newOutputs };
                        }
                        return c;
                    });
                    return {...prevNb, cells: newCells};
                 });
                break;
        }
      };

    } catch (e: any) {
      setError(e.message || 'Failed to load notebook or start kernel.');
      setKernelStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [server, path, updateCell]);

  useEffect(() => {
    initialize();
    
    return () => {
        ws.current?.close();
        // Use the functional form of setKernel to get the latest state during cleanup
        setKernel(currentKernel => {
            if(currentKernel?.id) {
                shutdownKernel(server, currentKernel.id).catch(console.error);
            }
            return null;
        });
    };
  }, [initialize, server]);

  const handleRunCell = (cell: ICellType) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !cell.id || !kernel) return;
    
    setRunningCellId(cell.id);
    updateCell(cell.id, { outputs: [] }); // Clear previous output
    
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    const msg_id = uuidv4();
    const msg = {
        header: {
            msg_id,
            username: 'user',
            session: kernel.id,
            date: new Date().toISOString(),
            msg_type: 'execute_request',
            version: '5.3',
        },
        parent_header: {},
        metadata: {},
        content: {
            code: source,
            silent: false,
            store_history: true,
            user_expressions: {},
            allow_stdin: false,
        },
    };
    
    inflightMessages.current.set(msg_id, cell.id);
    ws.current.send(JSON.stringify(msg));
  };
  
  const handleUpdateCellSource = (cellId: string, source: string) => {
    updateCell(cellId, { source });
  }
  
  const handleDeleteCell = (cellId: string) => {
    setNotebook(prev => !prev ? null : ({
        ...prev,
        cells: prev.cells.filter(c => c.id !== cellId),
    }));
  }
  
  const handleAddCell = (index: number, type: CellType) => {
    const newCell: ICellType = {
        id: uuidv4(),
        cell_type: type,
        source: '',
        metadata: {},
        outputs: [],
        execution_count: null,
    };
    setNotebook(prev => {
        if (!prev) return null;
        const newCells = [...prev.cells];
        newCells.splice(index + 1, 0, newCell);
        return {...prev, cells: newCells};
    })
  }
  
  const handleSaveNotebook = async () => {
    if (!notebook) return;

    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);
    
    try {
        const notebookToSave: INotebook = {
            ...notebook,
            cells: notebook.cells.map(cell => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { id, ...restOfCell } = cell; // Strip client-side ID for saving
                // Ensure source is an array of strings ending with newlines, as Jupyter expects
                const source = Array.isArray(cell.source) 
                    ? cell.source 
                    : cell.source.split('\n').map((line, i, arr) => i === arr.length - 1 && !line ? "" : line + '\n');
                
                // If the last line is just a newline, remove it to prevent extra blank lines on save.
                if (source.length > 1 && source[source.length - 1] === '\n') {
                    source.pop();
                }

                return {
                    ...restOfCell,
                    metadata: { ...cell.metadata, id }, // Persist our ID in metadata
                    source,
                };
// FIX: Cast to any to bypass the type checker. The `id` property is intentionally stripped for saving.
            }) as any,
        };
        
        await saveNotebookContent(server, path, notebookToSave);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    } catch(e: any) {
        setError(`Failed to save: ${e.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const handleInterrupt = async () => {
    if (!kernel) return;
    setIsInterrupting(true);
    try {
        await interruptKernel(server, kernel.id);
    } catch (e: any) {
        setError(`Failed to interrupt: ${e.message}`);
    } finally {
        setIsInterrupting(false);
    }
  };

  const handleRestart = async () => {
    if (!kernel) return;
    if (window.confirm('Are you sure you want to restart the kernel? All variables will be lost.')) {
        setIsRestarting(true);
        try {
            await restartKernel(server, kernel.id);
            // On successful restart, clear all outputs and execution counts
            setNotebook(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    cells: prev.cells.map(c => ({
                        ...c,
                        outputs: c.cell_type === 'code' ? [] : c.outputs,
                        execution_count: c.cell_type === 'code' ? null : c.execution_count,
                    }))
                };
            });
            inflightMessages.current.clear();
            setRunningCellId(null);
        } catch (e: any) {
            setError(`Failed to restart: ${e.message}`);
        } finally {
            setIsRestarting(false);
        }
    }
  };

  const notebookName = path.split('/').pop();

  const KernelStatusIndicator = () => {
    const statusMap: {[key:string]: {text:string, color:string, dot: string}} = {
        disconnected: {text: 'Disconnected', color: 'text-red-400', dot: 'bg-red-400'},
        starting: {text: 'Kernel Starting...', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse'},
        connecting: {text: 'Connecting...', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse'},
        connected: {text: 'Connected', color: 'text-green-400', dot: 'bg-green-400'},
        idle: {text: 'Kernel Idle', color: 'text-green-400', dot: 'bg-green-400'},
        busy: {text: 'Kernel Busy', color: 'text-yellow-400', dot: 'bg-yellow-400 animate-pulse'},
        error: {text: 'Error', color: 'text-red-500', dot: 'bg-red-500'},
    }
    const {text, color, dot} = statusMap[kernelStatus] || {text: 'Unknown', color: 'text-gray-400', dot: 'bg-gray-400'};
    return <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${dot}`}></div>
        <span className={`transition-colors duration-300 ${color}`}>{text}</span>
    </div>
  }

  const isKernelActionable = kernelStatus !== 'disconnected' && kernelStatus !== 'starting' && kernelStatus !== 'error';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="sticky top-0 z-30 flex items-center justify-between p-3 bg-gray-800/80 backdrop-blur-md border-b border-gray-700">
        <div className="flex items-center space-x-2 min-w-0">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-700 flex-shrink-0 text-gray-400 hover:text-white transition-colors"><ChevronLeftIcon /></button>
          <h1 className="text-lg font-semibold truncate" title={notebookName}>{notebookName}</h1>
        </div>
        <div className="flex items-center space-x-3">
            <div className="text-xs text-right hidden sm:block">
              <KernelStatusIndicator />
            </div>
            <div className="flex items-center space-x-1 bg-gray-700/50 p-1 rounded-md">
                <button title="Interrupt Kernel" onClick={handleInterrupt} disabled={!isKernelActionable || isInterrupting || kernelStatus !== 'busy'} className="p-1.5 rounded text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    {isInterrupting ? <SpinnerIcon className="w-4 h-4"/> : <StopIcon className="w-4 h-4"/>}
                </button>
                <button title="Restart Kernel" onClick={handleRestart} disabled={!isKernelActionable || isRestarting} className="p-1.5 rounded text-gray-400 hover:bg-gray-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    {isRestarting ? <SpinnerIcon className="w-4 h-4"/> : <RefreshIcon className="w-4 h-4"/>}
                </button>
            </div>
            <button
              onClick={handleSaveNotebook}
              disabled={isSaving || saveSuccess}
              className="flex items-center space-x-2 w-28 justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-md transition-all duration-150 disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                  <SpinnerIcon className="w-5 h-5" />
              ) : saveSuccess ? (
                  <span>Saved!</span>
              ) : (
                  <>
                      <SaveIcon className="w-5 h-5" />
                      <span>Save</span>
                  </>
              )}
            </button>
        </div>
      </header>
      <main className="flex-1 p-1 md:p-4 lg:px-8 xl:px-16 overflow-y-auto">
        {isLoading && <div className="flex justify-center items-center h-full pt-16"><SpinnerIcon className="w-8 h-8"/></div>}
        {error && <div className="text-red-400 p-4 bg-red-900/30 rounded-md m-2 border border-red-500/30">{error}</div>}
        {notebook && (
          <div className="max-w-4xl mx-auto">
            {notebook.cells.map((cell, index) => (
              <Cell 
                key={cell.id} 
                cell={cell} 
                onRun={() => handleRunCell(cell)} 
                onDelete={() => handleDeleteCell(cell.id!)}
                onAddCell={(type) => handleAddCell(index, type)}
                onUpdateSource={(source) => handleUpdateCellSource(cell.id!, source)}
                isRunning={runningCellId === cell.id}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
