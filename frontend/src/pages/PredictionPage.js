import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, InputNumber, message, Spin, Table, Tag, Tooltip, Alert, Divider } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const PredictionPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.predictStrokeRisk(values);
      setResult(response.data);
      message.success('Chuẩn đoán thành công!');
    } catch (error) {
      message.error('Có lỗi xảy ra khi chuẩn đoán');
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1800, margin: '0 auto', padding: '0 24px' }}>
      <Card title="Nhập thông tin bệnh nhân" style={{ marginBottom: 20 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <Form.Item
              label={
                <span>
                  Tên bệnh nhân{' '}
                  <Tooltip title="Họ và tên đầy đủ của bệnh nhân">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="patientName"
              rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}
            >
              <Input placeholder="Ví dụ: Nguyễn Văn A" />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Số căn cước công dân{' '}
                  <Tooltip title="Số CCCD 12 số (dùng để định danh duy nhất bệnh nhân)">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="citizenId"
              rules={[
                { required: true, message: 'Vui lòng nhập số CCCD!' },
                { pattern: /^\d{12}$/, message: 'CCCD phải là 12 chữ số!' }
              ]}
            >
              <Input placeholder="Ví dụ: 001234567890" maxLength={12} />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Tuổi{' '}
                  <Tooltip title="Nhập tuổi hiện tại của bệnh nhân (từ 0 đến 120 tuổi)">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="age"
              rules={[{ required: true, message: 'Vui lòng nhập tuổi!' }]}
            >
              <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="Ví dụ: 45" />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Giới tính{' '}
                  <Tooltip title="Giới tính của bệnh nhân">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="gender"
              rules={[{ required: true, message: 'Vui lòng chọn giới tính!' }]}
            >
              <Select placeholder="Chọn giới tính">
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
                <Option value="Other">Khác</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Tình trạng hôn nhân{' '}
                  <Tooltip title="Tình trạng hôn nhân hiện tại của bệnh nhân">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="everMarried"
              rules={[{ required: true, message: 'Vui lòng chọn!' }]}
            >
              <Select placeholder="Chọn tình trạng hôn nhân">
                <Option value="Yes">Đã kết hôn</Option>
                <Option value="No">Chưa kết hôn</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Loại công việc{' '}
                  <Tooltip title="Loại hình công việc chính của bệnh nhân">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="workType"
              rules={[{ required: true, message: 'Vui lòng chọn loại công việc!' }]}
            >
              <Select placeholder="Chọn loại công việc">
                <Option value="Private">Tư nhân</Option>
                <Option value="Self-employed">Tự kinh doanh</Option>
                <Option value="Govt_job">Công chức</Option>
                <Option value="children">Trẻ em</Option>
                <Option value="Never_worked">Chưa từng làm việc</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Nơi cư trú{' '}
                  <Tooltip title="Khu vực sinh sống chính của bệnh nhân">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="residenceType"
              rules={[{ required: true, message: 'Vui lòng chọn!' }]}
            >
              <Select placeholder="Chọn nơi cư trú">
                <Option value="Urban">Thành thị</Option>
                <Option value="Rural">Nông thôn</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Tình trạng hút thuốc{' '}
                  <Tooltip title="Lịch sử và tình trạng hút thuốc lá hiện tại">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="smokingStatus"
              rules={[{ required: true, message: 'Vui lòng chọn!' }]}
            >
              <Select placeholder="Chọn tình trạng hút thuốc">
                <Option value="never smoked">Không bao giờ hút</Option>
                <Option value="formerly smoked">Đã từng hút</Option>
                <Option value="smokes">Đang hút</Option>
                <Option value="Unknown">Không rõ</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              label={
                <span>
                  Tăng huyết áp{' '}
                  <Tooltip title="Bệnh nhân có tiền sử hoặc đang bị tăng huyết áp không?">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="hypertension"
            >
              <Select placeholder="Chọn tình trạng">
                <Option value={false}>Không</Option>
                <Option value={true}>Có</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              label={
                <span>
                  Bệnh tim{' '}
                  <Tooltip title="Bệnh nhân có tiền sử hoặc đang bị bệnh tim mạch không?">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="heartDisease"
            >
              <Select placeholder="Chọn tình trạng">
                <Option value={false}>Không</Option>
                <Option value={true}>Có</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Chỉ số glucose trung bình{' '}
                  <Tooltip title="Nồng độ glucose trung bình trong máu (mg/dL). Bình thường: 70-100, Tiền tiểu đường: 100-125, Tiểu đường: >126">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="avgGlucoseLevel"
              rules={[{ required: true, message: 'Vui lòng nhập chỉ số glucose!' }]}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 105.2" />
            </Form.Item>

            <Form.Item
              label={
                <span>
                  Chỉ số BMI{' '}
                  <Tooltip title="Body Mass Index - Chỉ số khối cơ thể. Tính bằng: Cân nặng (kg) / Chiều cao² (m²). Bình thường: 18.5-24.9">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="bmi"
              rules={[{ required: true, message: 'Vui lòng nhập BMI!' }]}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 24.6" />
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={loading} size="large" block>
              Chuẩn đoán
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {loading && (
        <Card style={{ marginTop: 20, textAlign: 'center' }}>
          <Spin size="large" />
          <p style={{ marginTop: 20 }}>Đang phân tích dữ liệu...</p>
        </Card>
      )}

      {result && !loading && (
        <>
          <Card 
            title="📊 Kết quả tổng hợp" 
            style={{ marginTop: 20, backgroundColor: '#f0f5ff', borderColor: '#adc6ff' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
              <div>
                <strong style={{ fontSize: 16 }}>Mức độ rủi ro (trung bình):</strong>
                <Tag 
                  color={result.riskLevel === 'High Risk' ? 'red' : result.riskLevel === 'Medium Risk' ? 'orange' : 'green'} 
                  style={{ marginLeft: 12, fontSize: 16, padding: '4px 16px' }}
                >
                  {result.riskLevel}
                </Tag>
              </div>
              <div>
                <strong style={{ fontSize: 16 }}>Điểm rủi ro (trung bình):</strong>
                <span style={{ marginLeft: 12, fontSize: 20, fontWeight: 'bold', color: '#1890ff' }}>
                  {(result.riskScore * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </Card>

          {Array.isArray(result.models) && result.models.length > 0 && (
            <Card title="📈 So sánh chi tiết các thuật toán Machine Learning" style={{ marginTop: 20 }}>
              <Alert
                message={`Kết quả từ ${result.models.length} thuật toán khác nhau`}
                description="Các chỉ số dưới đây được tính toán từ test set trong quá trình training để đánh giá độ chính xác của từng thuật toán."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                pagination={false}
                scroll={{ x: 1600 }}
                size="small"
                dataSource={result.models.map((m, idx) => ({ key: idx, ...m }))}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                      <h4>📊 Confusion Matrix & Chi tiết</h4>
                      {record.metrics && record.metrics.confusion_matrix ? (
                        <div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: 16 }}>
                            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
                              <h4 style={{ margin: 0, color: '#52c41a' }}>True Negative (TN)</h4>
                              <p style={{ fontSize: 24, fontWeight: 'bold', margin: '8px 0 0 0' }}>
                                {record.metrics.confusion_matrix.true_negative}
                              </p>
                              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Dự đoán đúng: Không đột quỵ</p>
                            </Card>
                            <Card size="small" style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}>
                              <h4 style={{ margin: 0, color: '#fa8c16' }}>False Positive (FP)</h4>
                              <p style={{ fontSize: 24, fontWeight: 'bold', margin: '8px 0 0 0' }}>
                                {record.metrics.confusion_matrix.false_positive}
                              </p>
                              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Dự đoán sai: Không đột quỵ → Có đột quỵ</p>
                            </Card>
                            <Card size="small" style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591' }}>
                              <h4 style={{ margin: 0, color: '#fa8c16' }}>False Negative (FN)</h4>
                              <p style={{ fontSize: 24, fontWeight: 'bold', margin: '8px 0 0 0' }}>
                                {record.metrics.confusion_matrix.false_negative}
                              </p>
                              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Dự đoán sai: Có đột quỵ → Không đột quỵ</p>
                            </Card>
                            <Card size="small" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e' }}>
                              <h4 style={{ margin: 0, color: '#f5222d' }}>True Positive (TP)</h4>
                              <p style={{ fontSize: 24, fontWeight: 'bold', margin: '8px 0 0 0' }}>
                                {record.metrics.confusion_matrix.true_positive}
                              </p>
                              <p style={{ fontSize: 12, color: '#666', margin: 0 }}>Dự đoán đúng: Có đột quỵ</p>
                            </Card>
                          </div>
                          <Divider />
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                            <div>
                              <strong>MAE (Probability):</strong> {record.metrics.mae_proba ? record.metrics.mae_proba.toFixed(4) : 'N/A'}
                            </div>
                            <div>
                              <strong>MSE (Probability):</strong> {record.metrics.mse_proba ? record.metrics.mse_proba.toFixed(4) : 'N/A'}
                            </div>
                            <div>
                              <strong>Specificity:</strong> {record.metrics.specificity ? (record.metrics.specificity * 100).toFixed(2) + '%' : 'N/A'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p style={{ color: '#999' }}>Không có confusion matrix. Vui lòng train lại model.</p>
                      )}
                    </div>
                  ),
                }}
                columns={[
                  { 
                    title: 'Thuật toán', 
                    dataIndex: 'name', 
                    key: 'name',
                    width: 180,
                    fixed: 'left',
                    render: (name) => {
                      const nameMap = {
                        'logistic_regression': 'Logistic Regression',
                        'random_forest': 'Random Forest',
                        'gradient_boosting': 'Gradient Boosting',
                        'knn': 'K-Nearest Neighbors'
                      };
                      return (
                        <div>
                          <strong>{nameMap[name] || name}</strong>
                          <br />
                          <Tag color="blue" style={{ fontSize: '11px', marginTop: 4 }}>{name}</Tag>
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Điểm rủi ro\n(Prediction)', 
                    key: 'riskScore', 
                    align: 'center',
                    width: 110,
                    render: (_, r) => (
                      <span style={{ fontSize: '15px', fontWeight: 'bold', color: r.riskScore > 0.66 ? '#f5222d' : r.riskScore > 0.33 ? '#fa8c16' : '#52c41a' }}>
                        {(r.riskScore * 100).toFixed(2)}%
                      </span>
                    )
                  },
                  { 
                    title: 'Mức độ', 
                    dataIndex: 'riskLevel', 
                    key: 'riskLevel',
                    align: 'center',
                    width: 100,
                    render: (lvl) => {
                      const colorMap = { 'High Risk': 'red', 'Medium Risk': 'orange', 'Low Risk': 'green' };
                      const labelMap = { 'High Risk': 'Cao', 'Medium Risk': 'TB', 'Low Risk': 'Thấp' };
                      return <Tag color={colorMap[lvl] || 'default'}>{labelMap[lvl] || lvl}</Tag>;
                    }
                  },
                  { 
                    title: 'Accuracy', 
                    key: 'accuracy',
                    align: 'center',
                    width: 100,
                    render: (_, r) => r.metrics?.accuracy ? (
                      <span style={{ fontWeight: 500 }}>{(r.metrics.accuracy * 100).toFixed(2)}%</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'Precision', 
                    key: 'precision',
                    align: 'center',
                    width: 100,
                    render: (_, r) => r.metrics?.precision ? (
                      <span style={{ fontWeight: 500 }}>{(r.metrics.precision * 100).toFixed(2)}%</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'Recall', 
                    key: 'recall',
                    align: 'center',
                    width: 100,
                    render: (_, r) => r.metrics?.recall ? (
                      <span style={{ fontWeight: 500 }}>{(r.metrics.recall * 100).toFixed(2)}%</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'F1-Score', 
                    key: 'f1',
                    align: 'center',
                    width: 100,
                    render: (_, r) => r.metrics?.f1_score ? (
                      <span style={{ fontWeight: 500 }}>{(r.metrics.f1_score * 100).toFixed(2)}%</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'ROC-AUC', 
                    key: 'auc',
                    align: 'center',
                    width: 100,
                    render: (_, r) => r.metrics?.roc_auc ? (
                      <span style={{ fontWeight: 500 }}>{(r.metrics.roc_auc * 100).toFixed(2)}%</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'MAE', 
                    key: 'mae',
                    align: 'center',
                    width: 90,
                    render: (_, r) => r.metrics?.mae ? (
                      <span style={{ fontWeight: 500 }}>{r.metrics.mae.toFixed(4)}</span>
                    ) : 'N/A'
                  },
                  { 
                    title: 'MSE', 
                    key: 'mse',
                    align: 'center',
                    width: 90,
                    render: (_, r) => r.metrics?.mse ? (
                      <span style={{ fontWeight: 500 }}>{r.metrics.mse.toFixed(4)}</span>
                    ) : 'N/A'
                  },
                ]}
              />
              <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                💡 Nhấp vào mỗi hàng để xem Confusion Matrix chi tiết
              </p>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card 
              title="💡 Khuyến nghị" 
              style={{ marginTop: 20, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {result.recommendations.map((rec, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      padding: '12px 16px', 
                      backgroundColor: '#fff',
                      borderRadius: '8px',
                      border: '1px solid #ffd591',
                      fontSize: 15
                    }}
                  >
                    <span style={{ marginRight: 8, fontWeight: 'bold', color: '#fa8c16' }}>
                      {index + 1}.
                    </span>
                    {rec}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionPage;
