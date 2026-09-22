import React, { useState } from 'react';
import { TelemetryProvider } from './context/TelemetryContext';
import DisclaimerBanner from './components/layout/DisclaimerBanner';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

// Pages
import HomePage from './pages/HomePage';
import CampusPage from './pages/CampusPage';
import PredictionPage from './pages/PredictionPage';
import QoSPage from './pages/QoSPage';
import TechnicalPage from './pages/TechnicalPage';

function AppContent() {
  const [activeTab, setActiveTab] = useState('HOME');
  const [campusInitialFloor, setCampusInitialFloor] = useState('ALL');

  const handleNavigate = (tab, params = {}) => {
    if (params.floor !== undefined) {
      setCampusInitialFloor(params.floor);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-layout">
      {/* Persistent Testbed Isolation Disclaimer */}
      <DisclaimerBanner />

      {/* Main Sticky Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => handleNavigate(tab)}
      />

      {/* Main Page Viewport */}
      <main className="main-content">
        {activeTab === 'HOME' && <HomePage onNavigate={handleNavigate} />}
        {activeTab === 'CAMPUS' && <CampusPage initialFloor={campusInitialFloor} onNavigate={handleNavigate} />}
        {activeTab === 'PREDICTION' && <PredictionPage />}
        {activeTab === 'QOS' && <QoSPage />}
        {activeTab === 'TECHNICAL' && <TechnicalPage />}
      </main>

      {/* Global Metadata Footer */}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <TelemetryProvider>
      <AppContent />
    </TelemetryProvider>
  );
}
