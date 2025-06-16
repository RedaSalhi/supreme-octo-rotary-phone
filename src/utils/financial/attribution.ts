/**
 * Calculate attribution over multiple time periods
 */
export function calculateTimeBasedAttribution(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  periods: number[] // Array of period end indices
): Array<{
  period: number;
  portfolioReturn: number;
  benchmarkReturn: number;
  activeReturn: number;
  contribution: number;
}> {
  const results: Array<{
    period: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    activeReturn: number;
    contribution: number;
  }> = [];
  let lastIndex = 0;
  
  for (const periodEnd of periods) {
    const portfolioPeriodReturns = portfolioReturns.slice(lastIndex, periodEnd);
    const benchmarkPeriodReturns = benchmarkReturns.slice(lastIndex, periodEnd);
    
    const portfolioReturn = portfolioPeriodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const benchmarkReturn = benchmarkPeriodReturns.reduce((acc, r) => acc * (1 + r), 1) - 1;
    const activeReturn = portfolioReturn - benchmarkReturn;
    
    // Contribution to total active return (geometric linking)
    const contribution = activeReturn; // Simplified - would need proper geometric attribution
    
    results.push({
      period: periodEnd,
      portfolioReturn,
      benchmarkReturn,
      activeReturn,
      contribution
    });
    
    lastIndex = periodEnd;
  }
  
  return results;
}

/**
 * Calculate tracking error attribution
 */
export function calculateTrackingErrorAttribution(
  portfolioReturns: number[],
  benchmarkReturns: number[],
  windowSize: number = 36
): Array<{
  period: number;
  trackingError: number;
  attribution: {
    allocationRisk: number;
    selectionRisk: number;
    interactionRisk: number;
  };
}> {
  const results: Array<{
    period: number;
    trackingError: number;
    attribution: {
      allocationRisk: number;
      selectionRisk: number;
      interactionRisk: number;
    };
  }> = [];
  
  for (let i = windowSize - 1; i < portfolioReturns.length; i++) {
    const portfolioWindow = portfolioReturns.slice(i - windowSize + 1, i + 1);
    const benchmarkWindow = benchmarkReturns.slice(i - windowSize + 1, i + 1);
    
    // Calculate active returns
    const activeReturns = portfolioWindow.map((r, idx) => r - benchmarkWindow[idx]);
    
    // Calculate tracking error (standard deviation of active returns)
    const mean = activeReturns.reduce((sum, r) => sum + r, 0) / activeReturns.length;
    const variance = activeReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (activeReturns.length - 1);
    const trackingError = Math.sqrt(variance * 252); // Annualized
    
    // Risk attribution (simplified)
    results.push({
      period: i,
      trackingError,
      attribution: {
        allocationRisk: trackingError * 0.4, // Simplified allocation
        selectionRisk: trackingError * 0.5,  // Simplified selection
        interactionRisk: trackingError * 0.1 // Simplified interaction
      }
    });
  }
  
  return results;
} 