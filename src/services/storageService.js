export const formatGoogleReviewUrl = (rawUrl) => {
  let url = typeof rawUrl === 'string' ? rawUrl.trim() : '';

  // Purge any outdated or broken URLs stored in browser localStorage
  if (!url || url.includes('writereview?placeid=0x') || url.includes('#lrd=')) {
    url = '';
  }

  // If user configured a valid custom HTTP link (e.g. g.page/r/.../review), use it
  if (url && url.startsWith('http')) {
    return url;
  }

  const featureId = '0x3bd4bfdf9ca3b3db:0x209dac7c9e6a418b';
  const cid = '2350228308708319627'; // Decimal CID for Aymorix Technologies

  // Detect mobile device (phone / tablet) vs laptop/desktop
  const isMobile = typeof navigator !== 'undefined' && 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent || '');

  if (isMobile) {
    // Phone link: Direct Google Maps CID link (Never 404 on mobile)
    return `https://maps.google.com/?cid=${cid}`;
  } else {
    // Laptop link: Google Search with #lrd=...,3 opens Desktop Write-Review popup box
    return `https://www.google.com/search?q=aymorix+technologies#lrd=${featureId},3`;
  }
};

// Default configuration values reading from environment variables
const DEFAULT_CONFIG = {
  companyName: 'Aymorix Technologies',
  companySubtitle: 'Software & Technology Solutions',
  googleReviewUrl: 'https://maps.google.com/?cid=2350228308708319627',
  
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
  const correctUrl = 'https://maps.google.com/?cid=2350228308708319627';
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    
    if (!data) {
      return { ...DEFAULT_CONFIG, googleReviewUrl: correctUrl };
    }

    const parsed = JSON.parse(data);
    
    // Always force clean review URL with mode ,2
    parsed.googleReviewUrl = formatGoogleReviewUrl(parsed.googleReviewUrl || correctUrl);
    
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
      googleReviewUrl: correctUrl
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
