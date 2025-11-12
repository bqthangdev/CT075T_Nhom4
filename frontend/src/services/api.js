import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/${API_VERSION}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

const api = {
  // Prediction endpoints
  predictStrokeRisk: (data) => {
    return apiClient.post('/predictions/predict', data);
  },

  getPredictionHistory: () => {
    return apiClient.get('/predictions/history');
  },

  deleteHistoryItem: (index) => {
    return apiClient.delete(`/predictions/history/${index}`);
  },

  clearAllHistory: () => {
    return apiClient.delete('/predictions/history');
  },

  // Config endpoints
  getConfig: () => {
    return apiClient.get('/config');
  },

  updateConfig: (data) => {
    return apiClient.put('/config', data);
  },

  resetConfig: () => {
    return apiClient.post('/config/reset');
  },

  getMetrics: () => {
    return apiClient.get('/metrics');
  },

  // Training endpoints
  trainModels: () => {
    return apiClient.post('/train');
  },

  getTrainingStatus: () => {
    return apiClient.get('/train/status');
  },

  // Validation endpoints
  kfoldValidation: (k_folds, data_percent = 100) => {
    return apiClient.post('/validation/kfold', { k_folds, data_percent });
  },

  getDatasetInfo: () => {
    return apiClient.get('/validation/dataset/info');
  },

  // Health check
  healthCheck: () => {
    return axios.get(`${API_BASE_URL}/health`);
  },
};

export default api;
