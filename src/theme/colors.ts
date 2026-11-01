/**
 * Lüneburg visual direction: green & gold, wood vibe.
 * Avoid purple gradients, cream+terracotta AI defaults, clinical modern.
 */
export const colors = {
  forest: '#1B3D2F',
  forestMid: '#2A5240',
  forestDeep: '#12281F',
  gold: '#C9A227',
  goldSoft: '#D4B84A',
  goldMuted: '#A68B2E',
  wood: '#6B4423',
  woodLight: '#8B5E3C',
  woodWash: '#C4A882',
  parchment: '#E6D5B8',
  parchmentDeep: '#D2BC96',
  ink: '#1A1814',
  inkSoft: '#3D3428',
  mist: '#F3EBD9',
  white: '#FFFBF3',
  danger: '#8B3A2F',
  success: '#2F5D3A',
  overlay: 'rgba(18, 40, 31, 0.72)',
} as const;

export type ColorName = keyof typeof colors;
