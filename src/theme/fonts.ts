// src/theme/fonts.ts

export const fonts = {
  bold: {
    fontFamily: 'Poppins_700Bold',
    myanmarFont: 'NotoSansMyanmar_700Bold', 
  },
  
  semiBold: {
    fontFamily: 'Poppins_600SemiBold',
    myanmarFont: 'NotoSansMyanmar_600SemiBold',
  },
  
  regular: {
    fontFamily: 'Poppins_400Regular',
    myanmarFont: 'NotoSansMyanmar_400Regular',
  },
  
  light: {
    fontFamily: 'Poppins_300Light',
    myanmarFont: 'NotoSansMyanmar_300Light',
  }
};

export const fontStyles = {
  title: {
    fontFamily: fonts.bold.fontFamily,
    fontSize: 24,
    fontWeight: '700' as const,
  },
  username: {
    fontFamily: fonts.semiBold.fontFamily,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: fonts.regular.fontFamily,
    fontSize: 15,
  },
  caption: {
    fontFamily: fonts.light.fontFamily,
    fontSize: 11,
    color: '#64748b',
  }
};