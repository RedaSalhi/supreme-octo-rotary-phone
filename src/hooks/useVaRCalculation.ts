import { useCallback } from 'react';
import { Asset, Portfolio } from '../types/portfolio';

interface VaRResult {
  var95: number;
  var99: number;
  expectedShortfall: number;
  confidenceLevel: number;
}

interface UseVaRCalculationReturn {
  calculateHistoricalVaR: (portfolio: Portfolio, historicalData: Record<string, number[]>) => VaRResult;
  calculateParametricVaR: (portfolio: Portfolio) => VaRResult;
  calculateMonteCarloVaR: (portfolio: Portfolio, simulations: number) => VaRResult;
}

export const useVaRCalculation = (): UseVaRCalculationReturn => {
  const calculateHistoricalVaR = useCallback((portfolio: Portfolio, historicalData: Record<string, number[]>): VaRResult => {
    // Calculate portfolio returns for each historical period
    const portfolioReturns = historicalData[Object.keys(historicalData)[0]].map((_, index) => {
      return portfolio.assets.reduce((acc, asset) => {
        const assetReturn = historicalData[asset.symbol][index];
        return acc + (assetReturn * (portfolio.weights[asset.id] || 0));
      }, 0);
    });

    // Sort returns and find VaR at 95% and 99% confidence levels
    const sortedReturns = [...portfolioReturns].sort((a, b) => a - b);
    const var95 = sortedReturns[Math.floor(sortedReturns.length * 0.05)];
    const var99 = sortedReturns[Math.floor(sortedReturns.length * 0.01)];

    // Calculate Expected Shortfall (average of returns beyond VaR)
    const expectedShortfall = sortedReturns
      .filter(return_ => return_ <= var95)
      .reduce((acc, return_) => acc + return_, 0) / 
      sortedReturns.filter(return_ => return_ <= var95).length;

    return {
      var95,
      var99,
      expectedShortfall,
      confidenceLevel: 0.95,
    };
  }, []);

  const calculateParametricVaR = useCallback((portfolio: Portfolio): VaRResult => {
    // Calculate portfolio variance using the variance-covariance method
    const portfolioVariance = portfolio.assets.reduce((acc, asset1) => {
      return acc + portfolio.assets.reduce((innerAcc, asset2) => {
        const weight1 = portfolio.weights[asset1.id] || 0;
        const weight2 = portfolio.weights[asset2.id] || 0;
        const correlation = asset1.correlation[asset2.id] || 0;
        return innerAcc + weight1 * weight2 * asset1.volatility * asset2.volatility * correlation;
      }, 0);
    }, 0);

    const portfolioVolatility = Math.sqrt(portfolioVariance);
    const zScore95 = 1.645; // 95% confidence level
    const zScore99 = 2.326; // 99% confidence level

    const var95 = -zScore95 * portfolioVolatility;
    const var99 = -zScore99 * portfolioVolatility;
    const expectedShortfall = -portfolioVolatility * (Math.exp(-zScore95 * zScore95 / 2) / (Math.sqrt(2 * Math.PI) * 0.05));

    return {
      var95,
      var99,
      expectedShortfall,
      confidenceLevel: 0.95,
    };
  }, []);

  const calculateMonteCarloVaR = useCallback((portfolio: Portfolio, simulations: number): VaRResult => {
    const returns: number[] = [];

    // Generate simulated returns
    for (let i = 0; i < simulations; i++) {
      const portfolioReturn = portfolio.assets.reduce((acc, asset) => {
        // Generate random return using normal distribution
        const randomReturn = asset.volatility * Math.sqrt(1/252) * (Math.random() * 2 - 1);
        return acc + (randomReturn * (portfolio.weights[asset.id] || 0));
      }, 0);
      returns.push(portfolioReturn);
    }

    // Sort returns and find VaR
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95 = sortedReturns[Math.floor(simulations * 0.05)];
    const var99 = sortedReturns[Math.floor(simulations * 0.01)];
    const expectedShortfall = sortedReturns
      .filter(return_ => return_ <= var95)
      .reduce((acc, return_) => acc + return_, 0) / 
      sortedReturns.filter(return_ => return_ <= var95).length;

    return {
      var95,
      var99,
      expectedShortfall,
      confidenceLevel: 0.95,
    };
  }, []);

  return {
    calculateHistoricalVaR,
    calculateParametricVaR,
    calculateMonteCarloVaR,
  };
}; 