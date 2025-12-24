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
      accuracy: '27.5%',
      advantages: [
        'Không cần training, dự đoán trực tiếp',
        'Đơn giản và dễ hiểu',
        'Không có giả định về phân phối dữ liệu',
        'Specificity cao: 100% (không false positive)'
      ],
      disadvantages: [
        '⚠️ Sensitivity = 0% - KHÔNG phát hiện được TRUE POSITIVE',
        '⚠️ Underprediction: chỉ 27.5% accuracy thực tế',
        '⚠️ Dự đoán HIGH risk cases quá thấp (20%)',
        'Chậm khi dự đoán với dữ liệu lớn',
        'Nhạy cảm với scale của features'
      ],
      useCase: 'Model hỗ trợ - Specificity cao nhưng không phát hiện được stroke cases (Sensitivity = 0%)',
      color: '#722ed1'
    },
    {
      key: 'svm',
      name: 'Support Vector Machine (SVM)',
      icon: <ThunderboltOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      description: 'Máy vector hỗ trợ - tìm siêu phẳng tối ưu để phân tách các lớp dữ liệu với margin lớn nhất',
      accuracy: '27.5%',
      advantages: [
        'ROC-AUC cao nhất: 0.8356',
        'Hiệu quả cao với dữ liệu nhiều chiều',
        'Xử lý tốt class imbalance với class_weight',
        'Robust với outliers nhờ soft margin',
        'Kernel trick xử lý non-linear relationships'
      ],
      disadvantages: [
        '⚠️ Underprediction nghiêm trọng: chỉ 27.5% accuracy thực tế',
        '⚠️ Dự đoán HIGH risk cases quá thấp (25.47% thay vì >66%)',
        'Training chậm với dataset lớn',
        'Cần feature scaling bắt buộc',
        'Khó giải thích và visualize'
      ],
      useCase: 'Model hỗ trợ - ROC-AUC cao nhưng underprediction trên cases thực tế (27.5% accuracy)',
      color: '#fa8c16'
    },
    {
      key: 'decision_tree',
      name: 'Decision Tree',
      icon: <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      description: 'Cây quyết định - phân loại theo cấu trúc cây với các điều kiện if-else dựa trên features',
      isBest: true,
      accuracy: '67.5%',
      advantages: [
        '✨ ACCURACY CAO NHẤT: 67.5% trên test cases thực tế',
        '🎯 Phát hiện HIGH risk chính xác (92.44%)',
        'Dễ hiểu, visualize và giải thích',
        'Không cần feature scaling',
        'Xử lý tốt categorical features',
        'Training và prediction nhanh',
        'Không underprediction như SVM/KNN'
      ],
      disadvantages: [
        'MEDIUM prediction chưa tối ưu',
        'Dễ overfitting nếu không tune',
        'Không ổn định, nhạy cảm với data thay đổi',
        'Cần cải thiện thêm để đạt >80% accuracy'
      ],
      useCase: '⭐ MODEL CHÍNH của hệ thống - Accuracy cao nhất (67.5%), phát hiện HIGH risk tốt nhất (92.44%), phù hợp cho chẩn đoán y tế',
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
          message="🏆 Decision Tree - Model Chính với Accuracy 67.5%"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>Sau quá trình đánh giá toàn diện trên 40 test cases thực tế, <strong>Decision Tree</strong> được chọn làm model chính với accuracy <strong>67.5%</strong> (cao gấp 2.5 lần so với SVM/KNN).</p>
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                <li><strong>Decision Tree (⭐ BEST):</strong> 67.5% accuracy - Phát hiện HIGH risk chính xác 92.44%</li>
                <li><strong>SVM:</strong> 27.5% accuracy - ROC-AUC cao (0.836) nhưng underprediction nghiêm trọng</li>
                <li><strong>KNN:</strong> 27.5% accuracy - Sensitivity = 0% (không phát hiện TRUE POSITIVE)</li>
              </ul>
            </div>
          }
          type="success"
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
                  {algo.isBest && <Tag color="gold" style={{ fontWeight: 'bold' }}>⭐ BEST MODEL</Tag>}
                  {algo.accuracy && <Tag color={algo.isBest ? 'green' : 'default'}>Accuracy: {algo.accuracy}</Tag>}
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
          message="Phương pháp đánh giá models"
          description={
            <div>
              <p><strong>Hệ thống sử dụng 2 phương pháp validation:</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
                <li><strong>K-Fold Cross Validation (k=5):</strong> Chia dataset thành 5 phần, lần lượt train và test để đánh giá toàn diện. Mỗi sample được test 1 lần.</li>
                <li><strong>Holdout Validation (70/30):</strong> Chia 70% train, 30% test để training model cuối cùng deploy vào production.</li>
                <li><strong>Stratified Sampling:</strong> Đảm bảo tỷ lệ stroke/normal giống nhau trong mỗi fold và train/test set.</li>
              </ul>
              <p><strong>Xử lý dữ liệu thiếu (Missing Data):</strong></p>
              <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
                <li><strong>BMI:</strong> Imputation bằng giá trị cố định 22 (BMI bình thường, 18.5-24.9) - chiến lược bảo thủ không thiên lệch</li>
                <li><strong>Categorical features:</strong> Imputation bằng Mode (giá trị phổ biến nhất)</li>
                <li><strong>No Data Leakage:</strong> Sử dụng scikit-learn Pipeline để đảm bảo imputation chỉ học từ training set</li>
              </ul>
            </div>
          }
          type="info"
          showIcon
          style={{ marginTop: 24 }}
        />

        <Alert
          message="Lưu ý quan trọng"
          description={
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>Kết quả dự đoán chỉ mang tính chất tham khảo</li>
              <li>Không thay thế cho chẩn đoán y khoa chuyên nghiệp</li>
              <li>Độ chính xác phụ thuộc vào chất lượng và số lượng dữ liệu training (5110 samples)</li>
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
