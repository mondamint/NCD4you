import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token"));
    const [loading, setLoading] = useState(true);

    // Configure axios default header and interceptor
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            localStorage.setItem("token", token);

            // Decode user from token or stored user data
            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (e) {
                    console.error("Failed to parse stored user data", e);
                    localStorage.removeItem("user");
                    setUser(null);
                }
            }
        } else {
            delete axios.defaults.headers.common["Authorization"];
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
        }
        setLoading(false);

        // Add Interceptor
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    // Auto logout on 401
                    logout();
                    // Optionally redirect or show message, but logout will clear state and likely redirect via ProtectedRoute
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [token]);

    const login = async (username, password) => {
        try {
            const formData = new FormData(); // Backend expects form data for OAuth2 usually, but our helper uses JSON? 
            // Wait, my backend implementation: class LoginRequest(BaseModel): username, password. 
            // It expects JSON body not Form Data for the /login endpoint I wrote.

            // Use runtime config if available, fallback to env (which might be localhost)
            const apiUrl = window.globalConfig?.API_URL || import.meta.env.VITE_API_URL;
            const res = await axios.post(`${apiUrl}/login`, {
                username,
                password
            });

            const { access_token, user } = res.data;
            localStorage.setItem("user", JSON.stringify(user));
            setToken(access_token);
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return {
                success: false,
                message: error.response?.data?.detail || "Login failed"
            };
        }
    };

    const logout = () => {
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
