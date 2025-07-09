import React, { createContext, useContext, useState, useEffect } from "react";
import { userApi } from "../services/userApi";

// User interface describing the user object structure
export interface User {
  username: string;
  email: string;
  preferences?: any; // User preferences (optional)
  history?: any[];   // User history (optional)
}

// Context type definition for user state and actions
const UserContext = createContext<{
  user: User | null; // Current user object or null if not authenticated
  setUser: (u: User | null) => void; // Setter for user state
  logout: () => void;                // Function to log out the user
  refreshUser: () => Promise<void>;  // Function to refresh user data from API
}>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

/**
 * UserProvider component.
 * Provides user authentication state and actions to all children via context.
 * Handles user login persistence, logout, and user data refresh.
 */
export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  /**
   * Fetch the current user from the API and update state.
   * If the API call fails (e.g., invalid token), set user to null.
   */
  const refreshUser = async () => {
    try {
      const me = await userApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  // On mount, if a token exists in localStorage, try to fetch user info
  useEffect(() => {
    if (localStorage.getItem("token")) refreshUser();
  }, []);

  /**
   * Log out the user.
   * Removes the token from localStorage and clears user state.
   */
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    // Provide user state and actions to context consumers
    <UserContext.Provider value={{ user, setUser, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

/**
 * Custom hook to access the user context.
 * Allows any component to get user info and actions.
 */
export const useUser = () => useContext(UserContext);