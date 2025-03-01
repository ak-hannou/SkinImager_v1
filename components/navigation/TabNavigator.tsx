import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { View, StyleSheet } from 'react-native';
import Profiles from '../screens/Profiles';
import ImageCapture from '../screens/ImageCapture';
import { Ionicons } from '@expo/vector-icons';
import Sessions from '../screens/Sessions';
import Connection from '../screens/Connection';
import Settings from '../screens/Settings';


const Tab = createMaterialTopTabNavigator();

export default function MyTabs() {
    return (
        <View style={styles.container}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarStyle: {
                backgroundColor: '#fff',
                marginTop: 40, // Adjust this value to move the tab bar further down
                height: 60, // Adjust this value to make the tab bar larger
                elevation: 0, // Remove shadow on Android
                shadowOpacity: 0, // Remove shadow on iOS
              },
              tabBarIndicatorStyle: {
                backgroundColor: '#2F4858', // Change the underline color to blue
              },
              tabBarItemStyle: {
                paddingVertical: 25, // Reduce vertical padding
              },
              tabBarShowLabel: false,
              tabBarIcon: ({ color }) => {
                let  iconName: keyof typeof Ionicons.glyphMap = 'person';
  
                if (route.name === 'Profiles') {
                  iconName = 'person';
                } else if (route.name === 'ImageCapture') {
                    iconName = 'camera';
                }
                else if (route.name === 'Sessions') {
                  iconName = 'list';
                } else if (route.name === 'Connection') {
                  iconName = 'laptop-outline';
                } else if (route.name === 'Settings') {
                  iconName = 'settings';
                }
  
                return <Ionicons name={iconName} size={24} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Profiles" component={Profiles} />
            <Tab.Screen name="ImageCapture" component={ImageCapture} />
            <Tab.Screen name="Sessions" component={Sessions} />
            <Tab.Screen name="Connection" component={Connection} />
            <Tab.Screen name="Settings" component={Settings} />
          </Tab.Navigator>
        </View>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: '#fff',
      flex: 1,
    },
  });