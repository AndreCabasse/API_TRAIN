import React, { createContext, useContext, useState, useEffect } from "react";
import { userApi } from "../services/userApi";

export interface User {
  username: string;
  email: string;
  preferences?: any;
  history?: any[];
}

const UserContext = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}>({
  user: null,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    try {
      const me = await userApi.getMe();
      setUser(me);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) refreshUser();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, setUser, logout, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);