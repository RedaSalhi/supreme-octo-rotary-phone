# 📊 Financial Risk Analyzer

> **Professional-grade portfolio optimization and risk analysis mobile app built with React Native & Expo**

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

---

## 🎯 Overview

**Financial Risk Analyzer** is a comprehensive mobile application that combines Modern Portfolio Theory with advanced risk metrics like Value-at-Risk (VaR). Designed for finance professionals, students, and portfolio managers, it enables real-time financial decision-making with a user-friendly interface.

---

## ✨ Key Features

- 📈 **Portfolio Optimization**  
  (Markowitz, Maximum Sharpe Ratio, Target Return strategies)

- ⚠️ **Value-at-Risk Analysis**  
  (Parametric, Historical, and Monte Carlo simulations)

- 📊 **CAPM Regression**  
  Calculate Alpha, Beta, Expected Return, and Systematic Risk

- 🔄 **Real-time Market Data Integration**  
  Supports AlphaVantage, IEX Cloud APIs

- 📱 **Cross-Platform Support**  
  Runs on both iOS and Android

- 🌍 **Multi-language UI**  
  Supports English and French

---

## 🛠 Tech Stack

| Layer       | Tools/Frameworks                         |
|-------------|-------------------------------------------|
| **Frontend**| React Native 0.79.3, Expo                 |
| **Language**| TypeScript                                |
| **Routing** | Expo Router                               |
| **Charts**  | React Native SVG, Custom SVG Charts       |
| **State**   | React Hooks, Context API                  |

---

## 🚀 Quick Start

### ✅ Prerequisites

- Node.js ≥ 18.0.0  
- npm ≥ 8.0.0  
- Expo CLI  

### 📦 Installation

```bash
# Clone the repository
git clone https://github.com/redasalhi/financial-risk-analyzer.git
cd financial-risk-analyzer

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Start the development server
npx expo start
