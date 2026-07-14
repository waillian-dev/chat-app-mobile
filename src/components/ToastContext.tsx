// src/components/ToastContext.tsx
import React, { createContext, useContext, useState, useRef } from 'react';
import { StyleSheet, Text, View, Animated, Platform, Dimensions } from 'react-native';
import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react-native';
import { fonts } from '../theme/fonts';

const { width } = Dimensions.get('window');

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('success');
  const [visible, setVisible] = useState(false);
  
  const animatedY = useRef(new Animated.Value(-100)).current; // ထိပ်ဆုံးအပေါ်မှာ ကြိုဖျောက်ထားမည်

  const showToast = (msg: string, toastType: ToastType = 'success') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);

    // Dynamic Slide Down Animation
    Animated.spring(animatedY, {
      toValue: Platform.OS === 'ios' ? 50 : 30, // Status bar အောက်သို့ ဆင်းမည့် အကွာအဝေး
      useNativeDriver: true,
      damping: 12,
      stiffness: 100,
    }).start();

    // ၃ စက္ကန့်ပြည့်လျှင် အလိုအလျောက် ပြန်သိမ်းမည်
    setTimeout(() => {
      Animated.timing(animatedY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {visible && (
        <Animated.View 
          style={[
            styles.toastCard,
            styles[type],
            { transform: [{ translateY: animatedY }] }
          ]}
        >
          <View style={styles.iconArea}>
            {type === 'success' && <CheckCircle2 color="#137333" size={18} strokeWidth={2.5} />}
            {type === 'error' && <XCircle color="#c5221f" size={18} strokeWidth={2.5} />}
            {type === 'info' && <AlertTriangle color="#0066FF" size={18} strokeWidth={2.5} />}
          </View>
          <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

const styles = StyleSheet.create({
  toastCard: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 5 }
    })
  },
  iconArea: { marginRight: 10 },
  toastText: { flex: 1, fontSize: 14, color: '#0f172a', fontFamily: fonts.semiBold.fontFamily, fontWeight: '600', lineHeight: 18 },
  
  // Dynamic Types Background/Borders
  success: { backgroundColor: '#e6f4ea', borderColor: '#34a853' },
  error: { backgroundColor: '#fce8e6', borderColor: '#ea4335' },
  info: { backgroundColor: '#e8f0fe', borderColor: '#0066FF' }
});