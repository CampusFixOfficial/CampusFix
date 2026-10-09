import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const COMPLAINTS_URL = `${API_BASE}/complaints`;
const headers = () => {
  const token = localStorage.getItem('campusfix_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};
const request = async (promise, fallback) => {
  try {
    const response = await promise;
    return response.data?.data || response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || fallback);
  }
};

export const getMyComplaints = async () => (await request(axios.get(`${COMPLAINTS_URL}/mine`, { headers: headers() }), 'Could not load your reports.')).complaints || [];
export const getNotifications = async () => request(axios.get(`${API_BASE}/notifications`, { headers: headers() }), 'Could not load notifications.');
export const getDepartmentComplaints = async () => (await request(axios.get(`${COMPLAINTS_URL}/department`, { headers: headers() }), 'Could not load the authority queue.')).complaints || [];
export const getComplaintById = async (id) => {
  if (!id) throw new Error('Report ID is required.');
  return (await request(axios.get(`${COMPLAINTS_URL}/${id}`, { headers: headers() }), 'Could not load this report.')).complaint;
};
export const createComplaint = async (formData) => {
  if (!formData?.description?.trim()) throw new Error('Describe what happened before submitting.');
  return (await request(axios.post(COMPLAINTS_URL, formData, { headers: { 'Content-Type': 'application/json', ...headers() } }), 'Could not submit your report.')).complaint;
};
export const updateComplaintStatus = async (id, status, remarks = '') => (await request(axios.patch(`${COMPLAINTS_URL}/${id}/status`, { status, remarks }, { headers: headers() }), 'Could not update this report.')).complaint;
export const acknowledgeComplaint = async (id) => (await request(axios.patch(`${COMPLAINTS_URL}/${id}/acknowledge`, {}, { headers: headers() }), 'Could not acknowledge this report.')).complaint;
export const submitAuthorityRemark = async (id, message) => {
  if (!message?.trim()) throw new Error('Write a short update before adding it.');
  return (await request(axios.post(`${COMPLAINTS_URL}/${id}/remarks`, { message: message.trim() }, { headers: headers() }), 'Could not save this update.')).remarks || [];
};
export const reassignComplaint = async (id, departmentId) => (await request(axios.patch(`${COMPLAINTS_URL}/${id}/reassign`, { departmentId }, { headers: headers() }), 'Could not reassign this report.')).complaint;
export const submitFeedback = async (id, rating, comment = '') => {
  if (!Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) throw new Error('Choose a rating from 1 to 5.');
  return (await request(axios.patch(`${COMPLAINTS_URL}/${id}/feedback`, { rating: Number(rating), comment: comment.trim() }, { headers: headers() }), 'Could not save your feedback.')).complaint;
};
export const getDepartments = async () => (await request(axios.get(`${API_BASE}/departments`, { headers: headers() }), 'Could not load CampusFix teams.')).departments || [];
export const updateDepartment = async (id, payload) => (await request(axios.put(`${API_BASE}/departments/${id}`, payload, { headers: headers() }), 'Could not save this team mapping.')).department;
export const getAuthorities = async () => (await request(axios.get(`${API_BASE}/admin/authorities`, { headers: headers() }), 'Could not load authority accounts.')).authorities || [];
export const getLocationCatalogue = async () => request(axios.get(`${API_BASE}/admin/location-catalogue`, { headers: headers() }), 'Could not load the campus location catalogue.');
export const updateLocationCatalogue = async (payload) => request(axios.put(`${API_BASE}/admin/location-catalogue`, payload, { headers: headers() }), 'Could not save the campus location catalogue.');
export const getPlatformFeedback = async () => (await request(axios.get(`${API_BASE}/feedback`, { headers: headers() }), 'Could not load CampusFix feedback.')).feedback || [];
export const createAuthority = async (payload) => (await request(axios.post(`${API_BASE}/admin/authorities`, payload, { headers: headers() }), 'Could not create the authority account.')).authority;
export const updateAuthority = async (id, payload) => (await request(axios.patch(`${API_BASE}/admin/authorities/${id}`, payload, { headers: headers() }), 'Could not update the authority account.')).authority;
export const getAdminSummary = async () => (await request(axios.get(`${API_BASE}/admin/summary`, { headers: headers() }), 'Could not load the CampusFix overview.'));
export const getCampusLandscape = async () => request(axios.get(`${API_BASE}/analytics/campus-landscape`, { headers: headers() }), 'Could not load the campus problem landscape.');
export const seedDepartments = async () => request(axios.post(`${API_BASE}/departments/seed`, {}, { headers: headers() }), 'Could not prepare CampusFix teams.');

export default { getMyComplaints, getNotifications, getDepartmentComplaints, getComplaintById, createComplaint, updateComplaintStatus, acknowledgeComplaint, submitAuthorityRemark, reassignComplaint, submitFeedback, getDepartments, updateDepartment, getAuthorities, getLocationCatalogue, updateLocationCatalogue, getPlatformFeedback, createAuthority, updateAuthority, getAdminSummary, getCampusLandscape, seedDepartments };
