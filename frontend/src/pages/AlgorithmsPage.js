import React from 'react';
import { Card, Row, Col, Collapse, Divider, Tag, Alert } from 'antd';
import { ExperimentOutlined, CheckCircleOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const AlgorithmsPage = () => {
  const algorithms = [
    {
      key: 'logistic_regression',
      name: 'Logistic Regression',
      icon: <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />,
      description: 'Thuật toán hồi quy logistic - một phương pháp thống kê cổ điển cho phân loại nhị phân',
      advantages: [
        'Đơn giản, dễ hiểu và giải thích',
        'Tính toán nhanh, phù hợp với dữ liệu lớn',
        'Cung cấp xác suất dự đoán rõ ràng',
        'Ít bị overfitting với dữ liệu đơn giản'
      ],
      disadvantages: [
        'Giả định mối quan hệ tuyến tính',
        'Khó xử lý các mối quan hệ phức tạp',
        'Nhạy cảm với outliers'
      ],
      useCase: 'Phù hợp cho dữ liệu có mối quan hệ tuyến tính giữa các đặc trưng và kết quả',
      color: '#1890ff'
    },
    {
      key: 'random_forest',
      name: 'Random Forest',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: 'Thuật toán rừng ngẫu nhiên - kết hợp nhiều cây quyết định để đưa ra dự đoán chính xác hơn',
      advantages: [
        'Độ chính xác cao với nhiều loại dữ liệu',
        'Xử lý tốt dữ liệu không cân bằng',
        'Tự động xử lý missing values',
        'Giảm thiểu overfitting nhờ kỹ thuật ensemble',
        'Đánh giá được tầm quan trọng của từng đặc trưng'
      ],
      disadvantages: [
        'Tốn nhiều bộ nhớ và thời gian tính toán',
        'Khó giải thích so với single tree',
        'Có thể overfitting với dữ liệu nhiễu'
      ],
      useCase: 'Rất hiệu quả cho bài toán phức tạp với nhiều đặc trưng và dữ liệu không cân bằng',
      color: '#52c41a'
    },
    {
      key: 'gradient_boosting',
      name: 'Gradient Boosting',
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#faad14' }} />,
      description: 'Thuật toán tăng cường gradient - xây dựng mô hình mạnh bằng cách kết hợp nhiều mô hình yếu',
      advantages: [
        'Độ chính xác rất cao',
        'Xử lý tốt các mối quan hệ phi tuyến',
        'Tối ưu hóa trực tiếp hàm loss function',
        'Tự động xử lý missing values',
        'Hiệu quả với dữ liệu có nhiều đặc trưng'
      ],
      disadvantages: [
        'Dễ bị overfitting nếu không tune tham số tốt',
        'Thời gian training lâu',
        'Nhạy cảm với outliers và nhiễu',
        'Khó giải thích và debug'
      ],
      useCase: 'Lựa chọn tốt cho các bài toán cần độ chính xác cao và có đủ dữ liệu để training',
      color: '#faad14'
    },
    {
      key: 'knn',
      name: 'K-Nearest Neighbors (KNN)',
      icon: <ExperimentOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      description: 'Thuật toán k-láng giềng gần nhất - phân loại dựa trên sự tương đồng với các điểm dữ liệu lân cận',
      advantages: [
        'Không cần training, dự đoán trực tiếp',
        'Đơn giản và dễ hiểu',
        'Không có giả định về phân phối dữ liệu',
        'Hiệu quả với dữ liệu nhỏ và trung bình'
      ],
      disadvantages: [
        'Chậm khi dự đoán với dữ liệu lớn',
        'Nhạy cảm với scale của features',
        'Cần chọn K phù hợp',
        'Không hiệu quả với dữ liệu nhiều chiều'
      ],
      useCase: 'Phù hợp với dữ liệu có cấu trúc không gian rõ ràng và kích thước vừa phải',
      color: '#722ed1'
    }
  ];

  return (
    <div style={{ maxWidth: 1800, margin: '0 auto', padding: '0 24px' }}>
      <Card 
        title={
          <span style={{ fontSize: 20 }}>
            <ExperimentOutlined style={{ marginRight: 8 }} />
            🧪 Các thuật toán Machine Learning được sử dụng
          </span>
        }
      >
        <Alert
          message="📊 Phương pháp đánh giá đa thuật toán"
          description="Hệ thống sử dụng 4 thuật toán Machine Learning khác nhau để phân tích cùng một bộ dữ liệu. Mỗi thuật toán có ưu điểm riêng và cung cấp góc nhìn khác nhau về nguy cơ đột quỵ. Kết quả cuối cùng là trung bình của tất cả các thuật toán, giúp tăng độ tin cậy và giảm thiểu sai số."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Collapse 
          accordion
          defaultActiveKey={['logistic_regression']}
          style={{ marginTop: 20 }}
        >
          {algorithms.map((algo) => (
            <Panel
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {algo.icon}
                  <span style={{ fontSize: 16, fontWeight: 'bold' }}>{algo.name}</span>
                  <Tag color={algo.color}>{algo.key}</Tag>
                </div>
              }
              key={algo.key}
            >
              <div>
                <p style={{ fontSize: 15, marginBottom: 16, lineHeight: 1.6 }}>
                  <strong>📖 Mô tả:</strong> {algo.description}
                </p>

                <Divider />

                <Row gutter={24}>
                  <Col xs={24} md={12}>
                    <Card 
                      title={<span style={{ color: '#52c41a' }}>✅ Ưu điểm</span>}
                      size="small" 
                      style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f', height: '100%' }}
                    >
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {algo.advantages.map((adv, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #d9f7be'
                            }}
                          >
                            <span style={{ marginRight: 8, fontWeight: 'bold', color: '#52c41a' }}>•</span>
                            {adv}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card 
                      title={<span style={{ color: '#ff4d4f' }}>⚠️ Hạn chế</span>}
                      size="small" 
                      style={{ backgroundColor: '#fff2e8', borderColor: '#ffbb96', height: '100%' }}
                    >
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {algo.disadvantages.map((dis, idx) => (
                          <div 
                            key={idx} 
                            style={{ 
                              padding: '8px 12px', 
                              backgroundColor: '#fff',
                              borderRadius: '6px',
                              border: '1px solid #ffd591'
                            }}
                          >
                            <span style={{ marginRight: 8, fontWeight: 'bold', color: '#ff4d4f' }}>•</span>
                            {dis}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </Col>
                </Row>

                <Divider />

                <Alert
                  message="🎯 Trường hợp sử dụng"
                  description={algo.useCase}
                  type="success"
                  showIcon
                />
              </div>
            </Panel>
          ))}
        </Collapse>

        <Divider />

        <Card 
          title="Tại sao sử dụng nhiều thuật toán?" 
          size="small"
          style={{ marginTop: 20, backgroundColor: '#f0f2f5' }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', marginBottom: 8 }} />
                <h4>Độ tin cậy cao hơn</h4>
                <p>Kết quả đồng thuận từ nhiều thuật toán giúp giảm thiểu sai số và tăng độ chính xác</p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <ExperimentOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                <h4>Góc nhìn đa dạng</h4>
                <p>Mỗi thuật toán phân tích dữ liệu theo cách khác nhau, cung cấp cái nhìn toàn diện</p>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <ThunderboltOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                <h4>Giảm thiểu bias</h4>
                <p>Ensemble learning giúp cân bằng điểm yếu của từng thuật toán riêng lẻ</p>
              </Card>
            </Col>
          </Row>
        </Card>

        <Alert
          message="Lưu ý quan trọng"
          description={
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>Kết quả dự đoán chỉ mang tính chất tham khảo</li>
              <li>Không thay thế cho chẩn đoán y khoa chuyên nghiệp</li>
              <li>Độ chính xác phụ thuộc vào chất lượng và số lượng dữ liệu training</li>
              <li>Luôn tham khảo ý kiến bác sĩ cho các quyết định về sức khỏe</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default AlgorithmsPage;
