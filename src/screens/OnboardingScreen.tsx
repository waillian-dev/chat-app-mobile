// src/screens/OnboardingScreen.tsx
import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  Dimensions, 
  TouchableOpacity, 
  ViewToken,
  Platform
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { fonts } from '../theme/fonts';

const { width, height } = Dimensions.get('window');
const IMAGE_SIZE = width * 0.75;

interface OnboardingItem {
  id: string;
  title: string;
  description: string;
  image: any;
}

const ONBOARDING_DATA: OnboardingItem[] = [
  {
    id: '1',
    title: 'Real-time Messaging',
    description: 'Experience lightning-fast and seamless instant messaging powered by real-time sync networks.',
    image: require('../../assets/onboarding/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Safe & Secure OTP',
    description: 'Keep your account fully protected with our advanced 6-digit verification code sent straight to your Gmail.',
    image: require('../../assets/onboarding/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Cloud Storage Profile',
    description: 'Instantly upload and secure your profile images on the cloud with powerful Cloudflare R2 storage.',
    image: require('../../assets/onboarding/onboarding3.png'),
  },
];

type OnboardingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

export default function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<FlatList<OnboardingItem>>(null);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  return (
    <View style={styles.container}>
      {/* 1. TOP SLIDER SECTION (Flex ညှိပြီး ပုံနှင့်စာများကို အောက်သို့ နည်းနည်းချထားသည်) */}
      <View style={{ flex: 4, justifyContent: 'flex-end' }}>
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_DATA}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          bounces={false}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {/* ရိုးရှင်းသပ်ရပ်သွားစေရန် ပုံနောက်ခံ bg ဘောင်ကို ဖြုတ်ချလိုက်သည် */}
              <View style={styles.imageWrapper}>
                <Image source={item.image} style={styles.image} />
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideDesc}>{item.description}</Text>
            </View>
          )}
        />
      </View>

      {/* 2. MIDDLE PAGE INDICATOR */}
      <View style={styles.indicatorContainer}>
        {ONBOARDING_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* 3. BOTTOM BUTTONS SECTION */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.loginBtn} 
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.loginBtnText}>Get Started (Sign In)</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.registerBtn} 
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.7}
        >
          <Text style={styles.registerBtnText}>Create Free Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff'
  },
  slide: { 
    width: width, 
    justifyContent: 'flex-end', 
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 15 // စာသားများအောက်သို့ဆင်းရန် အောက်ခြေကို တွန်းထားသည်
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 35,
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain'
  },
  slideTitle: { 
    fontFamily: fonts.bold.fontFamily, 
    fontSize: 26, 
    fontWeight: '700', 
    color: '#0f172a', 
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.5
  },
  slideDesc: { 
    fontFamily: fonts.regular.fontFamily, 
    fontSize: 15, 
    color: '#64748b', 
    textAlign: 'center', 
    paddingHorizontal: 10,
    lineHeight: 24 
  },
  indicatorContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingVertical: 25 // နေရာလွတ် ပိုရစေရန် Spacing မြှင့်ထားသည်
  },
  dot: { 
    height: 8, 
    borderRadius: 4, 
    marginHorizontal: 4
  },
  activeDot: { 
    width: 24, 
    backgroundColor: '#007AFF' 
  },
  inactiveDot: { 
    width: 8, 
    backgroundColor: '#cbd5e1' 
  },
  buttonContainer: { 
    flex: 1.3, 
    justifyContent: 'center', 
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14
  },
  loginBtn: { 
    width: '100%', 
    height: 54, 
    backgroundColor: '#007AFF', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    })
  },
  loginBtnText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#ffffff', 
    fontSize: 16, 
    fontWeight: '600' 
  },
  registerBtn: { 
    width: '100%', 
    height: 54, 
    backgroundColor: 'transparent', 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1.5, 
    borderColor: '#e2e8f0' 
  },
  registerBtnText: { 
    fontFamily: fonts.semiBold.fontFamily, 
    color: '#334155', 
    fontSize: 16, 
    fontWeight: '600' 
  }
});