import React from 'react';
import { Card, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ExperimentOutlined } from '@ant-design/icons';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <ExperimentOutlined style={{ fontSize: 64, color: '#1890ff' }} />
          <h1 style={{ fontSize: 36, marginTop: 20 }}>
            Hệ thống chuẩn đoán nguy cơ đột quỵ
          </h1>
          <p style={{ fontSize: 18, marginTop: 20, color: '#666' }}>
            Ứng dụng công nghệ học máy hiện đại để dự đoán nguy cơ đột quỵ dựa
            trên các chỉ số sức khỏe
          </p>
          <Button
            type="primary"
            size="large"
            style={{ marginTop: 30 }}
            onClick={() => navigate('/prediction')}
          >
            Bắt đầu chuẩn đoán
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <Card title="Chính xác cao">
          <p>Sử dụng thuật toán machine learning tiên tiến để đưa ra dự đoán chính xác</p>
        </Card>
        <Card title="Dễ sử dụng">
          <p>Giao diện thân thiện, dễ dàng nhập liệu và nhận kết quả</p>
        </Card>
        <Card title="Nhanh chóng">
          <p>Kết quả chuẩn đoán được trả về trong vài giây</p>
        </Card>
      </div>
    </div>
  );
};

export default HomePage;
