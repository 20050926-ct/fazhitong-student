export type ThemeMode = 'light' | 'dark' | 'system';

export type FontScaleMode = 'standard' | 'large' | 'xlarge';

export type AppearancePrefs = {
  theme: ThemeMode;
  fontScale: FontScaleMode;
  reduceMotion: boolean;
};

export type PrivacyPrefs = {
  profilePublic: boolean;
  showOnlineStatus: boolean;
  personalizedRecommend: boolean;
  shareUsageStats: boolean;
};

const APPEARANCE_KEY = 'app-appearance-v1';
const PRIVACY_KEY = 'app-privacy-v1';

const defaultAppearance: AppearancePrefs = {
  theme: 'light',
  fontScale: 'standard',
  reduceMotion: false
};

const defaultPrivacy: PrivacyPrefs = {
  profilePublic: true,
  showOnlineStatus: false,
  personalizedRecommend: true,
  shareUsageStats: false
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function resolveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
}

export function loadAppearancePrefs(): AppearancePrefs {
  if (!canUseStorage()) return { ...defaultAppearance };
  try {
    const raw = window.localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return { ...defaultAppearance };
    const parsed = JSON.parse(raw) as Partial<AppearancePrefs>;
    return {
      theme: parsed.theme === 'dark' || parsed.theme === 'light' || parsed.theme === 'system' ? parsed.theme : defaultAppearance.theme,
      fontScale:
        parsed.fontScale === 'large' || parsed.fontScale === 'xlarge' || parsed.fontScale === 'standard'
          ? parsed.fontScale
          : defaultAppearance.fontScale,
      reduceMotion: typeof parsed.reduceMotion === 'boolean' ? parsed.reduceMotion : defaultAppearance.reduceMotion
    };
  } catch {
    return { ...defaultAppearance };
  }
}

export function saveAppearancePrefs(prefs: AppearancePrefs) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(APPEARANCE_KEY, JSON.stringify(prefs));
}

export function applyAppearancePrefs(prefs: AppearancePrefs) {
  const resolved = resolveTheme(prefs.theme);
  document.documentElement.dataset.theme = resolved;
  document.documentElement.dataset.fontScale = prefs.fontScale;
  if (prefs.reduceMotion) {
    document.documentElement.classList.add('reduce-ui-motion');
  } else {
    document.documentElement.classList.remove('reduce-ui-motion');
  }
}

export function loadPrivacyPrefs(): PrivacyPrefs {
  if (!canUseStorage()) return { ...defaultPrivacy };
  try {
    const raw = window.localStorage.getItem(PRIVACY_KEY);
    if (!raw) return { ...defaultPrivacy };
    const parsed = JSON.parse(raw) as Partial<PrivacyPrefs>;
    return {
      profilePublic: typeof parsed.profilePublic === 'boolean' ? parsed.profilePublic : defaultPrivacy.profilePublic,
      showOnlineStatus: typeof parsed.showOnlineStatus === 'boolean' ? parsed.showOnlineStatus : defaultPrivacy.showOnlineStatus,
      personalizedRecommend:
        typeof parsed.personalizedRecommend === 'boolean' ? parsed.personalizedRecommend : defaultPrivacy.personalizedRecommend,
      shareUsageStats: typeof parsed.shareUsageStats === 'boolean' ? parsed.shareUsageStats : defaultPrivacy.shareUsageStats
    };
  } catch {
    return { ...defaultPrivacy };
  }
}

export function savePrivacyPrefs(prefs: PrivacyPrefs) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(PRIVACY_KEY, JSON.stringify(prefs));
}
