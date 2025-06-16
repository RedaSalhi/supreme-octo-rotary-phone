import { useState, useCallback } from 'react';
import { Asset, Portfolio, PortfolioWeight } from '../types/portfolio';

interface UsePortfolioReturn {
  portfolio: Portfolio;
  addAsset: (asset: Asset) => void;
  removeAsset: (assetId: string) => void;
  updateWeight: (assetId: string, weight: number) => void;
  calculatePortfolioMetrics: () => {
    expectedReturn: number;
    volatility: number;
    sharpeRatio: number;
  };
}

export const usePortfolio = (): UsePortfolioReturn => {
  const [portfolio, setPortfolio] = useState<Portfolio>({
    assets: [],
    weights: {},
    lastUpdated: new Date(),
  });

  const addAsset = useCallback((asset: Asset) => {
    setPortfolio((prev) => {
      const newAssets = [...prev.assets, asset];
      const newWeights = { ...prev.weights };
      // Initialize weight to 0
      newWeights[asset.id] = 0;
      return {
        ...prev,
        assets: newAssets,
        weights: newWeights,
        lastUpdated: new Date(),
      };
    });
  }, []);

  const removeAsset = useCallback((assetId: string) => {
    setPortfolio((prev) => {
      const newAssets = prev.assets.filter((asset) => asset.id !== assetId);
      const newWeights = { ...prev.weights };
      delete newWeights[assetId];
      return {
        ...prev,
        assets: newAssets,
        weights: newWeights,
        lastUpdated: new Date(),
      };
    });
  }, []);

  const updateWeight = useCallback((assetId: string, weight: number) => {
    setPortfolio((prev) => {
      const newWeights = { ...prev.weights, [assetId]: weight };
      return {
        ...prev,
        weights: newWeights,
        lastUpdated: new Date(),
      };
    });
  }, []);

  const calculatePortfolioMetrics = useCallback(() => {
    // Calculate portfolio metrics using Markowitz optimization principles
    const expectedReturn = portfolio.assets.reduce((acc, asset) => {
      return acc + (asset.expectedReturn * (portfolio.weights[asset.id] || 0));
    }, 0);

    const volatility = Math.sqrt(
      portfolio.assets.reduce((acc, asset1) => {
        return (
          acc +
          portfolio.assets.reduce((innerAcc, asset2) => {
            const weight1 = portfolio.weights[asset1.id] || 0;
            const weight2 = portfolio.weights[asset2.id] || 0;
            const correlation = asset1.correlation[asset2.id] || 0;
            return (
              innerAcc +
              weight1 * weight2 * asset1.volatility * asset2.volatility * correlation
            );
          }, 0)
        );
      }, 0)
    );

    const riskFreeRate = 0.02; // Assuming 2% risk-free rate
    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
    };
  }, [portfolio]);

  return {
    portfolio,
    addAsset,
    removeAsset,
    updateWeight,
    calculatePortfolioMetrics,
  };
}; 