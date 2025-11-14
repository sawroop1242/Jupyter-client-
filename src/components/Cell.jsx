import React, { useState, useEffect } from 'react';
import { PlayIcon, SpinnerIcon, TrashIcon, CodeIcon, MarkdownIcon } from './Icons';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { atomone } from '@uiw/codemirror-theme-atomone';
import { marked } from 'marked';
const renderOutput = (output, index) => {
    switch (output.output_type) {
        case 'stream':
            return (<pre key={index} className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
          {Array.isArray(output.text) ? output.text.join('') : output.text}
        </pre>);
        case 'execute_result':
        case 'display_data':
            if (output.data?.['image/png']) {
                return <img key={index} src={`data:image/png;base64,${output.data['image/png']}`} alt="cell output" className="max-w-full h-auto bg-white p-1 my-1 rounded"/>;
            }
            if (output.data?.['text/html']) {
                const html = Array.isArray(output.data['text/html']) ? output.data['text/html'].join('') : output.data['text/html'];
                return <div key={index} className="prose-output text-slate-200" dangerouslySetInnerHTML={{ __html: html }}></div>;
            }
            if (output.data?.['text/plain']) {
                return (<pre key={index} className="text-slate-300 whitespace-pre-wrap font-mono text-sm">
            {Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : output.data['text/plain']}
          </pre>);
            }
            return <pre key={index} className="text-xs text-slate-500 font-mono">[Unsupported output data type]</pre>;
        case 'error':
            // Strip ANSI color codes for cleaner display
            const traceback = output.traceback?.join('\n').replace(/[\u001b\u009b][[()#;?]*.?[0-9]*[;:]?[0-9]*[ .]?[a-zA-Z0-9_-]*[@-~]/g, '');
            return (<pre key={index} className="text-red-400 bg-red-900/20 p-3 rounded whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {traceback}
        </pre>);
        default:
            return <pre key={index} className="text-xs text-slate-500 font-mono">[Unknown output type: {output.output_type}]</pre>;
    }
};
const CellToolbar = ({ onRun, onDelete, onAddCell, isRunning, cellType }) => (<div className="absolute top-2 right-2 z-20 flex items-center space-x-1 p-1 bg-slate-700/50 backdrop-blur-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-slate-600/50">
        <button onClick={() => onAddCell('code')} className="p-1.5 text-slate-400 hover:bg-slate-600 hover:text-sky-400 rounded" title="Add code cell below"><CodeIcon className="w-4 h-4"/></button>
        <button onClick={() => onAddCell('markdown')} className="p-1.5 text-slate-400 hover:bg-slate-600 hover:text-sky-400 rounded" title="Add markdown cell below"><MarkdownIcon className="w-4 h-4"/></button>
        <button onClick={onDelete} className="p-1.5 text-slate-400 hover:bg-slate-600 hover:text-red-400 rounded" title="Delete cell"><TrashIcon className="w-4 h-4"/></button>
        {cellType === 'code' && (<button onClick={onRun} disabled={isRunning} className="p-1.5 text-slate-400 hover:bg-slate-600 hover:text-green-400 rounded disabled:text-slate-500" title="Run cell">
                {isRunning ? <SpinnerIcon className="w-4 h-4"/> : <PlayIcon className="w-4 h-4"/>}
            </button>)}
    </div>);
export const Cell = ({ cell, onRun, onDelete, onAddCell, onUpdateSource, isRunning }) => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    const commonContainerClasses = "py-3 flex space-x-4 group relative border-b border-slate-700/50 last:border-b-0 pl-4 pr-2";
    if (cell.cell_type === 'markdown') {
        const [html, setHtml] = useState('');
        useEffect(() => {
            let isMounted = true;
            // The 'marked' library is async. We must resolve the promise it returns.
            Promise.resolve(marked.parse(source)).then(parsedHtml => {
                if (isMounted && typeof parsedHtml === 'string') {
                    setHtml(parsedHtml);
                }
            });
            return () => { isMounted = false; };
        }, [source]);
        return (<div className={commonContainerClasses}>
         <div className="w-16 text-center text-xs text-slate-600 pt-2 flex-shrink-0 font-mono select-none">MD</div>
         <div className="flex-1 min-w-0">
             <CellToolbar onRun={onRun} onDelete={onDelete} onAddCell={onAddCell} isRunning={isRunning} cellType="markdown"/>
             <div className="prose-output max-w-none p-4" dangerouslySetInnerHTML={{ __html: html }}/>
         </div>
      </div>);
    }
    if (cell.cell_type === 'code') {
        const runningIndicator = isRunning ? '*' : '';
        const executionLabel = `[${cell.execution_count || ' '}${runningIndicator}]`;
        return (<div className={commonContainerClasses}>
        <div className="w-16 text-right text-xs text-slate-500 pt-2 flex-shrink-0 font-mono pr-2 select-none" title={`Execution Count: ${cell.execution_count}`}>{executionLabel}</div>
        <div className="flex-1 min-w-0">
          <CellToolbar onRun={onRun} onDelete={onDelete} onAddCell={onAddCell} isRunning={isRunning} cellType="code"/>
          <div className="border border-slate-700 rounded-md shadow-md">
            <CodeMirror value={source} height="auto" extensions={[python()]} theme={atomone} onChange={onUpdateSource} basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                autocompletion: true,
            }}/>
          </div>
          {cell.outputs && cell.outputs.length > 0 && (<div className="mt-4 pr-3 pl-1 py-2 bg-slate-900/50 rounded-md">
              {cell.outputs.map(renderOutput)}
            </div>)}
        </div>
      </div>);
    }
    return null;
};
