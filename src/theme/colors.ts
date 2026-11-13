/**
 * Lüneburg label colours from the KP 80-year artwork, on the wood ground.
 * Primary dark green #1E2417, gold #CEA845, deep gold #A98938.
 *
 * Deep gold is for marks on the green field (contrast about 4.8:1).
 * Small text on parchment uses forest or ink — deep gold on parchment is under 3:1.
 * Wood, parchment, and ink stay so the heritage ground and body text remain readable.
 */
export const colors = {
  forest: '#1E2417',
  forestMid: '#1E2417',
  forestDeep: '#1E2417',
  gold: '#CEA845',
  goldSoft: '#CEA845',
  /** Deep gold from the label. */
  goldMuted: '#A98938',
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
  overlay: 'rgba(30, 36, 23, 0.72)',
} as const;

export type ColorName = keyof typeof colors;
