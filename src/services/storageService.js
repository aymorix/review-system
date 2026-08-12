const isMobileDevice = () => {
  return typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
};

const pickReviewUrlForDevice = ({ desktopUrl = '', mobileUrl = '', fallbackUrl = '' } = {}) => {
  const desktop = typeof desktopUrl === 'string' ? desktopUrl.trim() : '';
  const mobile = typeof mobileUrl === 'string' ? mobileUrl.trim() : '';
  const fallback = typeof fallbackUrl === 'string' ? fallbackUrl.trim() : '';

  if (isMobileDevice()) {
    return mobile || fallback || desktop;
  }

  return desktop || fallback || mobile;
};

export const resolveGoogleReviewUrl = (desktopUrl, mobileUrl, fallbackUrl = '') => {
  return pickReviewUrlForDevice({ desktopUrl, mobileUrl, fallbackUrl });
};

// Default configuration values reading from environment variables
const DEFAULT_CONFIG = {
  companyName: 'Aymorix Technologies',
  companySubtitle: 'Software & Technology Solutions',
  googleReviewUrl: import.meta.env.VITE_GOOGLE_REVIEW_URL || '',
  googleReviewUrlMobile: import.meta.env.VITE_GOOGLE_REVIEW_URL_MOBILE || '',
  googleSheetName: import.meta.env.VITE_GOOGLE_SHEET_NAME || '',
  
  // Google OAuth 2.0 Credentials for Sheets API
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  googleClientSecret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '',
  googleRefreshToken: import.meta.env.VITE_GOOGLE_REFRESH_TOKEN || '',
  googleSpreadsheetId: import.meta.env.VITE_GOOGLE_SPREADSHEET_ID || '',

  aiProvider: 'grok', // 'grok' | 'gemini' | 'auto'
  grokApiKey: import.meta.env.VITE_GROK_API_KEY || '',
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  questions: [
    {
      id: 'q1',
      label: 'Software Quality & Performance',
      options: ['High Quality', 'Satisfactory', 'Needs Work']
    },
    {
      id: 'q2',
      label: 'Project Delivery & Speed',
      options: ['Fast / Ahead', 'On Time', 'Delayed']
    },
    {
      id: 'q3',
      label: 'Team Communication & Support',
      options: ['Excellent', 'Good', 'Average']
    },
    {
      id: 'q4',
      label: 'Technical Expertise & Features',
      options: ['Cutting-Edge', 'Sufficient', 'Basic']
    },
    {
      id: 'q5',
      label: 'Likely to Recommend Aymorix?',
      options: ['Highly Likely', 'Neutral', 'Unlikely']
    }
  ]
};

const CONFIG_KEY = 'aymorix_review_config';
const REVIEWS_CACHE_KEY = 'aymorix_saved_reviews';
const USED_REVIEWS_HISTORY_KEY = 'aymorix_used_reviews_history';

export const getStoredConfig = () => {
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    const envDesktopUrl = DEFAULT_CONFIG.googleReviewUrl || '';
    const envMobileUrl = DEFAULT_CONFIG.googleReviewUrlMobile || '';

    const resolvedUrl = resolveGoogleReviewUrl(envDesktopUrl, envMobileUrl, '');
    
    if (!data) {
      return { ...DEFAULT_CONFIG, googleReviewUrl: resolvedUrl };
    }

    const parsed = JSON.parse(data);
    
    // Always resolve by device first and keep the env URL intact.
    parsed.googleReviewUrl = resolveGoogleReviewUrl(
      envDesktopUrl,
      envMobileUrl,
      parsed.googleReviewUrl || ''
    );
    
    // Overwrite stored localStorage config if it had outdated URL
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(parsed));
    } catch (e) {}

    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
      googleReviewUrl: parsed.googleReviewUrl
    };

    // Ensure 3 options per question
    if (merged.questions) {
      merged.questions = merged.questions.map((q, idx) => ({
        ...q,
        options: DEFAULT_CONFIG.questions[idx]?.options || q.options.slice(0, 3)
      }));
    }
    return merged;
  } catch (e) {
    console.error('Failed to read config from localStorage', e);
    return {
      ...DEFAULT_CONFIG,
      googleReviewUrl: resolveGoogleReviewUrl(
        DEFAULT_CONFIG.googleReviewUrl,
        DEFAULT_CONFIG.googleReviewUrlMobile,
        ''
      )
    };
  }
};

export const saveStoredConfig = (config) => {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save config to localStorage', e);
  }
};

export const saveLocalReview = (reviewData) => {
  try {
    const existing = getLocalReviews();
    const updated = [reviewData, ...existing];
    localStorage.setItem(REVIEWS_CACHE_KEY, JSON.stringify(updated));
    if (reviewData.comment) {
      markReviewAsUsed(reviewData.comment);
    }
    return updated;
  } catch (e) {
    console.error('Failed to save local review cache', e);
    return [];
  }
};

export const getLocalReviews = () => {
  try {
    const data = localStorage.getItem(REVIEWS_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to fetch local reviews', e);
    return [];
  }
};

export const getUsedReviewsHistory = () => {
  try {
    const data = localStorage.getItem(USED_REVIEWS_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const markReviewAsUsed = (reviewText) => {
  if (!reviewText || !reviewText.trim()) return;
  try {
    const history = getUsedReviewsHistory();
    const cleaned = reviewText.trim().toLowerCase();
    if (!history.includes(cleaned)) {
      history.push(cleaned);
      localStorage.setItem(USED_REVIEWS_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to record used review text in history', e);
  }
};
