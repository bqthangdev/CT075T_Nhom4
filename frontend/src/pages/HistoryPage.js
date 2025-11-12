import React, { useState, useEffect } from 'react';
import { Card, Table, message, Button, Modal, Form, InputNumber, Select, Tag, Spin, Popconfirm, Space } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;

const HistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [newResult, setNewResult] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getPredictionHistory();
      setHistory(response.data);
    } catch (error) {
      message.error('Không thể tải lịch sử chuẩn đoán');
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setNewResult(null);
    form.setFieldsValue({
      age: record.age,
      gender: record.gender,
      everMarried: record.everMarried,
      workType: record.workType,
      residenceType: record.residenceType,
      smokingStatus: record.smokingStatus,
      hypertension: record.hypertension,
      heartDisease: record.heartDisease,
      avgGlucoseLevel: record.avgGlucoseLevel,
      bmi: record.bmi,
    });
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
    setNewResult(null);
    form.resetFields();
  };

  const handleRePredict = async () => {
    try {
      const values = await form.validateFields();
      setPredicting(true);
      const response = await api.predictStrokeRisk(values);
      setNewResult(response.data);
      message.success('Chuẩn đoán lại thành công!');
    } catch (error) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra lại thông tin!');
      } else {
        message.error('Có lỗi xảy ra khi chuẩn đoán');
        console.error('Re-predict error:', error);
      }
    } finally {
      setPredicting(false);
    }
  };

  const handleDelete = async (index) => {
    try {
      await api.deleteHistoryItem(index);
      message.success('Đã xóa bản ghi thành công!');
      fetchHistory(); // Reload history
    } catch (error) {
      message.error('Không thể xóa bản ghi');
      console.error('Delete error:', error);
    }
  };

  const columns = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Tuổi',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
    },
    {
      title: 'Mức độ rủi ro',
      dataIndex: 'prediction',
      key: 'prediction',
    },
    {
      title: 'Điểm rủi ro',
      dataIndex: 'strokeRisk',
      key: 'strokeRisk',
      render: (risk) => risk ? `${(risk * 100).toFixed(2)}%` : 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record, index) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            Chi tiết
          </Button>
          <Popconfirm
            title="Xóa bản ghi này?"
            description="Bạn có chắc chắn muốn xóa bản ghi chuẩn đoán này?"
            onConfirm={() => handleDelete(index)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card title="Lịch sử chuẩn đoán">
        <Table
          columns={columns}
          dataSource={history}
          loading={loading}
          rowKey="_id"
          locale={{
            emptyText: 'Chưa có lịch sử chuẩn đoán',
          }}
        />
      </Card>

      <Modal
        title="Chi tiết chuẩn đoán"
        open={modalVisible}
        onCancel={handleCloseModal}
        width={900}
        footer={[
          <Button key="close" onClick={handleCloseModal}>
            Đóng
          </Button>,
          <Button
            key="repredict"
            type="primary"
            loading={predicting}
            onClick={handleRePredict}
          >
            Chuẩn đoán lại
          </Button>,
        ]}
      >
        {selectedRecord && (
          <>
            <Card title="Thông tin gốc" size="small" style={{ marginBottom: 16 }}>
              <p><strong>Thời gian:</strong> {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</p>
              <p><strong>Mức độ rủi ro:</strong> {selectedRecord.prediction}</p>
              <p><strong>Điểm rủi ro:</strong> {(selectedRecord.strokeRisk * 100).toFixed(2)}%</p>
            </Card>

            <Card title="Chỉnh sửa thông số" size="small" style={{ marginBottom: 16 }}>
              <Form form={form} layout="vertical">
                <Form.Item label="Tuổi" name="age" rules={[{ required: true, message: 'Vui lòng nhập tuổi!' }]}>
                  <InputNumber min={0} max={120} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="Giới tính" name="gender" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Male">Nam</Option>
                    <Option value="Female">Nữ</Option>
                    <Option value="Other">Khác</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Tình trạng hôn nhân" name="everMarried" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Yes">Đã kết hôn</Option>
                    <Option value="No">Chưa kết hôn</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Loại công việc" name="workType" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Private">Tư nhân</Option>
                    <Option value="Self-employed">Tự kinh doanh</Option>
                    <Option value="Govt_job">Công chức</Option>
                    <Option value="children">Trẻ em</Option>
                    <Option value="Never_worked">Chưa từng làm việc</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Nơi cư trú" name="residenceType" rules={[{ required: true }]}>
                  <Select>
                    <Option value="Urban">Thành thị</Option>
                    <Option value="Rural">Nông thôn</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Tình trạng hút thuốc" name="smokingStatus" rules={[{ required: true }]}>
                  <Select>
                    <Option value="never smoked">Không bao giờ hút</Option>
                    <Option value="formerly smoked">Đã từng hút</Option>
                    <Option value="smokes">Đang hút</Option>
                    <Option value="Unknown">Không rõ</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Tăng huyết áp" name="hypertension">
                  <Select>
                    <Option value={false}>Không</Option>
                    <Option value={true}>Có</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Bệnh tim" name="heartDisease">
                  <Select>
                    <Option value={false}>Không</Option>
                    <Option value={true}>Có</Option>
                  </Select>
                </Form.Item>

                <Form.Item label="Chỉ số glucose trung bình" name="avgGlucoseLevel" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item label="Chỉ số BMI" name="bmi" rules={[{ required: true }]}>
                  <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
                </Form.Item>
              </Form>
            </Card>

            {predicting && (
              <Card size="small" style={{ textAlign: 'center', marginBottom: 16 }}>
                <Spin size="large" />
                <p style={{ marginTop: 20 }}>Đang phân tích dữ liệu...</p>
              </Card>
            )}

            {newResult && !predicting && (
              <>
                <Card title="Kết quả chuẩn đoán mới" size="small" style={{ marginBottom: 16 }}>
                  <p><strong>Mức độ rủi ro (trung bình):</strong> {newResult.riskLevel}</p>
                  <p><strong>Điểm rủi ro (trung bình):</strong> {(newResult.riskScore * 100).toFixed(2)}%</p>
                </Card>

                {Array.isArray(newResult.models) && newResult.models.length > 0 && (
                  <Card title="Kết quả theo từng thuật toán ML" size="small" style={{ marginBottom: 16 }}>
                    <p style={{ marginBottom: 12, color: '#666', fontSize: '13px' }}>
                      Hệ thống sử dụng {newResult.models.length} thuật toán để đánh giá độc lập.
                    </p>
                    <Table
                      pagination={false}
                      size="small"
                      dataSource={newResult.models.map((m, idx) => ({ key: idx, ...m }))}
                      columns={[
                        { 
                          title: 'Thuật toán', 
                          dataIndex: 'name', 
                          key: 'name',
                          render: (name) => {
                            const nameMap = {
                              'logistic_regression': 'Logistic Regression',
                              'random_forest': 'Random Forest',
                              'gradient_boosting': 'Gradient Boosting',
                              'knn': 'K-Nearest Neighbors'
                            };
                            return <strong>{nameMap[name] || name}</strong>;
                          }
                        },
                        { 
                          title: 'Điểm rủi ro', 
                          key: 'riskScore',
                          align: 'center',
                          render: (_, r) => (
                            <span style={{ fontWeight: 'bold' }}>
                              {(r.riskScore * 100).toFixed(2)}%
                            </span>
                          )
                        },
                        {
                          title: 'Mức độ',
                          dataIndex: 'riskLevel',
                          key: 'riskLevel',
                          align: 'center',
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
                              <Tag color={colorMap[lvl] || 'default'}>
                                {labelMap[lvl] || lvl}
                              </Tag>
                            );
                          },
                        },
                      ]}
                    />
                  </Card>
                )}

                {newResult.recommendations && newResult.recommendations.length > 0 && (
                  <Card title="Khuyến nghị" size="small">
                    <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
                      {newResult.recommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default HistoryPage;
