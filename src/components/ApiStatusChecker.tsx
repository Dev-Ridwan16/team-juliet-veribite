"use client";

import { useState, useEffect } from "react";
import { API_CONFIG, apiService } from "@/lib/api";

export default function ApiStatusChecker() {
  const [status, setStatus] = useState<{
    connected: boolean;
    url: string;
    error?: string;
    responseTime?: number;
  }>({
    connected: false,
    url: API_CONFIG.baseURL || "Not configured",
  });

  const checkApiHealth = async () => {
    const startTime = Date.now();

    try {
      await apiService.checkHealth();
      const responseTime = Date.now() - startTime;

      setStatus({
        connected: true,
        url: API_CONFIG.baseURL,
        responseTime,
      });
    } catch (error: any) {
      setStatus({
        connected: false,
        url: API_CONFIG.baseURL,
        error: error.message,
      });
    }
  };

  useEffect(() => {
    if (API_CONFIG.baseURL) {
      checkApiHealth();
    }
  }, []);

  if (!API_CONFIG.baseURL) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <span className="text-yellow-600">⚠️</span>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Backend API Not Configured
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Set NEXT_PUBLIC_API_URL environment variable to connect to the
              backend.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-4 mb-4 ${
        status.connected
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
      }`}
    >
      <div className="flex items-center">
        <span className="text-2xl">{status.connected ? "✅" : "❌"}</span>
        <div className="ml-3 flex-1">
          <h3
            className={`text-sm font-medium ${
              status.connected ? "text-green-800" : "text-red-800"
            }`}
          >
            Backend API: {status.connected ? "Connected" : "Disconnected"}
          </h3>
          <p
            className={`text-sm mt-1 ${
              status.connected ? "text-green-700" : "text-red-700"
            }`}
          >
            URL: {status.url}
          </p>
          {status.responseTime && (
            <p className="text-sm text-green-600 mt-1">
              Response time: {status.responseTime}ms
            </p>
          )}
          {status.error && (
            <p className="text-sm text-red-600 mt-1">Error: {status.error}</p>
          )}
        </div>
        <button
          onClick={checkApiHealth}
          className="ml-4 px-3 py-1 text-xs bg-white bg-opacity-20 rounded hover:bg-opacity-30 transition-all"
        >
          Test Again
        </button>
      </div>
    </div>
  );
}
