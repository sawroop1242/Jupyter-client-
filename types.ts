export interface IJupyterServer {
  id: string;
  name: string;
  url: string;
  token: string;
}

export type ContentType = 'notebook' | 'file' | 'directory';

export interface IContent {
  name: string;
  path: string;
  type: ContentType;
  writable: boolean;
  last_modified: string;
  mimetype: string | null;
  content: any;
  format: string | null;
}

export type CellType = 'code' | 'markdown' | 'raw';

export interface ICellOutput {
  output_type: string;
  text?: string | string[];
  data?: { [key: string]: any };
  traceback?: string[];
  execution_count?: number;
}

export interface ICell {
  id: string; // Client-side unique ID
  cell_type: CellType;
  source: string | string[];
  metadata: any;
  outputs?: ICellOutput[];
  execution_count: number | null;
}

export interface INotebook {
  cells: ICell[];
  metadata: any;
  nbformat: number;
  nbformat_minor: number;
}

export interface IKernel {
  id: string;
  name: string;
  last_activity: string;
  execution_state: string;
  connections: number;
}

export interface IUbuntuARMConfig {
  id: string;
  name: string;
  url: string;
  token?: string;
  architecture: 'arm64' | 'armv7';
  distribution: string;
}

export interface ITerminalSession {
  id: string;
  config: IUbuntuARMConfig;
  connected: boolean;
  lastActivity: string;
}

export interface ITerminalMessage {
  type: 'input' | 'output' | 'error' | 'control';
  data: string;
  timestamp: number;
}
