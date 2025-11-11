import type { IJupyterServer, IContent, IKernel, INotebook } from '../types';

/**
 * A wrapper around fetch for making authenticated requests to the Jupyter Server API.
 * @param server The server configuration object.
 * @param path The API endpoint path (e.g., /api/contents).
 * @param options Standard fetch options.
 * @returns The JSON response from the API.
 */
const jupyterFetch = async <T,>(server: IJupyterServer, path: string, options: RequestInit = {}): Promise<T> => {
  const { url, token } = server;
  
  // NOTE: When connecting to a Jupyter server from a web app (especially localhost),
  // you will likely encounter CORS (Cross-Origin Resource Sharing) errors.
  // The Jupyter server must be configured to allow requests from the origin
  // your web app is running on.
  // For development, you can start Jupyter with:
  // jupyter notebook --NotebookApp.allow_origin='*' --NotebookApp.token='your_token'
  // In production, specify your app's actual domain instead of '*'.
  const fullUrl = new URL(url + path);
  
  const response = await fetch(fullUrl.toString(), {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `token ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Jupyter API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  // For 204 No Content responses, we can't call .json(), so return null.
  if (response.status === 204) {
    return null as unknown as Promise<T>;
  }

  // Gracefully handle non-json responses if they occur.
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
      return response.json() as Promise<T>;
  }
  return response.text() as unknown as Promise<T>;
};

export const getContents = (server: IJupyterServer, path: string = ''): Promise<IContent> => {
  return jupyterFetch<IContent>(server, `/api/contents/${path}`);
};

export const startKernel = (server: IJupyterServer): Promise<IKernel> => {
    return jupyterFetch<IKernel>(server, '/api/kernels', {
        method: 'POST',
        body: JSON.stringify({ name: 'python3' }),
    });
};

export const shutdownKernel = (server: IJupyterServer, kernelId: string): Promise<void> => {
    return jupyterFetch<void>(server, `/api/kernels/${kernelId}`, {
        method: 'DELETE',
    });
};

export const interruptKernel = (server: IJupyterServer, kernelId: string): Promise<void> => {
    return jupyterFetch<void>(server, `/api/kernels/${kernelId}/interrupt`, {
        method: 'POST',
    });
};

export const restartKernel = (server: IJupyterServer, kernelId: string): Promise<void> => {
    return jupyterFetch<void>(server, `/api/kernels/${kernelId}/restart`, {
        method: 'POST',
    });
};

export const getKernelSocketUrl = (server: IJupyterServer, kernelId: string): string => {
    const { url, token } = server;
    const wsProtocol = url.startsWith('https') ? 'wss' : 'ws';
    // Strip http(s):// from the base URL to construct the WebSocket URL
    const httpUrl = url.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${httpUrl}/api/kernels/${kernelId}/channels?token=${token}`;
}

export const getNotebookContent = async (server: IJupyterServer, path: string): Promise<INotebook> => {
    const content = await getContents(server, path);
    if (content.type !== 'notebook') {
        throw new Error('Path does not point to a notebook');
    }
    return content.content as INotebook;
};

export const saveNotebookContent = (server: IJupyterServer, path: string, notebook: INotebook): Promise<IContent> => {
    const payload = {
        type: 'notebook' as const,
        format: 'json' as const,
        content: notebook,
    };

    return jupyterFetch<IContent>(server, `/api/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
