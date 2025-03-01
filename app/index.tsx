import MyTabs from '@/components/navigation/TabNavigator';
import { NavigationContainer } from '@react-navigation/native';
import { StyleSheet } from 'react-native';

export default function Index() {
  return (

      <MyTabs />
  );
}

const styles = StyleSheet.create({
  container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff',
  },
  text: {
      fontSize: 20,
      color: '#000',
  },
});
