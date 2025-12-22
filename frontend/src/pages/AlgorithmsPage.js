import React from 'react';
import { Card, Row, Col, Collapse, Divider, Tag, Alert } from 'antd';
import { ExperimentOutlined, CheckCircleOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const AlgorithmsPage = () => {
  const algorithms = [
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
    },
    {
      key: 'svm',
      name: 'Support Vector Machine (SVM)',
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      description: 'Máy vector hỗ trợ - tìm siêu phẳng tối ưu để phân tách các lớp dữ liệu với margin lớn nhất',
      advantages: [
        'Hiệu quả cao với dữ liệu nhiều chiều',
        'Xử lý tốt class imbalance với class_weight',
        'Robust với outliers nhờ soft margin',
        'Kernel trick xử lý non-linear relationships',
        'Độ chính xác cao cho imbalanced data'
      ],
      disadvantages: [
        'Training chậm với dataset lớn',
        'Cần feature scaling bắt buộc',
        'Khó giải thích và visualize',
        'Cần tune hyperparameters (C, gamma, kernel)'
      ],
      useCase: 'Tối ưu cho dữ liệu imbalanced, high-dimensional, cần accuracy cao',
      color: '#fa8c16'
    },
    {
      key: 'decision_tree',
      name: 'Decision Tree',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: 'Cây quyết định - phân loại theo cấu trúc cây với các điều kiện if-else dựa trên features',
      advantages: [
        'Dễ hiểu, visualize và giải thích',
        'Không cần feature scaling',
        'Xử lý tốt categorical features',
        'Training và prediction nhanh',
        'Tự động feature selection'
      ],
      disadvantages: [
        'Dễ overfitting nếu không tune',
        'Không ổn định, nhạy cảm với data thay đổi',
        'Bias với imbalanced data',
        'Accuracy thấp hơn ensemble methods'
      ],
      useCase: 'Baseline model, cần interpretability, mixed data types, fast prototyping',
      color: '#52c41a'
    }
  ];

  return (
    <div style={{ margin: '0 auto', padding: '0 clamp(12px, 2vw, 24px)' }}>
      <Card 
        title={
          <span style={{ fontSize: 20 }}>
            <ExperimentOutlined style={{ marginRight: 8 }} />
            Các thuật toán Machine Learning được sử dụng
          </span>
        }
      >
        <Alert
          message="📊 Phương pháp đánh giá đa thuật toán"
          description="Hệ thống sử dụng 3 thuật toán Machine Learning: KNN (instance-based), SVM (margin-based), và Decision Tree (rule-based). Mỗi thuật toán có ưu điểm riêng: KNN đơn giản và trực quan, SVM xử lý tốt imbalanced data, Decision Tree dễ interpret. Kết quả tổng hợp từ các thuật toán giúp tăng độ tin cậy."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Collapse 
          accordion
          defaultActiveKey={['knn']}
          style={{ marginTop: 20 }}
        >
          {algorithms.map((algo) => (
            <Panel
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {algo.icon}
                    <span style={{ fontSize: 16, fontWeight: 'bold' }}>{algo.name}</span>
                  </div>
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
