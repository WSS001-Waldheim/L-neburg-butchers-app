import { TextStyle } from 'react-native';

/** Display: Cormorant Garamond · Body: Source Sans 3 */
export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  displayItalic: 'CormorantGaramond_600SemiBold_Italic',
  body: 'SourceSans3_400Regular',
  bodyMedium: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
} as const;

export const type: Record<string, TextStyle> = {
  brand: {
    fontFamily: fonts.displayBold,
    fontSize: 42,
    letterSpacing: 0.5,
    lineHeight: 46,
  },
  hero: {
    fontFamily: fonts.display,
    fontSize: 28,
    letterSpacing: 0.3,
    lineHeight: 34,
  },
  section: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    lineHeight: 30,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    lineHeight: 28,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
  },
  slogan: {
    fontFamily: fonts.displayItalic,
    fontSize: 16,
    letterSpacing: 1.2,
    lineHeight: 22,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
};
