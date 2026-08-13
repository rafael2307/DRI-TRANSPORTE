import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { socketService } from '../services/socket.service';
import { registerForPushNotificationsAsync } from '../hooks/useNotifications';

const API_URL = 'http://localhost:3000';
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load persisted session on startup
    useEffect(() => {
        const loadSession = async () => {
            try {
                const savedToken = await AsyncStorage.getItem('access_token');
                const savedRefreshToken = await AsyncStorage.getItem('refresh_token');
                const savedUser = await AsyncStorage.getItem('user');
                if (savedToken && savedUser) {
                    setToken(savedToken);
                    setRefreshToken(savedRefreshToken);
                    setUser(JSON.parse(savedUser));
                    socketService.connect(JSON.parse(savedUser).id);
                }
            } catch (e) {
                console.error('Failed to load session', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadSession();
    }, []);

    const saveSession = async (data) => {
        await AsyncStorage.setItem('access_token', data.access_token);
        await AsyncStorage.setItem('refresh_token', data.refresh_token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.access_token);
        setRefreshToken(data.refresh_token);
        setUser(data.user);
    };

    const sendOtp = async (phone, role) => {
        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, role }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error sending OTP:', error);
            return { success: false, message: 'Error de conexión' };
        }
    };

    const login = async (phone, code, role) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, code, role }),
            });
            const data = await response.json();

            if (data.access_token) {
                await saveSession(data);
                socketService.connect(data.user.id);
                // Register FCM token after successful login
                const fcmToken = await registerForPushNotificationsAsync();
                if (fcmToken) {
                    registerFcmToken(fcmToken);
                }
                return { success: true };
            }
            return { success: false, message: data.message || 'Código inválido' };
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return { success: false, message: 'Error de conexión' };
        }
    };

    const refreshAccessToken = useCallback(async () => {
        try {
            const storedRefreshToken = await AsyncStorage.getItem('refresh_token');
            const storedUser = await AsyncStorage.getItem('user');
            if (!storedRefreshToken || !storedUser) return null;

            const userId = JSON.parse(storedUser).id;
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await AsyncStorage.getItem('access_token')}`,
                },
                body: JSON.stringify({ refresh_token: storedRefreshToken }),
            });

            if (!response.ok) {
                logout();
                return null;
            }

            const data = await response.json();
            await AsyncStorage.setItem('access_token', data.access_token);
            await AsyncStorage.setItem('refresh_token', data.refresh_token);
            setToken(data.access_token);
            setRefreshToken(data.refresh_token);
            return data.access_token;
        } catch (error) {
            console.error('Error refreshing token:', error);
            return null;
        }
    }, []);

    const registerFcmToken = async (fcmToken) => {
        try {
            const currentToken = await AsyncStorage.getItem('access_token');
            if (!currentToken || !fcmToken) return;
            await fetch(`${API_URL}/auth/fcm-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${currentToken}`,
                },
                body: JSON.stringify({ token: fcmToken }),
            });
        } catch (error) {
            console.error('Error registering FCM token:', error);
        }
    };

    const logout = async () => {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        socketService.disconnect();
    };

    return (
        <AuthContext.Provider value={{
            user, token, isAuthenticated: !!user, isLoading,
            login, logout, sendOtp, refreshAccessToken, registerFcmToken
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
