import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const AboutPage = () => {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card>
        <Typography>
          <Title level={2}>Giới thiệu về dự án</Title>
          
          <Paragraph>
            Hệ thống chuẩn đoán nguy cơ đột quỵ là một ứng dụng web sử dụng công nghệ
            học máy (Machine Learning) để dự đoán khả năng mắc bệnh đột quỵ dựa trên
            các thông tin sức khỏe và lối sống của bệnh nhân.
          </Paragraph>

          <Divider />

          <Title level={3}>Mục tiêu</Title>
          <Paragraph>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>Cung cấp công cụ hỗ trợ chuẩn đoán sớm nguy cơ đột quỵ</li>
              <li>Nâng cao nhận thức về các yếu tố nguy cơ</li>
              <li>Hỗ trợ bác sĩ trong quá trình đánh giá sức khỏe bệnh nhân</li>
            </ul>
          </Paragraph>

          <Divider />

          <Title level={3}>Công nghệ sử dụng</Title>
          <Paragraph>
            <strong>Frontend:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>React.js - Thư viện UI</li>
              <li>Ant Design - UI Components</li>
              <li>React Router - Routing</li>
            </ul>
          </Paragraph>
          <Paragraph>
            <strong>Backend:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>Node.js - Runtime environment</li>
              <li>Express.js - Web framework</li>
              <li>MongoDB - Database</li>
            </ul>
          </Paragraph>

          <Divider />

          <Title level={3}>Nguồn dữ liệu</Title>
          <Paragraph>
            Dữ liệu được sử dụng để huấn luyện mô hình đến từ:
            <br />
            <a 
              href="https://www.kaggle.com/datasets/fedesoriano/stroke-prediction-dataset"
              target="_blank"
              rel="noopener noreferrer"
            >
              Stroke Prediction Dataset - Kaggle
            </a>
          </Paragraph>

          <Divider />

          <Title level={3}>Nhóm phát triển</Title>
          <Paragraph>
            Dự án được phát triển bởi Nhóm 4 - CT075T
          </Paragraph>

          <Divider />

          <Title level={3}>Lưu ý</Title>
          <Paragraph style={{ color: '#ff4d4f' }}>
            ⚠️ Kết quả từ hệ thống chỉ mang tính chất tham khảo và hỗ trợ.
            Không thay thế cho chẩn đoán y khoa chuyên nghiệp. Vui lòng tham khảo
            ý kiến bác sĩ để có đánh giá chính xác nhất.
          </Paragraph>
        </Typography>
      </Card>
    </div>
  );
};

export default AboutPage;
