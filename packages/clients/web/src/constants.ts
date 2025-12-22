/** Constants for the web app */
export default {
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001",
  API_ENDPOINTS: {
    AUTH_LOGIN: "/auth/login",
    AUTH_REGISTER: "/auth/register",
    AUTH_LOGOUT: "/auth/logout",
    AUTH_REFRESH: "/auth/refresh",
    AUTH_VERIFY: "/auth/verify",
    AUTH_FORGOT_PASSWORD: "/auth/forgot-password",
    AUTH_RESET_PASSWORD: "/auth/reset-password",
  },
  PATHS: {
    CONTACT: "/contact",
    CHARTS: "/charts",
    FAQ: "/faq",
    HOME: "/",
    LICENSE: "/license",
    LOGIN: "/login",
    LOGOUT: "/logout",
    PRIVACY: "/privacy",
    PROFILE: "/profile",
    SUPPORT: "/supports",
    TERMS: "/terms",
  },
  CONTACT: {
    EMAIL: "contact@speira-chordscraft.com",
    PHONE: "+1 234 567 890",
  },
  SOCIAL: {
    FACEBOOK: "https://facebook.com",
    INSTAGRAM: "https://instagram.com",
    SNAPCHAT: "https://snapchat.com",
    X: "https://x.com",
  },
} as const;
