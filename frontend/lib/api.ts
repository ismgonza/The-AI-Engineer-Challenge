// API utility functions with configurable base URL

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const api = {
  // Health check
  health: () => fetch(`${API_BASE_URL}/api/health`),
  
  // File operations
  uploadFiles: (formData: FormData) => 
    fetch(`${API_BASE_URL}/api/upload-files`, {
      method: 'POST',
      body: formData,
    }),
  
  getFiles: (apiKey: string) => 
    fetch(`${API_BASE_URL}/api/files?api_key=${encodeURIComponent(apiKey)}`),
  
  clearFiles: (apiKey: string) => {
    const formData = new FormData();
    formData.append('api_key', apiKey);
    return fetch(`${API_BASE_URL}/api/files`, {
      method: 'DELETE',
      body: formData,
    });
  },
  
  analyzeFile: (data: {
    api_key: string;
    filename_or_index: string;
    model?: string;
    provider?: string;
  }) => 
    fetch(`${API_BASE_URL}/api/analyze-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  
  // Chat operations
  chat: (data: {
    messages: Array<{role: string; content: string}>;
    developer_message: string;
    user_message: string;
    model?: string;
    api_key: string;
    use_rag?: boolean;
    provider?: string;
    use_engineering_mode?: boolean;
  }) => 
    fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
  
  ragChat: (data: {
    messages: Array<{role: string; content: string}>;
    developer_message: string;
    user_message: string;
    model?: string;
    api_key: string;
    provider?: string;
    use_engineering_mode?: boolean;
  }) => 
    fetch(`${API_BASE_URL}/api/rag-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }),
};

export default api;
