import React, { useState, useEffect } from 'react';
import type { ICell, ICellOutput, CellType } from '../types';
import { PlayIcon, SpinnerIcon, TrashIcon, CodeIcon, MarkdownIcon } from './Icons';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { marked } from 'marked';


interface CellProps {
  cell: ICell;
  onRun: () => void;
  onDelete: () => void;
  onAddCell: (type: CellType) => void;
  onUpdateSource: (source: string) => void;
  isRunning: boolean;
}

const renderOutput = (output: ICellOutput, index: number) => {
  switch (output.output_type) {
    case 'stream':
      return (
        <pre key={index} className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
          {Array.isArray(output.text) ? output.text.join('') : output.text}
        </pre>
      );
    case 'execute_result':
    case 'display_data':
      if (output.data?.['image/png']) {
        return <img key={index} src={`data:image/png;base64,${output.data['image/png']}`} alt="cell output" className="max-w-full h-auto bg-white p-1 my-1 rounded"/>;
      }
      if (output.data?.['text/html']) {
        const html = Array.isArray(output.data['text/html']) ? output.data['text/html'].join('') : output.data['text/html'];
        return <div key={index} className="prose-output text-gray-200" dangerouslySetInnerHTML={{__html: html}}></div>;
      }
       if (output.data?.['text/plain']) {
        return (
          <pre key={index} className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
            {Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : output.data['text/plain']}
          </pre>
        );
      }
      return <pre key={index} className="text-xs text-gray-500 font-mono">[Unsupported output data type]</pre>;
    case 'error':
      // Strip ANSI color codes for cleaner display
      const traceback = output.traceback?.join('\n').replace(/[\u001b\u009b][[()#;?]*.?[0-9]*[;:]?[0-9]*[ .]?[a-zA-Z0-9_-]*[@-~]/g, '');
      return (
        <pre key={index} className="text-red-400 bg-red-900/20 p-3 rounded whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {traceback}
        </pre>
      );
    default:
      return  <pre key={index} className="text-xs text-gray-500 font-mono">[Unknown output type: {output.output_type}]</pre>;
  }
};

const CellToolbar: React.FC<{onRun: ()=>void, onDelete: ()=>void, onAddCell: (type:CellType)=>void, isRunning:boolean, cellType: CellType}> = 
  ({onRun, onDelete, onAddCell, isRunning, cellType}) => (
    <div className="absolute top-2 right-2 z-20 flex items-center space-x-1 p-1 bg-gray-700/60 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-gray-600/50">
        <button onClick={() => onAddCell('code')} className="p-1.5 text-gray-400 hover:bg-gray-600 hover:text-white rounded" title="Add code cell below"><CodeIcon className="w-4 h-4" /></button>
        <button onClick={() => onAddCell('markdown')} className="p-1.5 text-gray-400 hover:bg-gray-600 hover:text-white rounded" title="Add markdown cell below"><MarkdownIcon className="w-4 h-4" /></button>
        <button onClick={onDelete} className="p-1.5 text-gray-400 hover:bg-gray-600 hover:text-rose-400 rounded" title="Delete cell"><TrashIcon className="w-4 h-4"/></button>
        {cellType === 'code' && (
            <button onClick={onRun} disabled={isRunning} className="p-1.5 text-gray-400 hover:bg-gray-600 hover:text-emerald-400 rounded disabled:text-gray-500" title="Run cell">
                {isRunning ? <SpinnerIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4" />}
            </button>
        )}
    </div>
);


export const Cell: React.FC<CellProps> = ({ cell, onRun, onDelete, onAddCell, onUpdateSource, isRunning }) => {
  const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
  
  const commonContainerClasses = "py-4 flex space-x-4 group relative border-b border-gray-800 last:border-b-0";

  if (cell.cell_type === 'markdown') {
    const [html, setHtml] = useState('');

    useEffect(() => {
        let isMounted = true;
        // The 'marked' library is async. We must resolve the promise it returns.
        Promise.resolve(marked.parse(source) as string | Promise<string>).then(parsedHtml => {
            if (isMounted && typeof parsedHtml === 'string') {
                setHtml(parsedHtml);
            }
        });
        return () => { isMounted = false; };
    }, [source]);
    
    return (
      <div className={commonContainerClasses}>
         <div className="w-16 text-center text-xs text-gray-600 pt-2 flex-shrink-0 font-mono select-none">MD</div>
         <div className="flex-1 min-w-0 bg-gray-800/30 rounded-md p-1 hover:bg-gray-800/50 transition-colors">
             <CellToolbar onRun={onRun} onDelete={onDelete} onAddCell={onAddCell} isRunning={isRunning} cellType="markdown" />
             <div 
                className="prose-output max-w-none p-4" 
                dangerouslySetInnerHTML={{ __html: html }}
             />
         </div>
      </div>
    );
  }

  if (cell.cell_type === 'code') {
    const runningIndicator = isRunning ? '*' : '';
    const executionLabel = `[${cell.execution_count || ' '}${runningIndicator}]`;

    return (
      <div className={commonContainerClasses}>
        <div className="w-16 text-right text-xs text-gray-500 pt-2 flex-shrink-0 font-mono pr-2 select-none" title={`Execution Count: ${cell.execution_count}`}>{executionLabel}</div>
        <div className="flex-1 min-w-0">
          <CellToolbar onRun={onRun} onDelete={onDelete} onAddCell={onAddCell} isRunning={isRunning} cellType="code" />
          <div className="border border-gray-700/80 rounded-md shadow-md">
            <CodeMirror
                value={source}
                height="auto"
                extensions={[python()]}
                theme={atomone}
                onChange={onUpdateSource}
                basicSetup={{
                    lineNumbers: false,
                    foldGutter: false,
                    highlightActiveLine: false,
                    autocompletion: true,
                }}
            />
          </div>
          {cell.outputs && cell.outputs.length > 0 && (
            <div className="mt-4 pr-3 pl-1">
              {cell.outputs.map(renderOutput)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
