import type { IUbuntuARMConfig, ITerminalSession } from '../types';

/**
 * Service for managing Ubuntu ARM container connections and terminal sessions.
 * This service handles communication with Ubuntu ARM environments running in containers.
 */

/**
 * Creates a WebSocket connection to the Ubuntu ARM container terminal.
 * @param config The Ubuntu ARM configuration
 * @param onData Callback for receiving data from the terminal
 * @param onError Callback for handling errors
 * @returns WebSocket instance
 */
export const connectToTerminal = (
  config: IUbuntuARMConfig,
  onData: (data: string) => void,
  onError: (error: Error) => void,
  onClose: () => void
): WebSocket => {
  const { url, token } = config;
  
  // Construct WebSocket URL for terminal connection
  const wsProtocol = url.startsWith('https') ? 'wss' : 'ws';
  const httpUrl = url.replace(/^https?:\/\//, '');
  const wsUrl = token 
    ? `${wsProtocol}://${httpUrl}/terminal?token=${token}`
    : `${wsProtocol}://${httpUrl}/terminal`;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('Terminal WebSocket connected');
  };

  ws.onmessage = (event) => {
    onData(event.data);
  };

  ws.onerror = (event) => {
    console.error('Terminal WebSocket error:', event);
    onError(new Error('WebSocket connection error'));
  };

  ws.onclose = () => {
    console.log('Terminal WebSocket closed');
    onClose();
  };

  return ws;
};

/**
 * Sends a command to the terminal via WebSocket.
 * @param ws WebSocket instance
 * @param command Command to send
 */
export const sendCommand = (ws: WebSocket, command: string): void => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'input', data: command }));
  } else {
    throw new Error('WebSocket is not connected');
  }
};

/**
 * Closes the terminal WebSocket connection.
 * @param ws WebSocket instance
 */
export const closeTerminal = (ws: WebSocket): void => {
  if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
    ws.close();
  }
};

/**
 * Tests the connection to an Ubuntu ARM container.
 * @param config The Ubuntu ARM configuration
 * @returns Promise that resolves if connection is successful
 */
export const testConnection = async (config: IUbuntuARMConfig): Promise<boolean> => {
  const { url, token } = config;
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${url}/api/status`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.status} ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Connection test error:', error);
    throw error;
  }
};

/**
 * Fetches available Ubuntu ARM environments/containers.
 * @param baseUrl Base URL of the container management service
 * @param token Optional authentication token
 * @returns Promise with list of available configurations
 */
export const getAvailableEnvironments = async (
  baseUrl: string,
  token?: string
): Promise<IUbuntuARMConfig[]> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${baseUrl}/api/environments`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch environments: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching environments:', error);
    return [];
  }
};

/**
 * Creates a new Ubuntu ARM container session.
 * @param config The Ubuntu ARM configuration
 * @returns Promise with session details
 */
export const createSession = async (config: IUbuntuARMConfig): Promise<ITerminalSession> => {
  const { url, token } = config;
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${url}/api/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        architecture: config.architecture,
        distribution: config.distribution,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.status}`);
    }

    const sessionData = await response.json();
    
    return {
      id: sessionData.id || crypto.randomUUID(),
      config,
      connected: true,
      lastActivity: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Terminates an Ubuntu ARM container session.
 * @param config The Ubuntu ARM configuration
 * @param sessionId The session ID to terminate
 */
export const terminateSession = async (
  config: IUbuntuARMConfig,
  sessionId: string
): Promise<void> => {
  const { url, token } = config;
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${url}/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Failed to terminate session: ${response.status}`);
    }
  } catch (error) {
    console.error('Error terminating session:', error);
    throw error;
  }
};
