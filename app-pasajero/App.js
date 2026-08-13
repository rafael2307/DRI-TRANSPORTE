import React, { useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { useFonts, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider } from './src/context/AuthContext';

// Screens (To be implemented)
import LoginScreen from './src/screens/LoginScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import MapScreen from './src/screens/MapScreen';
import RatingScreen from './src/screens/RatingScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createStackNavigator();

SplashScreen.preventAutoHideAsync();

export default function App() {
    const [fontsLoaded] = useFonts({
        Outfit_700Bold,
        Inter_400Regular,
        Inter_700Bold,
    });

    const onLayoutRootView = useCallback(async () => {
        if (fontsLoaded) {
            await SplashScreen.hideAsync();
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <AuthProvider>
            <NavigationContainer onReady={onLayoutRootView}>
                <StatusBar style="light" />
                <Stack.Navigator
                    initialRouteName="RoleSelection"
                    screenOptions={{
                        headerShown: false,
                        cardStyle: { backgroundColor: '#0F172A' },
                    }}
                >
                    <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Map" component={MapScreen} />
                    <Stack.Screen name="Rating" component={RatingScreen} />
                    <Stack.Screen name="History" component={HistoryScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </AuthProvider>
    );
}
