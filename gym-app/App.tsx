import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { RootStackParamList } from './src/types';
import ExerciseSelectScreen from './src/screens/ExerciseSelectScreen';
import CameraScreen from './src/screens/CameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="ExerciseSelect"
          screenOptions={{
            headerShown: false,
            cardStyle: { backgroundColor: '#0f0f0f' },
          }}
        >
          <Stack.Screen name="ExerciseSelect" component={ExerciseSelectScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Analysis" component={AnalysisScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
