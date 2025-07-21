// -*- coding: utf-8 -*-
// Copyright (c) 2025 André CABASSE 
// All rights reserved.
//
// This software is licensed under the MIT License.
// See the LICENSE file for details.
// Contact: andre.cabasse.massena@gmail.com

import axios from "axios";
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

/**
 * userApi provides methods for user authentication, preferences, history, and simulation management.
 */
export const userApi = {
  /**
   * Register a new user with username, email, and password.
   * @param username - The user's username.
   * @param email - The user's email address.
   * @param password - The user's password.
   */
  register: async (username: string, email: string, password: string) => {
    await axios.post(`${API_URL}/register`, { username, email, password });
  },

  /**
   * Log in a user and store the access token in localStorage.
   * @param username - The user's username.
   * @param password - The user's password.
   * @returns The authentication response data.
   */
  login: async (username: string, password: string) => {
    const res = await axios.post(
      `${API_URL}/token`,
      new URLSearchParams({ username, password })
    );
    localStorage.setItem("token", res.data.access_token);
    return res.data;
  },

  /**
   * Get the current authenticated user's profile.
   * @returns The user profile data.
   */
  getMe: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  /**
   * Save user preferences.
   * @param prefs - The preferences object to save.
   */
  savePreferences: async (prefs: any) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/preferences`, prefs, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Retrieve user preferences.
   * @returns The preferences data.
   */
  getPreferences: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/preferences`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  /**
   * Get the user's history (e.g., recent actions or simulations).
   * @returns The history data.
   */
  getHistory: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/history`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  /**
   * Add an item to the user's history.
   * @param item - The history item to add.
   */
  addHistory: async (item: any) => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Not authenticated");
    await axios.post(`${API_URL}/history`, item, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Get all simulations created by the current user.
   * @returns The user's simulations.
   */
  getMySimulations: async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${API_URL}/my-simulations`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  },

  /**
   * Delete a specific history item by its index.
   * @param idx - The index of the history item to delete.
   */
  deleteHistory: async (idx: number) => {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/history/${idx}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Delete a simulation by its ID.
   * @param simId - The ID of the simulation to delete.
   */
  deleteSimulation: async (simId: number) => {
    const token = localStorage.getItem("token");
    await axios.delete(`${API_URL}/simulation/${simId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },

  /**
   * Save a simulation with a name and data.
   * @param sim - The simulation object containing name and data.
   */
  saveSimulation: async (sim: { name: string; data: any }) => {
    const token = localStorage.getItem("token");
    await axios.post(`${API_URL}/save-simulation`, sim, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
};