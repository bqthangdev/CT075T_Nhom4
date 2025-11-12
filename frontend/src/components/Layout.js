import React from 'react';
import { Layout as AntLayout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  BulbOutlined,
  SettingOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import '../styles/Layout.css';

const { Header, Content, Footer } = AntLayout;

const Layout = ({ children }) => {
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: '/prediction',
      icon: <ExperimentOutlined />,
      label: <Link to="/prediction">Chuẩn đoán</Link>,
    },
    {
      key: '/history',
      icon: <HistoryOutlined />,
      label: <Link to="/history">Lịch sử</Link>,
    },
    {
      key: '/validation',
      icon: <LineChartOutlined />,
      label: <Link to="/validation">K-Fold Validation</Link>,
    },
    {
      key: '/bmi-calculator',
      icon: <CalculatorOutlined />,
      label: <Link to="/bmi-calculator">Tính BMI</Link>,
    },
    {
      key: '/algorithms',
      icon: <BulbOutlined />,
      label: <Link to="/algorithms">Thuật toán</Link>,
    },
    {
      key: '/model-config',
      icon: <SettingOutlined />,
      label: <Link to="/model-config">Cấu hình</Link>,
    },
    // {
    //   key: '/about',
    //   icon: <InfoCircleOutlined />,
    //   label: <Link to="/about">Giới thiệu</Link>,
    // },
  ];

  return (
    <AntLayout className="layout">
      <Header>
        <div className="logo">
          <h2 style={{ color: 'white', margin: 0 }}>Stroke Prediction</h2>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
        />
      </Header>
      <Content style={{ padding: '50px' }}>
        <div className="site-layout-content">{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Stroke Prediction System ©{new Date().getFullYear()} Created by ❤️
      </Footer>
    </AntLayout>
  );
};

export default Layout;
