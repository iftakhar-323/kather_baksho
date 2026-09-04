import API from "./axios";

// GET /api/loyalty/tier — { tier, points, discount_pct, total_spend, next_tier }
export const getMyLoyalty = () => API.get("/loyalty/tier");

// GET /api/loyalty/achievements  (catalogue) + /me (this user's progress)
export const getAchievements = () => API.get("/loyalty/achievements");
export const getMyAchievements = () => API.get("/loyalty/achievements/me");

// POST /api/loyalty/achievements/:id/claim
export const claimAchievement = (id) =>
  API.post(`/loyalty/achievements/${id}/claim`);

// GET /api/loyalty/rewards
export const getRewards = () => API.get("/loyalty/rewards");

// POST /api/loyalty/rewards/:id/redeem
export const redeemReward = (id) => API.post(`/loyalty/rewards/${id}/redeem`);

// GET /api/loyalty/referral  — this user's own code
export const getReferralCode = () => API.get("/loyalty/referral");

// GET /api/loyalty/referrals/me — people this user referred
export const getMyReferrals = () => API.get("/loyalty/referrals/me");

// POST /api/loyalty/referral/redeem  — apply someone else's code
export const applyReferral = (code) =>
  API.post("/loyalty/referral/redeem", { code });
