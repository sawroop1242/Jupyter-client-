import React, { useState } from 'react';
import type { IUbuntuARMConfig } from '../types';
import { testConnection } from '../services/ubuntuArmService';

interface UbuntuARMSetupProps {
  onConnect: (config: IUbuntuARMConfig) => void;
  onBack: () => void;
  error: string | null;
  isConnecting: boolean;
}

export const UbuntuARMSetup: React.FC<UbuntuARMSetupProps> = ({
  onConnect,
  onBack,
  error,
  isConnecting,
}) => {
  const [formData, setFormData] = useState<Partial<IUbuntuARMConfig>>({
    name: 'Ubuntu ARM Container',
    url: 'http://localhost:8080',
    token: '',
    architecture: 'arm64',
    distribution: 'Ubuntu 22.04',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url || !formData.architecture || !formData.distribution) {
      return;
    }

    const config: IUbuntuARMConfig = {
      id: crypto.randomUUID(),
      name: formData.name,
      url: formData.url,
      token: formData.token,
      architecture: formData.architecture as 'arm64' | 'armv7',
      distribution: formData.distribution,
    };

    onConnect(config);
  };

  const handleChange = (field: keyof IUbuntuARMConfig, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-blue-600 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Ubuntu ARM Terminal</h1>
          <p className="text-gray-400">Connect to your Ubuntu ARM container</p>
        </div>

        {/* Connection Form */}
        <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                Container Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Ubuntu ARM Container"
                required
              />
            </div>

            {/* URL */}
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-1">
                Container URL
              </label>
              <input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => handleChange('url', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="http://localhost:8080"
                required
              />
              <p className="mt-1 text-xs text-gray-400">
                The URL where your Ubuntu ARM container is accessible
              </p>
            </div>

            {/* Token */}
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-gray-300 mb-1">
                Access Token (Optional)
              </label>
              <input
                id="token"
                type="password"
                value={formData.token}
                onChange={(e) => handleChange('token', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter access token if required"
              />
            </div>

            {/* Architecture */}
            <div>
              <label htmlFor="architecture" className="block text-sm font-medium text-gray-300 mb-1">
                Architecture
              </label>
              <select
                id="architecture"
                value={formData.architecture}
                onChange={(e) => handleChange('architecture', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="arm64">ARM64 (aarch64)</option>
                <option value="armv7">ARMv7 (32-bit)</option>
              </select>
            </div>

            {/* Distribution */}
            <div>
              <label htmlFor="distribution" className="block text-sm font-medium text-gray-300 mb-1">
                Distribution
              </label>
              <select
                id="distribution"
                value={formData.distribution}
                onChange={(e) => handleChange('distribution', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="Ubuntu 22.04">Ubuntu 22.04 LTS</option>
                <option value="Ubuntu 20.04">Ubuntu 20.04 LTS</option>
                <option value="Ubuntu 24.04">Ubuntu 24.04 LTS</option>
                <option value="Debian 11">Debian 11 (Bullseye)</option>
                <option value="Debian 12">Debian 12 (Bookworm)</option>
              </select>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-900 border border-red-700 rounded-md">
                <p className="text-sm text-red-100">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                disabled={isConnecting}
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  'Connect'
                )}
              </button>
            </div>
          </form>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-gray-900 rounded-md border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Connection Requirements:</h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Ubuntu ARM container must be running and accessible</li>
              <li>• WebSocket support required for terminal connection</li>
              <li>• CORS must be configured to allow connections</li>
              <li>• Optional: Authentication token for secure access</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Supports ARM64 and ARMv7 architectures</p>
        </div>
      </div>
    </div>
  );
};
