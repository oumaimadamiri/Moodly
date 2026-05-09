
const theme = {
  // Palette principale - Violet à Baby Pink
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Ajoutez dans theme.js :
text: {
  primary: '#000000',
  secondary: '#374151', 
  disabled: '#6b7280',
  inverse: '#ffffff',
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px  
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
  }
},
  // Baby Pink
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  
  // Couleurs de base
  white: '#ffffff',
  black: '#000000', // Changé en noir pur
  
  // Backgrounds
  background: {
    light: '#fafafa',
    default: '#ffffff',
    dark: '#0f172a',
  },
  
  // Text - TOUTES LES COULEURS MODIFIÉES POUR MEILLEUR CONTRASTE
  text: {
    primary: '#000000', // Noir pour texte principal
    secondary: '#374151', // Gris foncé
    disabled: '#6b7280', // Gris moyen
    inverse: '#ffffff', // Blanc sur fond coloré
  },
  
  // États
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  
  // Ombres
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  
  // Bordures
  border: {
    light: '#e5e7eb',
    default: '#d1d5db',
    dark: '#374151',
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
    secondary: 'linear-gradient(135deg, #c084fc 0%, #f472b6 100%)',
    light: 'linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)',
    dark: 'linear-gradient(135deg, #581c87 0%, #831843 100%)',
  },
  
  // Animations
  transitions: {
    default: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fast: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export default theme;
