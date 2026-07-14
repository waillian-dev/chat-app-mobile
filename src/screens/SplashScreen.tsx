// src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ActivityIndicator, 
  Image, 
  Dimensions, 
  Platform 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export default function SplashScreen({ navigation }: Props) {
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // ဖုန်း Local Memory ထဲမှ အချက်အလက်များအား စစ်ဆေးခြင်း
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');

        // စာရင်းစစ်ဆေးပြီးပါက သက်ဆိုင်ရာ လမ်းကြောင်းသို့ အစားထိုးပြောင်းလဲခြင်း
        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          navigation.replace('Home', { user: parsedUser, token: storedToken });
        } else {
          navigation.replace('Onboarding');
        }
      } catch (err) {
        console.log('Splash authentication check error:', err);
        navigation.replace('Login');
      }
    };

    // ဆာဗာ သို့မဟုတ် Storage စစ်ဆေးချိန်ကို ပိုမိုသက်တောင့်သက်သာဖြစ်အောင် ၂ စက္ကန့် စောင့်ခိုင်းခြင်း
    const timer = setTimeout(() => {
      checkAuthStatus();
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      {/* 🌌 Top-Right & Bottom-Left Soft Decorative Blobs (Premium Design အတွက် Subtle Effects) */}
      <View style={styles.topBlob} />
      <View style={styles.bottomBlob} />

      {/* 🏢 App Main Brand Content */}
      <View style={styles.contentWrapper}>
        <View style={styles.logoBadgeContainer}>
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.logoImage}
            defaultSource={require('../../assets/icon.png')} // iOS Fast Loading Placeholder
          />
        </View>
        
        <Text style={styles.appName}>Convo</Text>
        <Text style={styles.appSubtitle}>Stay Connected, Simply.</Text>
      </View>

      {/* ⏳ Clean Premium Loader at Bottom */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>Securing connection...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff',
    justifyContent: 'center', 
    alignItems: 'center',
    position: 'relative'
  },
  
  // Premium Layout Soft Background Blobs
  topBlob: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#f0f7ff',
    opacity: 0.7,
  },
  bottomBlob: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#f0fdf4', // Soft tint green
    opacity: 0.6,
  },

  // Content Wrapper
  contentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -40
  },
  logoBadgeContainer: { 
    width: 105, 
    height: 105, 
    borderRadius: 32, 
    backgroundColor: '#ffffff', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    // Premium soft elevation shadow drops
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 6
      }
    })
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  appName: { 
    fontFamily: fonts.bold.fontFamily, 
    fontSize: 34, 
    fontWeight: '700', 
    color: '#0f172a',
    letterSpacing: -0.8,
    marginBottom: 6
  },
  appSubtitle: {
    fontFamily: fonts.regular.fontFamily,
    fontSize: 14,
    color: '#64748b',
    letterSpacing: 0.2
  },

  // Bottom Loader Area
  loaderContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center'
  },
  loadingText: {
    fontFamily: fonts.light.fontFamily,
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 10,
    letterSpacing: 0.4
  }
});