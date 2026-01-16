import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout for GEE processing
});

/**
 * Detect water in the specified AOI
 * @param {Object} geometry - GeoJSON geometry
 * @param {Object} params - Optional detection parameters
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Object>} - Detection results
 */
export const detectWater = async (geometry, params = {}, onProgress = null) => {
  try {
    // Simulate progress updates (backend is synchronous)
    let progressInterval;
    if (onProgress) {
      let stage = 0;
      const stages = ['imagery', 'filters', 'vectorizing'];
      onProgress(stages[0]);
      
      progressInterval = setInterval(() => {
        stage = (stage + 1) % stages.length;
        onProgress(stages[stage]);
      }, 15000); // Update every 15 seconds
    }

    const response = await api.post('/detect-water', {
      geometry,
      ...params,
    });

    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    return response.data;
  } catch (error) {
    console.error('Error detecting water:', error);
    
    if (error.response) {
      // Server responded with error
      throw new Error(error.response.data.detail || 'Server error occurred');
    } else if (error.request) {
      // No response received
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Request setup error
      throw new Error(error.message || 'Failed to send request');
    }
  }
};

/**
 * Check API health
 * @returns {Promise<Object>} - Health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
};

export default api;
