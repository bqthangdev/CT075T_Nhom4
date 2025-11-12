import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import HomePage from './pages/HomePage';
import PredictionPage from './pages/PredictionPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import BMICalculatorPage from './pages/BMICalculatorPage';
import AlgorithmsPage from './pages/AlgorithmsPage';
import ModelConfigPage from './pages/ModelConfigPage';
import Layout from './components/Layout';
import './styles/App.css';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/prediction" element={<PredictionPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/bmi-calculator" element={<BMICalculatorPage />} />
            <Route path="/algorithms" element={<AlgorithmsPage />} />
            <Route path="/model-config" element={<ModelConfigPage />} />
            {/* <Route path="/about" element={<AboutPage />} /> */}
          </Routes>
        </Layout>
      </Router>
    </ConfigProvider>
  );
}

export default App;
