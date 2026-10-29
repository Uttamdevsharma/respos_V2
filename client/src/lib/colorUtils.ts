/**
 * colorUtils.ts
 * Converts a single hex brand color into a full CSS variable palette
 * that overrides the Tailwind v4 @theme variables at runtime.
 */

// ── Conversion helpers ───────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map((c) => c + c).join('')
    : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return [isNaN(r) ? 0 : r, isNaN(g) ? 0 : g, isNaN(b) ? 0 : b];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  switch (max) {
    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
    case g: h = (b - r) / d + 2; break;
    case b: h = (r - g) / d + 4; break;
  }
  return [h * 60, s * 100, l * 100];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// ── Palette generator ────────────────────────────────────────────────────────

export function generatePalette(brandHex: string): Record<string, string> {
  const [r, g, b] = hexToRgb(brandHex);
  const [h, s, l] = rgbToHsl(r, g, b);

  // Clamp saturation so it's never too grey
  const sat = Math.max(s, 30);

  // Primary: use the brand color but ensure lightness is visible (35–60%)
  const primaryL   = Math.min(Math.max(l, 40), 60);
  const primary    = hslToHex(h, sat, primaryL);

  // Primary dark: much darker (headings, sidebar brand text)
  const primaryDark = hslToHex(h, sat, Math.max(primaryL - 25, 15));

  // Primary light: lighter accent
  const primaryLight = hslToHex(h, Math.max(sat - 10, 20), Math.min(primaryL + 25, 80));

  // Primary container: very light tinted background
  const primaryContainer = hslToHex(h, Math.max(sat - 30, 15), 92);

  // On-primary container: dark readable text on container
  const onPrimaryContainer = hslToHex(h, sat, 15);

  // Background: very subtle tint (almost white)
  const background = hslToHex(h, Math.max(sat - 50, 5), 98);

  // Surface container variants (used for inputs, cards)
  const surfaceDim             = hslToHex(h, Math.max(sat - 45, 8), 88);
  const surfaceContainerLow    = hslToHex(h, Math.max(sat - 50, 5), 95);
  const surfaceContainer       = hslToHex(h, Math.max(sat - 48, 5), 93);
  const surfaceContainerHigh   = hslToHex(h, Math.max(sat - 46, 5), 91);
  const surfaceContainerHighest= hslToHex(h, Math.max(sat - 44, 5), 89);

  // Outline variants
  const outline        = hslToHex(h, Math.max(sat - 40, 10), 55);
  const outlineVariant = hslToHex(h, Math.max(sat - 45, 8), 82);

  return {
    '--color-primary':                    primary,
    '--color-primary-dark':               primaryDark,
    '--color-primary-light':              primaryLight,
    '--color-primary-container':          primaryContainer,
    '--color-on-primary':                 '#ffffff',
    '--color-on-primary-container':       onPrimaryContainer,
    '--color-background':                 background,
    '--color-surface-dim':                surfaceDim,
    '--color-surface-container-low':      surfaceContainerLow,
    '--color-surface-container':          surfaceContainer,
    '--color-surface-container-high':     surfaceContainerHigh,
    '--color-surface-container-highest':  surfaceContainerHighest,
    '--color-outline':                    outline,
    '--color-outline-variant':            outlineVariant,
    '--color-on-surface':                 hslToHex(h, Math.max(sat - 50, 5), 12),
    '--color-on-surface-variant':         hslToHex(h, Math.max(sat - 40, 10), 32),
  };
}

// ── Apply to document ────────────────────────────────────────────────────────

export function applyBrandColor(hex: string) {
  if (typeof document === 'undefined') return;
  if (!hex || !hex.startsWith('#')) return;
  const palette = generatePalette(hex);
  const root = document.documentElement;
  Object.entries(palette).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

export function resetBrandColor() {
  if (typeof document === 'undefined') return;
  const keys = [
    '--color-primary', '--color-primary-dark', '--color-primary-light',
    '--color-primary-container', '--color-on-primary', '--color-on-primary-container',
    '--color-background', '--color-surface-dim',
    '--color-surface-container-low', '--color-surface-container',
    '--color-surface-container-high', '--color-surface-container-highest',
    '--color-outline', '--color-outline-variant',
    '--color-on-surface', '--color-on-surface-variant',
  ];
  const root = document.documentElement;
  keys.forEach((k) => root.style.removeProperty(k));
}
