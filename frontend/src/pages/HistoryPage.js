import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, message, Button, Modal, Form, InputNumber, Select, Tag, Spin, Popconfirm, Space, Divider, Alert, Input, DatePicker, Row, Col, Tooltip } from 'antd';
import { getRiskLabelVi, getRiskColor, getRiskColorByScore } from '../utils/riskUtils';
import { EyeOutlined, DeleteOutlined, ClearOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, FilePdfOutlined, SwapOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import api from '../services/api';
import { downloadBlob, convertGlucose, GLUCOSE_UNITS, normalizeGlucoseMgDl } from '../utils/helpers';

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
  const [generatingReport, setGeneratingReport] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);

  // Glucose unit state for modal form
  const [modalGlucoseUnit, setModalGlucoseUnit] = useState(GLUCOSE_UNITS.MG_DL);

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

  // Ensure current page is valid when filtered data changes
  useEffect(() => {
    const total = filteredHistory.length;
    const maxPage = Math.max(1, Math.ceil(total / pagination.pageSize));
    if (pagination.current > maxPage) {
      setPagination((p) => ({ ...p, current: 1 }));
    }
  }, [filteredHistory, pagination.pageSize]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await api.getPredictionHistory();
      setHistory(response.data);
      setFilteredHistory(response.data);
    } catch (error) {
      message.error('Không thể tải lịch sử chẩn đoán');
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
      link.setAttribute('download', `lich-su-chan-doan-${new Date().toISOString().split('T')[0]}.csv`);
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
    setModalGlucoseUnit(GLUCOSE_UNITS.MG_DL); // Start with mg/dL (data is stored in mg/dL)
    
    // Set form values - glucose is already in mg/dL from backend
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
      avgGlucoseLevel: record.avgGlucoseLevel, // This is in mg/dL
      bmi: record.bmi,
    });
    
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedRecord(null);
    setNewResult(null);
    form.resetFields();
    setModalGlucoseUnit(GLUCOSE_UNITS.MG_DL); // Reset unit
  };

  const handleRePredict = async () => {
    try {
      const values = await form.validateFields();
      setPredicting(true);
      
      // Normalize glucose to mg/dL before sending
      const payload = {
        ...values,
        avgGlucoseLevel: normalizeGlucoseMgDl(values.avgGlucoseLevel, modalGlucoseUnit),
      };
      
      const response = await api.predictStrokeRisk(payload);
      setNewResult(response.data);
      
      // Reload history to update the table with new record
      await fetchHistory();
      
      message.success('Chẩn đoán lại thành công! Bản ghi mới đã được thêm vào lịch sử.');
    } catch (error) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra lại thông tin!');
      } else if (error?.response?.status === 429) {
        message.warning('Vui lòng thực hiện chậm lại');
      } else {
        message.error('Có lỗi xảy ra khi chẩn đoán');
        console.error('Re-predict error:', error);
      }
    } finally {
      setPredicting(false);
    }
  };

  const handleGenerateReport = async (record) => {
    if (!record) {
      message.error('Không có dữ liệu để tạo báo cáo');
      return;
    }

    setGeneratingReport(true);
    try {
      // Prepare patient data from history record
      const patientData = {
        patientName: record.patientName || 'N/A',
        // Ensure CCCD is included; prefer citizenId, fallback to patientId
        citizenId: record.citizenId || record.patientId || 'N/A',
        // Keep legacy field for backward compatibility
        patientId: record.patientId || record.citizenId || 'N/A',
        age: record.age,
        gender: record.gender,
        hypertension: record.hypertension,
        heartDisease: record.heartDisease,
        everMarried: record.everMarried,
        workType: record.workType,
        residenceType: record.residenceType,
        avgGlucoseLevel: record.avgGlucoseLevel,
        bmi: record.bmi,
        smokingStatus: record.smokingStatus
      };

      const predictionResult = {
        riskScore: record.strokeRisk,
        riskLevel: record.prediction,
        models: record.models || [],
        recommendations: record.recommendations || []
      };

      const blob = await api.generateReport(patientData, predictionResult);
      const ok = downloadBlob(blob, `Bao_cao_chan_doan_${record.patientName || 'patient'}_${new Date().getTime()}.pdf`, 'application/pdf');
      if (!ok) throw new Error('Download failed');
      
      message.success('Đã tải xuống báo cáo PDF thành công!');
    } catch (error) {
      if (error?.response?.status === 429) {
        message.warning('Vui lòng thực hiện chậm lại');
      } else {
        message.error('Có lỗi xảy ra khi tạo báo cáo');
      }
      console.error('Report generation error:', error);
    } finally {
      setGeneratingReport(false);
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
      setSelectedRowKeys([]);
    } catch (error) {
      message.error('Không thể xóa lịch sử');
      console.error('Clear all error:', error);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Vui lòng chọn ít nhất một bản ghi để xóa');
      return;
    }

    setDeletingMultiple(true);
    try {
      // Convert selected keys to indices in the original history array
      const indicesToDelete = selectedRowKeys.map(key => {
        const record = filteredHistory.find((_, idx) => `${filteredHistory[idx].createdAt}-${idx}` === key);
        return history.findIndex(h => h.createdAt === record?.createdAt);
      }).filter(idx => idx !== -1);

      await api.deleteMultipleHistory(indicesToDelete);
      message.success(`Đã xóa ${selectedRowKeys.length} bản ghi thành công!`);
      setSelectedRowKeys([]);
      await fetchHistory();
    } catch (error) {
      message.error('Không thể xóa các bản ghi đã chọn');
      console.error('Delete multiple error:', error);
    } finally {
      setDeletingMultiple(false);
    }
  };

  const columns = [
    {
      title: 'STT',
      key: 'index',
      width: 60,
      fixed: 'left',
      align: 'center',
      render: (_, __, index) => (pagination.pageSize * (pagination.current - 1)) + index + 1,
      responsive: ['sm'],
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date) => new Date(date).toLocaleString('vi-VN'),
      responsive: ['md'],
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
      responsive: ['lg'],
    },
    {
      title: 'Tuổi',
      dataIndex: 'age',
      key: 'age',
      width: 70,
      align: 'center',
      responsive: ['md'],
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
      },
      responsive: ['lg'],
    },
    {
      title: 'Mức độ rủi ro',
      dataIndex: 'prediction',
      key: 'prediction',
      width: 140,
      align: 'center',
      render: (prediction) => (
        <Tag color={getRiskColor(prediction)}>{getRiskLabelVi(prediction)}</Tag>
      ),
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
        return <span style={{ fontWeight: 'bold', color: getRiskColorByScore(risk) }}>{percentage}%</span>;
      },
      responsive: ['md'],
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, record, index) => (
        <Space size="small" direction="horizontal">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
            className="action-btn"
            title="Chi tiết"
          >
            <span className="btn-text">Chi tiết</span>
          </Button>
          <Button
            type="default"
            size="small"
            icon={<FilePdfOutlined />}
            onClick={() => handleGenerateReport(record)}
            loading={generatingReport}
            style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }}
            className="action-btn"
            title="Tải PDF"
          >
            <span className="btn-text">PDF</span>
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
              className="action-btn"
              title="Xóa"
            >
              <span className="btn-text">Xóa</span>
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    selections: [
      {
        key: 'all',
        text: 'Chọn tất cả',
        onSelect: (changeableRowKeys) => {
          setSelectedRowKeys(changeableRowKeys);
        },
      },
      {
        key: 'invert',
        text: 'Đảo ngược lựa chọn',
        onSelect: (changeableRowKeys) => {
          const newKeys = changeableRowKeys.filter(key => !selectedRowKeys.includes(key));
          const oldKeys = selectedRowKeys.filter(key => !changeableRowKeys.includes(key));
          setSelectedRowKeys([...newKeys, ...oldKeys]);
        },
      },
      {
        key: 'none',
        text: 'Bỏ chọn tất cả',
        onSelect: () => {
          setSelectedRowKeys([]);
        },
      },
    ],
  };

  return (
    <div style={{ margin: '0 auto', padding: '0 16px' }}>
      <Card 
        title="📋 Lịch sử chẩn đoán" 
        extra={
          <Space wrap size="small" className='first-full-width'>
            <Tag color="blue"  style={{ fontSize: 14, padding: '4px 12px' }}>
              Hiển thị: {filteredHistory.length} / {history.length} bản ghi
            </Tag>
            {selectedRowKeys.length > 0 && (
              <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                Đã chọn: {selectedRowKeys.length}
              </Tag>
            )}
            {selectedRowKeys.length > 0 && (
              <Popconfirm
                title="Xóa các bản ghi đã chọn?"
                description={`Bạn có chắc chắn muốn xóa ${selectedRowKeys.length} bản ghi đã chọn?`}
                onConfirm={handleDeleteSelected}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  loading={deletingMultiple}
                  size="small"
                >
                  <span className="btn-text">Xóa đã chọn</span>
                </Button>
              </Popconfirm>
            )}
            {filteredHistory.length > 0 && (
              <Button 
                type="primary" 
                icon={<DownloadOutlined />}
                onClick={handleExportCSV}
                size="small"
              >
                <span className="btn-text">Xuất CSV</span>
              </Button>
            )}
            {history.length > 0 && (
              <Popconfirm
                title="Xóa toàn bộ lịch sử?"
                description="Bạn có chắc chắn muốn xóa TẤT CẢ lịch sử chẩn đoán? Hành động này không thể hoàn tác!"
                onConfirm={handleClearAll}
                okText="Xóa tất cả"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Button danger icon={<ClearOutlined />} size="small">
                  <span className="btn-text">Xóa tất cả</span>
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
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#52c41a' }}>
                    {filteredHistory.filter(h => h.prediction === 'Low Risk').length}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Thấp</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#faad14' }}>
                    {filteredHistory.filter(h => h.prediction === 'Medium Risk').length}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Trung bình</div>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 'bold', color: '#ff4d4f' }}>
                    {filteredHistory.filter(h => h.prediction === 'High Risk').length}
                  </div>
                  <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>Cao</div>
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
                <Option value="Low Risk">Thấp</Option>
                <Option value="Medium Risk">Trung bình</Option>
                <Option value="High Risk">Cao</Option>
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
          rowSelection={rowSelection}
          columns={columns}
          dataSource={filteredHistory}
          loading={loading}
          rowKey={(record, index) => `${record.createdAt}-${index}`}
          locale={{
            emptyText: searchText || filterRisk !== 'all' || filterGender !== 'all' || dateRange
              ? 'Không tìm thấy kết quả phù hợp với bộ lọc'
              : 'Chưa có lịch sử chẩn đoán',
          }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: filteredHistory.length,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} bản ghi`,
            pageSizeOptions: ['5', '10', '20', '50'],
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
            onShowSizeChange: (_, size) => setPagination({ current: 1, pageSize: size }),
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <Modal
        title={<span style={{ fontSize: 18, fontWeight: 'bold' }}>📋 Chi tiết chẩn đoán</span>}
        open={modalVisible}
        onCancel={handleCloseModal}
        width="95%"
        style={{ top: 20 }}
        bodyStyle={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: 'clamp(12px, 2vw, 24px)' }}
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
            Chẩn đoán lại
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
              <div className="responsive-grid-3">
                <div><strong>Thời gian:</strong> {new Date(selectedRecord.createdAt).toLocaleString('vi-VN')}</div>
                <div>
                  <strong>Mức độ rủi ro:</strong> <Tag color={getRiskColor(selectedRecord.prediction)}>{getRiskLabelVi(selectedRecord.prediction)}</Tag>
                </div>
                <div><strong>Điểm rủi ro:</strong> <strong style={{ fontSize: 16, color: '#1890ff' }}>{(selectedRecord.strokeRisk * 100).toFixed(2)}%</strong></div>
              </div>
            </Card>

            {/* Display saved algorithm comparison if available */}
            {selectedRecord.models && selectedRecord.models.length > 0 && (
              <Card title="📈 So sánh chi tiết các thuật toán (Lưu trữ)" size="small" style={{ marginBottom: 16 }}>
                <Alert
                  message="Kết quả đã lưu từ lần chẩn đoán trước"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                <Table
                  size="small"
                  dataSource={selectedRecord.models}
                  rowKey="name"
                  pagination={false}
                  scroll={{ x: 600 }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                        <Alert
                          message="Thông tin thuật toán"
                          description={`${record.name} đã dự đoán xác suất đột quỵ là ${(record.riskScore * 100).toFixed(2)}% cho bệnh nhân này.`}
                          type="info"
                          showIcon
                        />
                      </div>
                    ),
                  }}
                  columns={[
                    { title: 'Thuật toán', dataIndex: 'name', key: 'name', width: 200, fixed: 'left', 
                      render: (name) => <Tag color="blue" style={{ fontSize: 14 }}>{name}</Tag> },
                    { title: 'Rủi ro', key: 'riskScore', align: 'center', width: 150,
                      render: (_, r) => <strong style={{ color: getRiskColorByScore(r.riskScore), fontSize: '16px' }}>{(r.riskScore * 100).toFixed(2)}%</strong> },
                    { title: 'Mức độ', key: 'riskLevel', align: 'center', width: 150,
                      render: (_, r) => (
                        <Tag color={getRiskColor(r.riskLevel)} style={{ fontSize: '14px', padding: '4px 12px' }}>{getRiskLabelVi(r.riskLevel)}</Tag>
                      )},
                  ]}
                />
                <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                  💡 Nhấp vào mỗi hàng để xem thông tin chi tiết
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
                <div className="responsive-grid-2">
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

            {/* Quick Converter Tool - REMOVED, now integrated in form field */}

            <Card title="Chỉnh sửa thông số bệnh nhân" size="small" style={{ marginBottom: 16 }}>
              <Form form={form} layout="vertical">
                {/* Thông tin cá nhân */}
                <Divider orientation="left" style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
                  📋 Thông tin cá nhân
                </Divider>
                <div className="responsive-grid-3">
                  <Form.Item 
                    label="Tên bệnh nhân" 
                    name="patientName" 
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên bệnh nhân!' },
                      { max: 50, message: 'Tên tối đa 50 ký tự' }
                    ]}
                  > 
                    <Input placeholder="Ví dụ: Nguyễn Văn A" allowClear maxLength={50} showCount />
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
                    <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="Ví dụ: 45" />
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
                </div>

                {/* Hồ sơ y tế */}
                <Divider orientation="left" style={{ fontSize: '14px', fontWeight: 'bold', color: '#52c41a', marginTop: '24px' }}>
                  🏥 Hồ sơ y tế
                </Divider>
                <div className="responsive-grid-3">
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

                  <Form.Item label="Tình trạng hút thuốc" name="smokingStatus" rules={[{ required: true }]}>
                    <Select placeholder="Chọn">
                      <Option value="never smoked">Không bao giờ hút</Option>
                      <Option value="formerly smoked">Đã từng hút</Option>
                      <Option value="smokes">Đang hút</Option>
                      <Option value="Unknown">Không rõ</Option>
                    </Select>
                  </Form.Item>
                </div>

                {/* Chỉ số sức khỏe */}
                <Divider orientation="left" style={{ fontSize: '14px', fontWeight: 'bold', color: '#fa8c16', marginTop: '24px' }}>
                  📊 Chỉ số sức khỏe
                </Divider>
                <div className="responsive-grid-3">
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>
                      <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>
                      Chỉ số glucose trung bình{' '}
                      <Tooltip title="Có thể nhập theo mg/dL, mmol/L, g/L hoặc mg/L. Hệ thống sẽ tự quy đổi về mg/dL khi chẩn đoán.">
                        <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                      </Tooltip>
                    </label>
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item 
                        name="avgGlucoseLevel" 
                        rules={[
                          { required: true, message: 'Vui lòng nhập chỉ số glucose!' },
                          {
                            validator: (_, value) => {
                              if (value === undefined || value === null) return Promise.resolve();
                              // Validate based on normalized mg/dL
                              const mgdl = normalizeGlucoseMgDl(value, modalGlucoseUnit);
                              return mgdl >= 40 && mgdl <= 400
                                ? Promise.resolve()
                                : Promise.reject(new Error('Giá trị tương đương phải từ 40 đến 400 mg/dL'));
                            }
                          }
                        ]}
                        style={{ marginBottom: 0, flex: 1 }}
                        noStyle
                      > 
                        <InputNumber 
                          min={0}
                          step={0.1} 
                          style={{ width: '100%' }} 
                          placeholder={modalGlucoseUnit === GLUCOSE_UNITS.MMOL_L ? 'Ví dụ: 5.6' : 'Ví dụ: 105.2'}
                        />
                      </Form.Item>
                      <Select 
                        value={modalGlucoseUnit} 
                        onChange={(unit) => {
                          const prevUnit = modalGlucoseUnit;
                          setModalGlucoseUnit(unit);
                          const current = form.getFieldValue('avgGlucoseLevel');
                          if (current !== undefined && current !== null && current !== '') {
                            const converted = convertGlucose(current, prevUnit, unit, 1);
                            form.setFieldsValue({ avgGlucoseLevel: converted });
                          }
                        }}
                        style={{ width: 120 }}
                      >
                        <Option value={GLUCOSE_UNITS.MG_DL}>mg/dL</Option>
                        <Option value={GLUCOSE_UNITS.MMOL_L}>mmol/L</Option>
                        <Option value={GLUCOSE_UNITS.G_L}>g/L</Option>
                        <Option value={GLUCOSE_UNITS.MG_L}>mg/L</Option>
                      </Select>
                    </Space.Compact>
                  </div>

                  <Form.Item label="Chỉ số BMI" name="bmi" rules={[{ required: true }]}> 
                    <InputNumber min={10} max={60} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 24.6" />
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
                  title="📊 Kết quả chẩn đoán mới" 
                  size="small" 
                  style={{ marginBottom: 16, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
                >
                  <div className="responsive-grid-2">
                    <div>
                      <strong>Mức độ rủi ro:</strong> 
                      <Tag color={newResult.riskLevel === 'High Risk' ? 'red' : newResult.riskLevel === 'Medium Risk' ? 'orange' : 'green'} style={{ marginLeft: 8, fontSize: 14 }}>
                        {newResult.riskLevel}
                      </Tag>
                    </div>
                    <div>
                      <strong>Điểm rủi ro:</strong> 
                      <strong style={{ fontSize: 18, marginLeft: 8, color: '#52c41a' }}>
                        {(newResult.riskScore * 100).toFixed(2)}%
                      </strong>
                    </div>
                  </div>
                  <Alert
                    message="Chẩn đoán từ thuật toán đáng tin cậy nhất"
                    description="Kết quả dựa trên Logistic Regression với class_weight='balanced'"
                    type="success"
                    showIcon
                    style={{ marginTop: 12, fontSize: 12 }}
                  />
                </Card>

                {Array.isArray(newResult.models) && newResult.models.length > 0 && (
                  <Card title="📈 So sánh chi tiết từng thuật toán Machine Learning" size="small" style={{ marginBottom: 16 }}>
                    <Alert
                      message={`So sánh ${newResult.models.length} thuật toán khác nhau`}
                      description="Các thuật toán có chiến lược dự đoán khác nhau. Dữ liệu này để tham khảo và so sánh giữa các model."
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    <Table
                      pagination={false}
                      size="small"
                      scroll={{ x: 600 }}
                      dataSource={newResult.models.map((m, idx) => ({ key: idx, ...m }))}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                            <Alert
                              message="Thông tin thuật toán"
                              description={`${record.name} đã dự đoán xác suất đột quỵ là ${(record.riskScore * 100).toFixed(2)}% cho bệnh nhân này.`}
                              type="info"
                              showIcon
                            />
                          </div>
                        ),
                      }}
                      columns={[
                        { 
                          title: 'Thuật toán', 
                          dataIndex: 'name', 
                          key: 'name',
                          width: 200,
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
                          width: 150,
                          render: (_, r) => (
                            <span style={{ fontWeight: 'bold', fontSize: '16px', color: getRiskColorByScore(r.riskScore) }}>
                              {(r.riskScore * 100).toFixed(1)}%
                            </span>
                          )
                        },
                        {
                          title: 'Mức độ',
                          dataIndex: 'riskLevel',
                          key: 'riskLevel',
                          align: 'center',
                          width: 150,
                          render: (lvl) => (
                            <Tag color={getRiskColor(lvl)} style={{ fontSize: '14px', padding: '4px 12px' }}>{getRiskLabelVi(lvl)}</Tag>
                          ),
                        },
                      ]}
                    />
                    <p style={{ marginTop: 12, fontSize: '12px', color: '#999', marginBottom: 0 }}>
                      💡 Nhấn vào mỗi hàng để xem thông tin chi tiết
                    </p>
                  </Card>
                )}

                {newResult.recommendations && newResult.recommendations.length > 0 && (
                  <Card 
                    title="� Khuyến nghị sức khỏe" 
                    size="small"
                    style={{ backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
                  >
                    <div className="responsive-grid-2">
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
