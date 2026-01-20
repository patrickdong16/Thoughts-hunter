import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'react-native';

import TodayScreen from './screens/TodayScreen';
import TTIScreen from './screens/TTIScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';

import { Colors } from './constants/theme';

const Tab = createBottomTabNavigator();

// 自定义Tab图标
const TabIcon = ({ icon, color }) => {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: Colors.primary,
            background: Colors.background,
            card: Colors.card,
            text: Colors.text,
            border: Colors.border,
            notification: Colors.primary,
          },
        }}
      >
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: Colors.primary,
            tabBarInactiveTintColor: Colors.textMuted,
            tabBarStyle: {
              backgroundColor: Colors.card,
              borderTopColor: Colors.border,
              borderTopWidth: 1,
              height: 60,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '500',
            },
          }}
        >
          <Tab.Screen
            name="Today"
            component={TodayScreen}
            options={{
              title: '今日',
              tabBarIcon: ({ color }) => <TabIcon icon="📡" color={color} />,
            }}
          />
          <Tab.Screen
            name="TTI"
            component={TTIScreen}
            options={{
              title: '张力',
              tabBarIcon: ({ color }) => <TabIcon icon="📊" color={color} />,
            }}
          />
          <Tab.Screen
            name="History"
            component={HistoryScreen}
            options={{
              title: '历史',
              tabBarIcon: ({ color }) => <TabIcon icon="📅" color={color} />,
            }}
          />
          <Tab.Screen
            name="Profile"
            component={ProfileScreen}
            options={{
              title: '我的',
              tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
