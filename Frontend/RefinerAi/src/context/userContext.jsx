import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const backend_url = import.meta.env.VITE_BACKEND_LINK;

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetchUserData(token);
    }
  }, []);

  async function fetchUserData(token) {
    try {
      const response = await fetch(`${backend_url}/getUserData`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.error) {
        console.error("Error in user data:", data.error);
        localStorage.removeItem("accessToken");
      } else {
        setUser(data); // Store user in context
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
