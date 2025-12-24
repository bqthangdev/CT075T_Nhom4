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
            Hệ thống chẩn đoán nguy cơ đột quỵ là một ứng dụng web sử dụng công nghệ
            học máy (Machine Learning) để dự đoán khả năng mắc bệnh đột quỵ dựa trên
            các thông tin sức khỏe và lối sống của bệnh nhân.
          </Paragraph>

          <Divider />

          <Title level={3}>Mục tiêu</Title>
          <Paragraph>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>Cung cấp công cụ hỗ trợ chẩn đoán sớm nguy cơ đột quỵ</li>
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
            <strong>Backend API:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>Flask (Python) - REST API framework</li>
              <li>scikit-learn 1.8.0 - Machine Learning</li>
              <li>pandas, numpy - Data processing</li>
            </ul>
          </Paragraph>
          <Paragraph>
            <strong>Machine Learning Models:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>⭐ <strong>Decision Tree</strong> - Model chính (67.5% accuracy)</li>
              <li>Support Vector Machine (SVM) - Model hỗ trợ (ROC-AUC 0.836)</li>
              <li>K-Nearest Neighbors (KNN) - Model hỗ trợ (Specificity 100%)</li>
            </ul>
          </Paragraph>
          <Paragraph>
            <strong>Phương pháp đánh giá:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>K-Fold Cross Validation (k=5) - Đánh giá toàn diện</li>
              <li>Holdout Validation (70/30) - Training model cuối cùng</li>
              <li>Stratified sampling - Đảm bảo tỷ lệ class cân bằng</li>
            </ul>
          </Paragraph>
          <Paragraph>
            <strong>Xử lý dữ liệu thiếu:</strong>
            <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
              <li>BMI: Imputation bằng giá trị cố định 22 (BMI bình thường)</li>
              <li>Categorical: Imputation bằng Mode (giá trị phổ biến nhất)</li>
              <li>Pipeline đảm bảo không có Data Leakage</li>
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
