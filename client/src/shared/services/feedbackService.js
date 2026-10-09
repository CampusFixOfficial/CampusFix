import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
function headers() {
  const token = localStorage.getItem('campusfix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
async function request(promise, fallback) {
  try {
    const response = await promise;
    return response.data?.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || fallback);
  }
}

export async function submitPlatformFeedback(payload) {
  return request(axios.post(`${API_BASE}/feedback`, payload, { headers: headers() }), 'Your feedback could not be saved.');
}

export async function getPlatformFeedback() {
  return (await request(axios.get(`${API_BASE}/feedback`, { headers: headers() }), 'Could not load CampusFix feedback.')).feedback || [];
}
