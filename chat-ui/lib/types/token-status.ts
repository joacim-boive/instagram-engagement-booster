export type TokenStatus = {
  canUseTokens: boolean;
  currentUsage: number;
  limit: number;
  remainingTokens: number;
  isNearLimit: boolean;
  usagePercentage: number;
};
