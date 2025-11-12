import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, message, Button, Modal, Form, InputNumber, Select, Tag, Spin, Popconfirm, Space, Divider, Alert, Input, DatePicker, Row, Col } from 'antd';
import { EyeOutlined, DeleteOutlined, ClearOutlined, SearchOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Option } = Select;
const { RangePicker } = DatePicker;

const HistoryPage = () => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [newResult, setNewResult] = useState(null);
  const [form] = Form.useForm();

  // Filter states
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  // Debounce search text
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timer);
    };
  }, [searchText]);

  useEffect(() => {
    applyFilters();
  }, [history, debouncedSearchText, filterRisk, filterGender, dateRange]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getPredictionHistory();
      setHistory(response.data);
      setFilteredHistory(response.data);
    } catch (error) {
      message.error('Không thể tải lịch sử chuẩn đoán');
      console.error('Fetch history error:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...history];

    // Search by name or CCCD (using debounced search text)
    if (debouncedSearchText) {
      const searchLower = debouncedSearchText.toLowerCase();
      filtered = filtered.filter(item => 
        (item.patientName?.toLowerCase().includes(searchLower)) ||
        (item.citizenId?.includes(debouncedSearchText))
      );
    }

    // Filter by risk level
    if (filterRisk !== 'all') {
      filtered = filtered.filter(item => item.prediction === filterRisk);
    }

    // Filter by gender
    if (filterGender !== 'all') {
      filtered = filtered.filter(item => item.gender === filterGender);
    }

    // Filter by date range
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate >= startDate.toDate() && itemDate <= endDate.toDate();
      });
    }

    setFilteredHistory(filtered);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setDebouncedSearchText('');
    setFilterRisk('all');
    setFilterGender('all');
    setDateRange(null);
  };

  const handleExportCSV = () => {
    try {
      // Prepare CSV content
      const headers = ['Thời gian', 'Tên bệnh nhân', 'Số CCCD', 'Tuổi', 'Giới tính', 'Mức độ rủi ro', 'Điểm rủi ro', 'Huyết áp cao', 'Bệnh tim', 'Glucose', 'BMI'];
      const rows = filteredHistory.map(record => [
        new Date(record.createdAt).toLocaleString('vi-VN'),
        record.patientName || 'N/A',
        record.citizenId || 'N/A',
        record.age,
        record.gender,
        record.prediction,
        record.strokeRisk ? `${(record.strokeRisk * 100).toFixed(2)}%` : 'N/A',
        record.hypertension ? 'Có' : 'Không',
        record.heartDisease ? 'Có' : 'Không',
        record.avgGlucoseLevel,
        record.bmi
      ]);

      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      // Create and download file
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `lich-su-chuan-doan-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('Đã xuất file CSV thành công!');
    } catch (error) {
      message.error('Có lỗi xảy ra khi xuất file');
      console.error('Export error:', error);
    }
  };

  const handleViewDetail = (record) => {
    setSelectedRecord(record);
    setNewResult(null);
    form.setFieldsValue({
      patientName: record.patientName,
      citizenId: record.citizenId,
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
      
      // Reload history to update the table with new record
      await fetchHistory();
      
      message.success('Chuẩn đoán lại thành công! Bản ghi mới đã được thêm vào lịch sử.');
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

  const handleClearAll = async () => {
    try {
      await api.clearAllHistory();
      message.success('Đã xóa toàn bộ lịch sử thành công!');
      setHistory([]);
    } catch (error) {
      message.error('Không thể xóa lịch sử');
      console.error('Clear all error:', error);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => {
        // Calculate actual index based on pagination
        return index + 1;
      },
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('vi-VN'),
    },
    {
      title: 'Tên bệnh nhân',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 200,
      render: (name) => name || <span style={{ color: '#999' }}>N/A</span>,
    },
    {
      title: 'Số CCCD',
      dataIndex: 'citizenId',
      key: 'citizenId',
      width: 150,
      render: (cccd) => cccd || <span style={{ color: '#999' }}>N/A</span>,
    },
    {
      title: 'Tuổi',
      dataIndex: 'age',
      key: 'age',
      width: 70,
      align: 'center',
    },
    {
      title: 'Giới tính',
      dataIndex: 'gender',
      key: 'gender',
      width: 100,
      align: 'center',
      render: (gender) => {
        const genderMap = {
          'Male': { text: 'Nam', color: 'blue' },
          'Female': { text: 'Nữ', color: 'pink' },
          'Other': { text: 'Khác', color: 'default' }
        };
        const info = genderMap[gender] || { text: gender, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      }
    },
    {
      title: 'Mức độ rủi ro',
      dataIndex: 'prediction',
      key: 'prediction',
      width: 140,
      align: 'center',
      render: (prediction) => {
        const colorMap = {
          'Low Risk': 'green',
          'Medium Risk': 'orange',
          'High Risk': 'red'
        };
        return <Tag color={colorMap[prediction]}>{prediction}</Tag>;
      },
    },
    {
      title: 'Điểm rủi ro',
      dataIndex: 'strokeRisk',
      key: 'strokeRisk',
      width: 110,
      align: 'center',
      render: (risk) => {
        if (!risk) return 'N/A';
        const percentage = (risk * 100).toFixed(2);
        const color = risk < 0.33 ? '#52c41a' : risk < 0.66 ? '#faad14' : '#ff4d4f';
        return <span style={{ fontWeight: 'bold', color }}>{percentage}%</span>;
      },
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 180,
      fixed: 'right',
      align: 'center',
      render: (_, record, index) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
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
              size="small"
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
    <div style={{ maxWidth: 1800, margin: '0 auto', padding: '0 24px' }}>
      <Card 
        title="📋 Lịch sử chuẩn đoán" 
        extra={
          <Space>
            <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
              Hiển thị: {filteredHistory.length} / {history.length} bản ghi
            </Tag>
            {filteredHistory.length > 0 && (
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
              >
                Xuất CSV
              </Button>
            )}
            {history.length > 0 && (
              <Popconfirm
                title="Xóa toàn bộ lịch sử?"
                description="Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử chuẩn đoán? Hành động này không thể hoàn tác!"
                onConfirm={handleClearAll}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<ClearOutlined />}>
                  Xóa tất cả
                </Button>
              </Popconfirm>
            )}
          </Space>
        }
      >
        {/* Statistics Section */}
        {filteredHistory.length > 0 && (
          <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}>
            <Row gutter={16}>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                    {filteredHistory.filter(h => h.prediction === 'Low Risk').length}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Low Risk</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#faad14' }}>
                    {filteredHistory.filter(h => h.prediction === 'Medium Risk').length}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Medium Risk</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {filteredHistory.filter(h => h.prediction === 'High Risk').length}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>High Risk</div>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                    {filteredHistory.filter(h => h.citizenId).length}
                  </div>
                  <div style={{ fontSize: 12, color: '#666' }}>Có CCCD</div>
                </div>
              </Col>
            </Row>
          </Card>
        )}

        {/* Filter Section */}
        <Card 
          title={
            <span>
              <FilterOutlined style={{ marginRight: 8 }} />
              Bộ lọc & Tìm kiếm
            </span>
          }
          size="small" 
          style={{ marginBottom: 16, backgroundColor: '#fafafa' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                <SearchOutlined /> Tìm kiếm:
              </label>
              <Input
                placeholder="Tên bệnh nhân hoặc số CCCD"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                suffix={
                  searchText && searchText !== debouncedSearchText ? (
                    <Spin size="small" />
                  ) : null
                }
              />
              {searchText && searchText !== debouncedSearchText && (
                <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                  Đang tìm kiếm...
                </div>
              )}
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Mức độ rủi ro:
              </label>
              <Select
                value={filterRisk}
                onChange={setFilterRisk}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="Low Risk">Low Risk</Option>
                <Option value="Medium Risk">Medium Risk</Option>
                <Option value="High Risk">High Risk</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Giới tính:
              </label>
              <Select
                value={filterGender}
                onChange={setFilterGender}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="Male">Nam</Option>
                <Option value="Female">Nữ</Option>
                <Option value="Other">Khác</Option>
              </Select>
            </Col>

            <Col xs={24} sm={12} md={8} lg={6}>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
                Khoảng thời gian:
              </label>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </Col>

            <Col xs={24} style={{ textAlign: 'right' }}>
              <Button 
                onClick={handleResetFilters}
                icon={<ClearOutlined />}
              >
                Xóa bộ lọc
              </Button>
            </Col>
          </Row>
        </Card>

        <Table
          columns={columns}
          dataSource={filteredHistory}
          loading={loading}
          rowKey={(record, index) => `${record.createdAt}-${index}`}
          locale={{
            emptyText: searchText || filterRisk !== 'all' || filterGender !== 'all' || dateRange
              ? 'Không tìm thấy kết quả phù hợp với bộ lọc'
              : 'Chưa có lịch sử chuẩn đoán',
          }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            pageSizeOptions: ['5', '10', '20', '50'],
          }}
          scroll={{ x: 1300 }}
        />
      </Card>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 'bold' }}>📋 Chi tiết chuẩn đoán</span>}
        open={modalVisible}
        onCancel={handleCloseModal}
        width="95%"
        style={{ top: 20, maxWidth: 1600 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
        footer={[
          <Button key="close" onClick={handleCloseModal} size="large">
            Đóng
          </Button>,
          <Button
            key="repredict"
            type="primary"
            size="large"
            loading={predicting}
            onClick={handleRePredict}
          >
            Chuẩn đoán lại
          </Button>,
        ]}
      >
        {selectedRecord && (
          <>
            <Card 
              title="Thông tin gốc" 
              size="small" 
              style={{ marginBottom: 16, backgroundColor: '#f0f5ff' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div><strong>Thời gian:</strong> {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</div>
                <div><strong>Mức độ rủi ro:</strong> <Tag color={selectedRecord.prediction === 'High Risk' ? 'red' : selectedRecord.prediction === 'Medium Risk' ? 'orange' : 'green'}>{selectedRecord.prediction}</Tag></div>
                <div><strong>Điểm rủi ro:</strong> <strong style={{ fontSize: 16, color: '#1890ff' }}>{(selectedRecord.strokeRisk * 100).toFixed(2)}%</strong></div>
              </div>
            </Card>

            {/* Display saved algorithm comparison if available */}
            {selectedRecord.models && selectedRecord.models.length > 0 && (
              <Card title="📈 So sánh chi tiết các thuật toán (Lưu trữ)" size="small" style={{ marginBottom: 16 }}>
                <Alert
                  message="Kết quả đã lưu từ lần chuẩn đoán trước"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  size="small"
                  dataSource={selectedRecord.models}
                  rowKey="name"
                  pagination={false}
                  scroll={{ x: 1600 }}
                  expandable={{
                    expandedRowRender: (record) => record.metrics?.confusion_matrix ? (
                      <Card title="Confusion Matrix" size="small" style={{ maxWidth: 600, margin: '0 auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'center' }}>
                          <div style={{ padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{record.metrics.confusion_matrix.TN}</div>
                            <div>True Negative (TN)</div>
                          </div>
                          <div style={{ padding: '16px', backgroundColor: '#fff2e8', borderRadius: '8px' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>{record.metrics.confusion_matrix.FP}</div>
                            <div>False Positive (FP)</div>
                          </div>
                          <div style={{ padding: '16px', backgroundColor: '#fff2e8', borderRadius: '8px' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>{record.metrics.confusion_matrix.FN}</div>
                            <div>False Negative (FN)</div>
                          </div>
                          <div style={{ padding: '16px', backgroundColor: '#f6ffed', borderRadius: '8px' }}>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>{record.metrics.confusion_matrix.TP}</div>
                            <div>True Positive (TP)</div>
                          </div>
                        </div>
                      </Card>
                    ) : null,
                    rowExpandable: (record) => record.metrics?.confusion_matrix !== undefined,
                  }}
                  columns={[
                    { title: 'Thuật toán', dataIndex: 'name', key: 'name', width: 180, fixed: 'left', 
                      render: (name) => <Tag color="blue" style={{ fontSize: 14 }}>{name}</Tag> },
                    { title: 'Risk Score', key: 'riskScore', align: 'center', width: 120,
                      render: (_, r) => <strong style={{ color: '#1890ff' }}>{(r.riskScore * 100).toFixed(2)}%</strong> },
                    { title: 'Risk Level', key: 'riskLevel', align: 'center', width: 120,
                      render: (_, r) => (
                        <Tag color={r.riskLevel === 'High Risk' ? 'red' : r.riskLevel === 'Medium Risk' ? 'orange' : 'green'}>
                          {r.riskLevel}
                        </Tag>
                      )},
                    { title: 'Accuracy', key: 'accuracy', align: 'center', width: 100,
                      render: (_, r) => r.metrics?.accuracy ? `${(r.metrics.accuracy * 100).toFixed(2)}%` : 'N/A' },
                    { title: 'Precision', key: 'precision', align: 'center', width: 100,
                      render: (_, r) => r.metrics?.precision ? `${(r.metrics.precision * 100).toFixed(2)}%` : 'N/A' },
                    { title: 'Recall', key: 'recall', align: 'center', width: 100,
                      render: (_, r) => r.metrics?.recall ? `${(r.metrics.recall * 100).toFixed(2)}%` : 'N/A' },
                    { title: 'F1-Score', key: 'f1', align: 'center', width: 100,
                      render: (_, r) => r.metrics?.f1 ? `${(r.metrics.f1 * 100).toFixed(2)}%` : 'N/A' },
                    { title: 'ROC-AUC', key: 'auc', align: 'center', width: 100,
                      render: (_, r) => r.metrics?.auc ? `${(r.metrics.auc * 100).toFixed(2)}%` : 'N/A' },
                    { title: 'MAE', key: 'mae', align: 'center', width: 90,
                      render: (_, r) => r.metrics?.mae ? r.metrics.mae.toFixed(4) : 'N/A' },
                    { title: 'MSE', key: 'mse', align: 'center', width: 90,
                      render: (_, r) => r.metrics?.mse ? r.metrics.mse.toFixed(4) : 'N/A' },
                  ]}
                />
                <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                  💡 Nhấp vào mỗi hàng để xem Confusion Matrix chi tiết
                </p>
              </Card>
            )}

            {/* Display saved recommendations if available */}
            {selectedRecord.recommendations && selectedRecord.recommendations.length > 0 && (
              <Card 
                title="💡 Khuyến nghị sức khỏe (Lưu trữ)" 
                size="small"
                style={{ marginBottom: 16, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {selectedRecord.recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        padding: '12px 16px', 
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #ffd591',
                        fontSize: 14
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

            <Card title="Chỉnh sửa thông số bệnh nhân" size="small" style={{ marginBottom: 16 }}>
              <Form form={form} layout="vertical">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <Form.Item label="Tên bệnh nhân" name="patientName" rules={[{ required: true, message: 'Vui lòng nhập tên bệnh nhân!' }]}>
                    <Input placeholder="Ví dụ: Nguyễn Văn A" />
                  </Form.Item>

                  <Form.Item 
                    label="Số căn cước công dân" 
                    name="citizenId" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập số CCCD!' },
                      { pattern: /^\d{12}$/, message: 'CCCD phải là 12 chữ số!' }
                    ]}
                  >
                    <Input placeholder="Ví dụ: 001234567890" maxLength={12} />
                  </Form.Item>

                  <Form.Item label="Tuổi" name="age" rules={[{ required: true, message: 'Vui lòng nhập tuổi!' }]}>
                    <InputNumber min={0} max={120} style={{ width: '100%' }} placeholder="Ví dụ: 45" />
                  </Form.Item>

                  <Form.Item label="Giới tính" name="gender" rules={[{ required: true }]}>
                    <Select placeholder="Chọn giới tính">
                      <Option value="Male">Nam</Option>
                      <Option value="Female">Nữ</Option>
                      <Option value="Other">Khác</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Tình trạng hôn nhân" name="everMarried" rules={[{ required: true }]}>
                    <Select placeholder="Chọn">
                      <Option value="Yes">Đã kết hôn</Option>
                      <Option value="No">Chưa kết hôn</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Loại công việc" name="workType" rules={[{ required: true }]}>
                    <Select placeholder="Chọn">
                      <Option value="Private">Tư nhân</Option>
                      <Option value="Self-employed">Tự kinh doanh</Option>
                      <Option value="Govt_job">Công chức</Option>
                      <Option value="children">Trẻ em</Option>
                      <Option value="Never_worked">Chưa từng làm việc</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Nơi cư trú" name="residenceType" rules={[{ required: true }]}>
                    <Select placeholder="Chọn">
                      <Option value="Urban">Thành thị</Option>
                      <Option value="Rural">Nông thôn</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Tình trạng hút thuốc" name="smokingStatus" rules={[{ required: true }]}>
                    <Select placeholder="Chọn">
                      <Option value="never smoked">Không bao giờ hút</Option>
                      <Option value="formerly smoked">Đã từng hút</Option>
                      <Option value="smokes">Đang hút</Option>
                      <Option value="Unknown">Không rõ</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Tăng huyết áp" name="hypertension">
                    <Select placeholder="Chọn">
                      <Option value={false}>Không</Option>
                      <Option value={true}>Có</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Bệnh tim" name="heartDisease">
                    <Select placeholder="Chọn">
                      <Option value={false}>Không</Option>
                      <Option value={true}>Có</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item label="Chỉ số glucose trung bình (mg/dL)" name="avgGlucoseLevel" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 105.2" />
                  </Form.Item>

                  <Form.Item label="Chỉ số BMI" name="bmi" rules={[{ required: true }]}>
                    <InputNumber min={0} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 24.6" />
                  </Form.Item>
                </div>
              </Form>
            </Card>

            {predicting && (
              <Card size="small" style={{ textAlign: 'center', marginBottom: 16 }}>
                <Spin size="large" />
                <p style={{ marginTop: 20, fontSize: 16 }}>Đang phân tích dữ liệu với 4 thuật toán ML...</p>
              </Card>
            )}

            {newResult && !predicting && (
              <>
                <Card 
                  title="📊 Kết quả chuẩn đoán mới" 
                  size="small" 
                  style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <strong>Mức độ rủi ro (trung bình):</strong> 
                      <Tag color={newResult.riskLevel === 'High Risk' ? 'red' : newResult.riskLevel === 'Medium Risk' ? 'orange' : 'green'} style={{ marginLeft: 8, fontSize: 14 }}>
                        {newResult.riskLevel}
                      </Tag>
                    </div>
                    <div>
                      <strong>Điểm rủi ro (trung bình):</strong> 
                      <strong style={{ fontSize: 18, marginLeft: 8, color: '#52c41a' }}>
                        {(newResult.riskScore * 100).toFixed(2)}%
                      </strong>
                    </div>
                  </div>
                </Card>

                {Array.isArray(newResult.models) && newResult.models.length > 0 && (
                  <Card title="📈 So sánh chi tiết từng thuật toán Machine Learning" size="small" style={{ marginBottom: 16 }}>
                    <Alert
                      message={`Kết quả từ ${newResult.models.length} thuật toán`}
                      description="Metrics được tính toán từ test set để đánh giá độ chính xác của từng thuật toán"
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Table
                      pagination={false}
                      size="small"
                      scroll={{ x: 1300 }}
                      dataSource={newResult.models.map((m, idx) => ({ key: idx, ...m }))}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                            <h4 style={{ marginBottom: 12 }}>🔍 Confusion Matrix</h4>
                            {record.metrics?.confusion_matrix ? (
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                                <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f', textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: '#666' }}>True Negative</div>
                                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                                    {record.metrics.confusion_matrix.true_negative}
                                  </div>
                                  <div style={{ fontSize: 11 }}>Dự đoán đúng: Không</div>
                                </Card>
                                <Card size="small" style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591', textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: '#666' }}>False Positive</div>
                                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                                    {record.metrics.confusion_matrix.false_positive}
                                  </div>
                                  <div style={{ fontSize: 11 }}>Dự đoán sai: Không → Có</div>
                                </Card>
                                <Card size="small" style={{ backgroundColor: '#fff7e6', borderColor: '#ffd591', textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: '#666' }}>False Negative</div>
                                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                                    {record.metrics.confusion_matrix.false_negative}
                                  </div>
                                  <div style={{ fontSize: 11 }}>Dự đoán sai: Có → Không</div>
                                </Card>
                                <Card size="small" style={{ backgroundColor: '#fff1f0', borderColor: '#ffa39e', textAlign: 'center' }}>
                                  <div style={{ fontSize: 11, color: '#666' }}>True Positive</div>
                                  <div style={{ fontSize: 24, fontWeight: 'bold', color: '#f5222d' }}>
                                    {record.metrics.confusion_matrix.true_positive}
                                  </div>
                                  <div style={{ fontSize: 11 }}>Dự đoán đúng: Có</div>
                                </Card>
                              </div>
                            ) : <span style={{ color: '#999' }}>Không có dữ liệu</span>}
                          </div>
                        ),
                      }}
                      columns={[
                        { 
                          title: 'Thuật toán', 
                          dataIndex: 'name', 
                          key: 'name',
                          width: 150,
                          fixed: 'left',
                          render: (name) => {
                            const nameMap = {
                              'logistic_regression': 'Logistic Regression',
                              'random_forest': 'Random Forest',
                              'gradient_boosting': 'Gradient Boosting',
                              'knn': 'K-Nearest Neighbors'
                            };
                            return <strong style={{ fontSize: '13px' }}>{nameMap[name] || name}</strong>;
                          }
                        },
                        { 
                          title: 'Rủi ro', 
                          key: 'riskScore',
                          align: 'center',
                          width: 90,
                          render: (_, r) => (
                            <span style={{ fontWeight: 'bold', color: r.riskScore > 0.66 ? '#f5222d' : r.riskScore > 0.33 ? '#fa8c16' : '#52c41a' }}>
                              {(r.riskScore * 100).toFixed(1)}%
                            </span>
                          )
                        },
                        {
                          title: 'Mức độ',
                          dataIndex: 'riskLevel',
                          key: 'riskLevel',
                          align: 'center',
                          width: 80,
                          render: (lvl) => {
                            const colorMap = { 'High Risk': 'red', 'Medium Risk': 'orange', 'Low Risk': 'green' };
                            const labelMap = { 'High Risk': 'Cao', 'Medium Risk': 'TB', 'Low Risk': 'Thấp' };
                            return <Tag color={colorMap[lvl] || 'default'} style={{ margin: 0 }}>{labelMap[lvl] || lvl}</Tag>;
                          },
                        },
                        { 
                          title: 'Accuracy', 
                          key: 'accuracy',
                          align: 'center',
                          width: 90,
                          render: (_, r) => r.metrics?.accuracy ? `${(r.metrics.accuracy * 100).toFixed(1)}%` : 'N/A'
                        },
                        { 
                          title: 'Precision', 
                          key: 'precision',
                          align: 'center',
                          width: 90,
                          render: (_, r) => r.metrics?.precision ? `${(r.metrics.precision * 100).toFixed(1)}%` : 'N/A'
                        },
                        { 
                          title: 'Recall', 
                          key: 'recall',
                          align: 'center',
                          width: 90,
                          render: (_, r) => r.metrics?.recall ? `${(r.metrics.recall * 100).toFixed(1)}%` : 'N/A'
                        },
                        { 
                          title: 'F1', 
                          key: 'f1',
                          align: 'center',
                          width: 80,
                          render: (_, r) => r.metrics?.f1_score ? `${(r.metrics.f1_score * 100).toFixed(1)}%` : 'N/A'
                        },
                        { 
                          title: 'AUC', 
                          key: 'auc',
                          align: 'center',
                          width: 80,
                          render: (_, r) => r.metrics?.roc_auc ? `${(r.metrics.roc_auc * 100).toFixed(1)}%` : 'N/A'
                        },
                        { 
                          title: 'MAE', 
                          key: 'mae',
                          align: 'center',
                          width: 80,
                          render: (_, r) => r.metrics?.mae ? r.metrics.mae.toFixed(3) : 'N/A'
                        },
                        { 
                          title: 'MSE', 
                          key: 'mse',
                          align: 'center',
                          width: 80,
                          render: (_, r) => r.metrics?.mse ? r.metrics.mse.toFixed(3) : 'N/A'
                        },
                      ]}
                    />
                    <p style={{ marginTop: 12, fontSize: '12px', color: '#999', marginBottom: 0 }}>
                      💡 Nhấn vào mỗi hàng để xem Confusion Matrix chi tiết
                    </p>
                  </Card>
                )}

                {newResult.recommendations && newResult.recommendations.length > 0 && (
                  <Card 
                    title="� Khuyến nghị sức khỏe" 
                    size="small"
                    style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      {newResult.recommendations.map((rec, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            padding: '12px 16px', 
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #ffd591',
                            fontSize: 14
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
          </>
        )}
      </Modal>
    </div>
  );
};

export default HistoryPage;
