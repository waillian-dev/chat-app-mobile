// App.tsx
import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RegisterScreen from './src/screens/RegisterScreen';
import OtpScreen from './src/screens/OtpScreen';
import HomeScreen from './src/screens/HomeScreen';
import ChatScreen from './src/screens/ChatScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import SearchScreen from './src/screens/SearchScreen';
import { ToastProvider } from './src/components/ToastContext';


// ✨ Fonts Libraries နှင့် ဖောင့်ဖိုင်များအား စနစ်တကျ Import လုပ်ခြင်း
import { 
  useFonts, 
  Poppins_300Light,
  Poppins_400Regular, 
  Poppins_600SemiBold, 
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';
import { 
  NotoSansMyanmar_300Light,
  NotoSansMyanmar_400Regular, 
  NotoSansMyanmar_600SemiBold, 
  NotoSansMyanmar_700Bold 
} from '@expo-google-fonts/noto-sans-myanmar';

// 🧭 ရေးသားပြီးစီးသွားသော Screens များကို Import လုပ်ခြင်း
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';


// 📋 Type Param List ကို Import လုပ်ခြင်း
import { RootStackParamList } from './src/types';

// 🛠️ ကျန်ရှိနေသေးသော Screens များအတွက် Error မတက်စေရန် ယာယီ Placeholder Screens များဆောက်ခြင်း
const RegisterPlaceholder = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Register Screen (Coming Soon)</Text></View>;
const OtpPlaceholder = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>OTP Verification Screen (Coming Soon)</Text></View>;
const HomePlaceholder = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Home Screen (Coming Soon)</Text></View>;
const SearchPlaceholder = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Search Screen (Coming Soon)</Text></View>;
const ChatPlaceholder = () => <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Chat Screen (Coming Soon)</Text></View>;

// Strongly-Typed Stack Navigator တည်ဆောက်ခြင်း
const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  // ✨ English + Myanmar ဖောင့်များအားလုံးကို Expo Engine ထဲသို့ Load လုပ်ခြင်း
  const [fontsLoaded] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    NotoSansMyanmar_300Light,
    NotoSansMyanmar_400Regular,
    NotoSansMyanmar_600SemiBold,
    NotoSansMyanmar_700Bold,
  });

  // ဖောင့်ဒေတာ Load လုပ်မပြီးမချင်း ယာယီ Loading အဝိုင်းလေး ပြထားမည်
  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }
  

  return (
    <ToastProvider>
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Splash"
        screenOptions={{
          headerTitleStyle: {
            fontFamily: 'Poppins_600SemiBold',
            fontSize: 16,
          },
          headerTintColor: '#0f172a',
          // headerBackTitleVisible: false,
          headerBackTitleStyle: {
            fontFamily: 'Poppins_400Regular',
            fontSize: 14,
          },
        }}
      >
        {/* 🚀 လက်ရှိ ရေးသားပြီးစီးသွားသော Screens လမ်းကြောင်းများ */}
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />

        {/* ⏳ နောက်ပိုင်းအဆင့်များတွင် အစားထိုးမည့် Placeholder Screens လမ်းကြောင်းများ */}
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign Up' }} />
        <Stack.Screen name="Otp" component={OtpScreen} options={{ title: 'OTP Verification' }} />
        
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Chats', headerShown: false }} />
        <Stack.Screen 
          name="Search" 
          component={SearchScreen} 
          options={{ headerShown: false }} // Custom Header Bar သုံးထား၍ မူလ Header အား ပိတ်ခြင်း
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={({ route }) => ({ title: route.params?.receiverName || 'Chat', headerShown: false })} 
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen} 
          options={{ title: 'Change Password' }} 
        />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
    </ToastProvider>
  );
}

