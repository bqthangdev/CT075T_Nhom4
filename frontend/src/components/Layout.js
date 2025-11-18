import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Button } from 'antd';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  HomeOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  CalculatorOutlined,
  SwapOutlined,
  BulbOutlined,
  SettingOutlined,
  LineChartOutlined,
  InfoCircleOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import '../styles/Layout.css';

const { Header, Content, Footer } = AntLayout;

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Trang chủ</Link>,
    },
    {
      key: '/prediction',
      icon: <ExperimentOutlined />,
      label: <Link to="/prediction">Chẩn đoán</Link>,
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
      key: '/unit-converter',
      icon: <SwapOutlined />,
      label: <Link to="/unit-converter">Quy đổi đơn vị</Link>,
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

  const mobileMenuItems = menuItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    onClick: () => {
      setMobileMenuVisible(false);
      navigate(item.key);
    }
  }));

  return (
    <AntLayout className="layout">
      <Header style={{ position: 'sticky', top: 0, zIndex: 1000, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link to="/" className="logo" style={{ textDecoration: 'none' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: 'clamp(16px, 4vw, 20px)', cursor: 'pointer' }}>
            Stroke Prediction
          </h2>
        </Link>
        
        {/* Desktop Menu */}
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ flex: 1, minWidth: 0 }}
          className="desktop-menu"
        />
        
        {/* Mobile Menu Button */}
        <Dropdown
          menu={{ items: mobileMenuItems, selectedKeys: [location.pathname] }}
          trigger={['click']}
          open={mobileMenuVisible}
          onOpenChange={setMobileMenuVisible}
          placement="bottomRight"
          overlayClassName="mobile-menu-dropdown"
        >
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            className="mobile-menu-button"
            style={{ color: 'white', fontSize: '20px' }}
          />
        </Dropdown>
      </Header>
      <Content style={{ padding: 'clamp(12px, 3vw, 50px)' }}>
        <div className="site-layout-content">{children}</div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Stroke Prediction System ©{new Date().getFullYear()} Created by ❤️
      </Footer>
    </AntLayout>
  );
};

export default Layout;
