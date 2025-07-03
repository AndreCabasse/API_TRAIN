import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const userApi = {
  register: async (username: string, email: string, password: string) => {
    await axios.post(`${API_URL}/register`, { username, email, password });
  },
  login: async (username: string, password: string) => {
    const res = await axios.post(`${API_URL}/token`, new URLSearchParams({ username, password }));
    localStorage.setItem("token", res.data.access_token);
    return res.data;
  },
  getMe: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/me`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },
  savePreferences: async (prefs: any) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/preferences`, prefs, { headers: { Authorization: `Bearer ${token}` } });
  },
  getPreferences: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/preferences`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },
  getHistory: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/history`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },
  addHistory: async (item: any) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    await axios.post(`${API_URL}/history`, item, { headers: { Authorization: `Bearer ${token}` } });
  },
  getMySimulations: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/my-simulations`, { headers: { Authorization: `Bearer ${token}` } });
    return res.data;
  },
  deleteHistory: async (idx: number) => {
  const token = localStorage.getItem("token");
  await axios.delete(`${API_URL}/history/${idx}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  },
  deleteSimulation: async (simId: number) => {
  const token = localStorage.getItem("token");
  await axios.delete(`${API_URL}/simulation/${simId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  },
  saveSimulation: async (sim: { name: string; data: any }) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/save-simulation`, sim, { headers: { Authorization: `Bearer ${token}` } });
  },
};