import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, InputNumber, message, Spin, Table, Tag, Tooltip } from 'antd';
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
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card title="Nhập thông tin bệnh nhân">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
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

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
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
          <Card title="Kết quả tổng hợp" style={{ marginTop: 20 }}>
            <p><strong>Mức độ rủi ro (trung bình):</strong> {result.riskLevel}</p>
            <p><strong>Điểm rủi ro (trung bình):</strong> {(result.riskScore * 100).toFixed(2)}%</p>
          </Card>

          {Array.isArray(result.models) && result.models.length > 0 && (
            <Card title="Kết quả theo từng thuật toán Machine Learning" style={{ marginTop: 20 }}>
              <p style={{ marginBottom: 16, color: '#666' }}>
                Hệ thống sử dụng {result.models.length} thuật toán khác nhau để đánh giá độc lập và đưa ra dự đoán chính xác hơn.
              </p>
              <Table
                pagination={false}
                dataSource={result.models.map((m, idx) => ({ key: idx, ...m }))}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                      <h4>📊 Metrics đánh giá (Training Set)</h4>
                      {record.metrics && Object.keys(record.metrics).length > 0 ? (
                        <div>
                          <p><strong>Accuracy:</strong> {(record.metrics.accuracy * 100).toFixed(2)}%</p>
                          <p><strong>Precision:</strong> {(record.metrics.precision * 100).toFixed(2)}%</p>
                          <p><strong>Recall (Sensitivity):</strong> {(record.metrics.recall * 100).toFixed(2)}%</p>
                          <p><strong>F1-Score:</strong> {(record.metrics.f1_score * 100).toFixed(2)}%</p>
                          <p><strong>ROC-AUC:</strong> {record.metrics.roc_auc ? (record.metrics.roc_auc * 100).toFixed(2) + '%' : 'N/A'}</p>
                          <p><strong>MAE (Prediction):</strong> {record.metrics.mae ? record.metrics.mae.toFixed(4) : 'N/A'}</p>
                          <p><strong>MSE (Prediction):</strong> {record.metrics.mse ? record.metrics.mse.toFixed(4) : 'N/A'}</p>
                          {record.metrics.mae_proba && <p><strong>MAE (Probability):</strong> {record.metrics.mae_proba.toFixed(4)}</p>}
                          {record.metrics.mse_proba && <p><strong>MSE (Probability):</strong> {record.metrics.mse_proba.toFixed(4)}</p>}
                          {record.metrics.specificity !== undefined && (
                            <p><strong>Specificity:</strong> {(record.metrics.specificity * 100).toFixed(2)}%</p>
                          )}
                          {record.metrics.confusion_matrix && (
                            <div style={{ marginTop: 12 }}>
                              <strong>Confusion Matrix:</strong>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: 8 }}>
                                <Tag color="green">TN: {record.metrics.confusion_matrix.true_negative}</Tag>
                                <Tag color="orange">FP: {record.metrics.confusion_matrix.false_positive}</Tag>
                                <Tag color="orange">FN: {record.metrics.confusion_matrix.false_negative}</Tag>
                                <Tag color="red">TP: {record.metrics.confusion_matrix.true_positive}</Tag>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: '#999' }}>Không có metrics. Vui lòng train lại model.</p>
                      )}
                    </div>
                  ),
                }}
                columns={[
                  { 
                    title: 'Thuật toán', 
                    dataIndex: 'name', 
                    key: 'name',
                    width: '40%',
                    render: (name) => {
                      const nameMap = {
                        'logistic_regression': 'Logistic Regression',
                        'random_forest': 'Random Forest',
                        'gradient_boosting': 'Gradient Boosting',
                        'knn': 'K-Nearest Neighbors (KNN)'
                      };
                      return (
                        <span>
                          <strong>{nameMap[name] || name}</strong>
                          <br />
                          <span style={{ fontSize: '12px', color: '#999' }}>{name}</span>
                        </span>
                      );
                    }
                  },
                  { 
                    title: 'Điểm rủi ro', 
                    key: 'riskScore', 
                    align: 'center',
                    width: '30%',
                    render: (_, r) => (
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {(r.riskScore * 100).toFixed(2)}%
                      </span>
                    )
                  },
                  { 
                    title: 'Mức độ rủi ro', 
                    dataIndex: 'riskLevel', 
                    key: 'riskLevel',
                    align: 'center',
                    width: '30%',
                    render: (lvl) => {
                      const colorMap = {
                        'High Risk': 'red',
                        'Medium Risk': 'orange',
                        'Low Risk': 'green'
                      };
                      const labelMap = {
                        'High Risk': 'Cao',
                        'Medium Risk': 'Trung bình',
                        'Low Risk': 'Thấp'
                      };
                      return (
                        <Tag color={colorMap[lvl] || 'default'} style={{ fontSize: '14px', padding: '4px 12px' }}>
                          {labelMap[lvl] || lvl}
                        </Tag>
                      );
                    }
                  },
                ]}
              />
              <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                💡 Nhấp vào mỗi hàng để xem chi tiết metrics đánh giá
              </p>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card title="Khuyến nghị" style={{ marginTop: 20 }}>
              <ul sstyle={{ textAlign: 'left', paddingLeft: 20 }}>
                {result.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionPage;
