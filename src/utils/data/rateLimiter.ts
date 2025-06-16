// ===========================================
// src/utils/data/rateLimiter.ts
// ===========================================

class RateLimiter {
  private limits = new Map<string, RateLimit>();

  constructor() {
    // Default rate limits for different APIs
    this.setLimit('alphavantage', 5, 500); // 5/min, 500/day
    this.setLimit('finnhub', 60, 1000); // 60/min, 1000/day
    this.setLimit('polygon', 100, 5000); // 100/min, 5000/day
    this.setLimit('twelvedata', 8, 800); // 8/min, 800/day
  }

  setLimit(apiKey: string, perMinute: number, perDay: number): void {
    this.limits.set(apiKey, {
      requestsPerMinute: perMinute,
      requestsPerDay: perDay,
      currentMinute: 0,
      currentDay: 0,
      resetTime: Date.now() + 60000 // Reset in 1 minute
    });
  }

  canMakeRequest(apiKey: string): boolean {
    const limit = this.limits.get(apiKey);
    if (!limit) return true;

    const now = Date.now();
    
    // Reset counters if time has passed
    if (now > limit.resetTime) {
      limit.currentMinute = 0;
      limit.resetTime = now + 60000;
      
      // Reset daily counter at midnight
      const today = new Date().toDateString();
      const resetDay = new Date(limit.resetTime).toDateString();
      if (today !== resetDay) {
        limit.currentDay = 0;
      }
    }

    return limit.currentMinute < limit.requestsPerMinute && 
           limit.currentDay < limit.requestsPerDay;
  }

  recordRequest(apiKey: string): void {
    const limit = this.limits.get(apiKey);
    if (limit) {
      limit.currentMinute++;
      limit.currentDay++;
    }
  }

  getTimeUntilReset(apiKey: string): number {
    const limit = this.limits.get(apiKey);
    return limit ? Math.max(0, limit.resetTime - Date.now()) : 0;
  }
}

export const rateLimiter = new RateLimiter();