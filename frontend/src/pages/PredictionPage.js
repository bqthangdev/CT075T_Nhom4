import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, InputNumber, message, Spin, Table, Tag, Tooltip, Alert, Divider, Space } from 'antd';
import { getRiskLabelVi, getRiskColor, getRiskColorByScore } from '../utils/riskUtils';
import { QuestionCircleOutlined, FilePdfOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { downloadBlob, sanitizeFullName, isValidFullName, onlyDigits, isAllSameDigits, convertGlucose, normalizeGlucoseMgDl, GLUCOSE_UNITS } from '../utils/helpers';

const { Option } = Select;

const PredictionPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [patientFormData, setPatientFormData] = useState(null);
  const [requestCount, setRequestCount] = useState(0);
  const [lastRequestTime, setLastRequestTime] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [glucoseUnit, setGlucoseUnit] = useState(GLUCOSE_UNITS.MG_DL);

  const onFinish = async (values) => {
    // Check if blocked
    if (isBlocked) {
      message.warning(`Vui lòng chờ ${cooldownSeconds} giây trước khi thử lại`);
      return;
    }

    const now = Date.now();
    const timeSinceLastRequest = lastRequestTime ? now - lastRequestTime : Infinity;
    
    // Reset count if more than 1 minute has passed
    if (timeSinceLastRequest > 60000) {
      setRequestCount(0);
    }
    
    const newCount = timeSinceLastRequest > 60000 ? 1 : requestCount + 1;
    setRequestCount(newCount);
    setLastRequestTime(now);
    
    // Warning after 3 requests
    if (newCount === 3) {
      message.warning('⚠️ Bạn đang gửi request khá nhanh. Vui lòng chờ giữa các lần chẩn đoán.');
    }
    
    // Block after 10 requests in 1 minute
    if (newCount >= 10) {
      setIsBlocked(true);
      const cooldown = 5; // 5 seconds cooldown
      setCooldownSeconds(cooldown);
      
      message.warning({
        content: 'Vui lòng thực hiện chậm lại',
        duration: 5
      });
      
      // Start countdown
      let remaining = cooldown;
      const countdownInterval = setInterval(() => {
        remaining -= 1;
        setCooldownSeconds(remaining);
        
        if (remaining <= 0) {
          clearInterval(countdownInterval);
          setIsBlocked(false);
          setRequestCount(0);
        }
      }, 1000);
      
      return;
    }

    // Normalize glucose to mg/dL before sending
    const payload = {
      ...values,
      avgGlucoseLevel: normalizeGlucoseMgDl(values.avgGlucoseLevel, glucoseUnit),
    };

    setLoading(true);
    try {
      const response = await api.predictStrokeRisk(payload);
      console.log('[DEBUG] Prediction response:', response.data);
      console.log('[DEBUG] Models array:', response.data.models);
      setResult(response.data);
      // Save normalized data for report generation (backend/report expects mg/dL)
      setPatientFormData(payload);
      message.success('Chẩn đoán thành công!');
    } catch (error) {
      if (error?.response?.status === 429) {
        message.warning('Vui lòng thực hiện chậm lại');
      } else {
        const msg = error?.response?.data?.errors?.join(', ') || error?.response?.data?.error || 'Có lỗi xảy ra khi chẩn đoán';
        message.error(msg);
      }
      console.error('Prediction error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!result || !patientFormData) {
      message.error('Không có dữ liệu để tạo báo cáo');
      return;
    }

    setGeneratingReport(true);
    try {
      const blob = await api.generateReport(patientFormData, result);
      const ok = downloadBlob(blob, `Bao_cao_chan_doan_${new Date().getTime()}.pdf`, 'application/pdf');
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

  return (
    <div style={{ margin: '0 auto', padding: '0 16px' }}>
      {isBlocked && (
        <Alert
          message="Vui lòng thực hiện chậm lại"
          description={`Bạn cần chờ ${cooldownSeconds} giây trước khi thực hiện chẩn đoán tiếp theo.`}
          type="warning"
          showIcon
          banner
          style={{ marginBottom: 16 }}
        />
      )}
      {requestCount >= 8 && !isBlocked && (
        <Alert
          message="⚠️ Cảnh báo: Đang gửi request quá nhanh"
          description={`Bạn đã gửi ${requestCount} request trong 1 phút. Sau 5 request, bạn sẽ phải chờ 5 giây.`}
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      <Card title="Nhập thông tin bệnh nhân" style={{ marginBottom: 20 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* Thông tin cá nhân */}
          <Divider orientation="left" style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
            📋 Thông tin cá nhân
          </Divider>
          <div className="responsive-grid-3">
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
              rules={[
                { required: true, message: 'Vui lòng nhập tên bệnh nhân!' },
                { min: 2, max: 50, message: 'Tên từ 2 đến 50 ký tự' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const ok = isValidFullName(value);
                    return ok ? Promise.resolve() : Promise.reject(new Error('Không chứa ký tự đặc biệt (chỉ chữ, số và khoảng trắng)'));
                  }
                }
              ]}
            >
              <Input
                placeholder="Ví dụ: Nguyễn Văn A"
                allowClear
                maxLength={50}
                showCount
                onBlur={(e) => {
                  const v = sanitizeFullName(e.target.value);
                  form.setFieldsValue({ patientName: v });
                }}
              />
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
                { pattern: /^\d{12}$/, message: 'CCCD phải là 12 chữ số!' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (isAllSameDigits(value)) return Promise.reject(new Error('CCCD không hợp lệ (không được 12 số giống nhau)'));
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input
                placeholder="Ví dụ: 001234567890"
                maxLength={12}
                inputMode="numeric"
                onChange={(e) => {
                  const v = onlyDigits(e.target.value).slice(0, 12);
                  if (v !== e.target.value) {
                    form.setFieldsValue({ citizenId: v });
                  }
                }}
              />
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
              rules={[
                { required: true, message: 'Vui lòng nhập tuổi!' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) return Promise.resolve();
                    return value >= 1 && value <= 120
                      ? Promise.resolve()
                      : Promise.reject(new Error('Tuổi phải từ 1 đến 120'));
                  }
                }
              ]}
            >
              <InputNumber min={1} max={120} style={{ width: '100%' }} placeholder="Ví dụ: 45" />
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
          </div>

          {/* Hồ sơ y tế */}
          <Divider orientation="left" style={{ fontSize: '16px', fontWeight: 'bold', color: '#52c41a', marginTop: '24px' }}>
            🏥 Hồ sơ y tế
          </Divider>
          <div className="responsive-grid-3">
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
              rules={[{ required: true, message: 'Vui lòng chọn!' }]}
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
              rules={[{ required: true, message: 'Vui lòng chọn!' }]}
            >
              <Select placeholder="Chọn tình trạng">
                <Option value={false}>Không</Option>
                <Option value={true}>Có</Option>
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
          </div>

          {/* Chỉ số sức khỏe */}
          <Divider orientation="left" style={{ fontSize: '16px', fontWeight: 'bold', color: '#fa8c16', marginTop: '24px' }}>
            📊 Chỉ số sức khỏe
          </Divider>
          <div className="responsive-grid-3">
            <Form.Item
              label={
                <span>
                  Chỉ số glucose trung bình{' '}
                  <Tooltip title="Có thể nhập theo mg/dL, mmol/L, g/L hoặc mg/L. Hệ thống sẽ tự quy đổi về mg/dL khi chẩn đoán.">
                    <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </span>
              }
              name="avgGlucoseLevel"
              rules={[
                { required: true, message: 'Vui lòng nhập chỉ số glucose!' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) return Promise.resolve();
                    // Validate based on normalized mg/dL
                    const mgdl = normalizeGlucoseMgDl(value, glucoseUnit);
                    return mgdl >= 40 && mgdl <= 400
                      ? Promise.resolve()
                      : Promise.reject(new Error('Giá trị tương đương phải từ 40 đến 400 mg/dL'));
                  }
                }
              ]}
            >
              <Space.Compact style={{ width: '100%' }}>
                <InputNumber 
                  min={0}
                  step={0.1} 
                  style={{ width: '100%' }} 
                  placeholder={glucoseUnit === GLUCOSE_UNITS.MMOL_L ? 'Ví dụ: 5.6' : 'Ví dụ: 105.2'}
                />
                <Select 
                  value={glucoseUnit} 
                  onChange={(unit) => {
                    const prevUnit = glucoseUnit;
                    setGlucoseUnit(unit);
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
              rules={[
                { required: true, message: 'Vui lòng nhập BMI!' },
                {
                  validator: (_, value) => {
                    if (value === undefined || value === null) return Promise.resolve();
                    return value >= 10 && value <= 60
                      ? Promise.resolve()
                      : Promise.reject(new Error('BMI hợp lệ từ 10 đến 60'));
                  }
                }
              ]}
            >
              <InputNumber min={10} max={60} step={0.1} style={{ width: '100%' }} placeholder="Ví dụ: 24.6" />
            </Form.Item>
          </div>

          <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              size="large" 
              block
              disabled={isBlocked}
            >
              {isBlocked ? `Chờ ${cooldownSeconds}s...` : 'Chẩn đoán'}
            </Button>
            {requestCount > 0 && !isBlocked && (
              <div style={{ marginTop: 8, fontSize: 12, textAlign: 'center', color: requestCount >= 10 ? '#ff4d4f' : '#999' }}>
                Số request trong 1 phút: {requestCount}/10
              </div>
            )}
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
            extra={
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                loading={generatingReport}
                onClick={handleGenerateReport}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                <DownloadOutlined /> Xuất báo cáo PDF
              </Button>
            }
          >
            {(() => {
              // Tìm kết quả của Decision Tree - model tốt nhất (accuracy 67.5%)
              const dtResult = result.models?.find(m => m.name === 'Decision Tree');
              const displayRiskScore = dtResult ? dtResult.riskScore : result.riskScore;
              const displayRiskLevel = dtResult ? dtResult.riskLevel : result.riskLevel;
              
              return (
                <>
                  <div className="responsive-grid-2">
                    <div>
                      <strong style={{ fontSize: 16 }}>Mức độ rủi ro:</strong>
                      <Tag 
                        color={getRiskColor(displayRiskLevel)} 
                        style={{ marginLeft: 12, fontSize: 16, padding: '4px 16px' }}
                      >
                        {getRiskLabelVi(displayRiskLevel)}
                      </Tag>
                    </div>
                    <div>
                      <strong style={{ fontSize: 16 }}>Điểm rủi ro:</strong>
                      <span style={{ marginLeft: 12, fontSize: 20, fontWeight: 'bold', color: getRiskColorByScore(displayRiskScore) }}>
                        {(displayRiskScore * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                  
                  {/* Classification Result */}
                  {result.classificationResult && (
                    <Alert
                      message="Kết quả phân loại (Classification)"
                      description={
                        <span>
                          Hệ thống đánh giá: <strong style={{ fontSize: 16, color: result.predictedClass === 1 ? '#ff4d4f' : '#52c41a' }}>
                            {result.classificationResult}
                          </strong>
                          {result.predictedClass === 1 ? ' - Khuyến nghị kiểm tra và theo dõi sức khỏe.' : ' - Tiếp tục duy trì lối sống lành mạnh.'}
                        </span>
                      }
                      type={result.predictedClass === 1 ? 'warning' : 'success'}
                      showIcon
                      style={{ marginBottom: 16, marginTop: 16 }}
                    />
                  )}
                  
                  <Alert
                    message="Chẩn đoán từ thuật toán tốt nhất (Decision Tree)"
                    description={`Kết quả này từ Decision Tree - model có accuracy thực tế cao nhất (67.5% trên 40 test cases). Phát hiện HIGH risk chính xác 92.44%. Decision Tree được chọn làm model chính vì không underprediction như SVM/KNN. Xem bảng dưới để so sánh với các thuật toán khác.`}
                    type="success"
                    showIcon
                    style={{ marginTop: 16 }}
                  />
                </>
              );
            })()}
          </Card>

          {Array.isArray(result.models) && result.models.length > 0 && (
            <Card title="📈 So sánh chi tiết các thuật toán Machine Learning" style={{ marginTop: 20 }}>
              <Alert
                message={`So sánh ${result.models.length} thuật toán khác nhau`}
                description="Các thuật toán Machine Learning có chiến lược dự đoán khác nhau. Dữ liệu này giúp bạn tham khảo và so sánh kết quả giữa các model. SVM thường đáng tin cậy nhất cho dữ liệu y tế imbalanced."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                pagination={false}
                scroll={{ x: 600 }}
                size="small"
                dataSource={result.models
                  .map((m, idx) => ({ key: idx, ...m }))}
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
                    width: 250,
                    fixed: 'left',
                    render: (name) => {
                      // name đã là display name từ backend (ví dụ: "Support Vector Machine (SVM)")
                      return (
                        <div>
                          <strong>{name}</strong>
                        </div>
                      );
                    }
                  },
                  { 
                    title: 'Điểm rủi ro', 
                    key: 'riskScore', 
                    align: 'center',
                    width: 150,
                    render: (_, r) => (
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: getRiskColorByScore(r.riskScore) }}>
                        {(r.riskScore * 100).toFixed(2)}%
                      </span>
                    )
                  },
                  { 
                    title: 'Mức độ rủi ro', 
                    dataIndex: 'riskLevel', 
                    key: 'riskLevel',
                    align: 'center',
                    width: 150,
                    render: (lvl) => {
                      return <Tag color={getRiskColor(lvl)} style={{ fontSize: '14px', padding: '4px 12px' }}>{getRiskLabelVi(lvl)}</Tag>;
                    }
                  },
                  { 
                    title: 'Đánh giá', 
                    dataIndex: 'name', 
                    key: 'evaluation',
                    align: 'center',
                    width: 150,
                    render: (name) => {
                      // name đã là display name, kiểm tra nếu chứa "Decision Tree"
                      if (name && name.includes('Decision Tree')) {
                        return <Tag color="green" style={{ fontSize: '13px', padding: '4px 12px' }}>⭐ Tốt nhất</Tag>;
                      }
                      return <Tag color="default" style={{ fontSize: '13px' }}>Tham khảo</Tag>;
                    }
                  },
                ]}
              />
              <p style={{ marginTop: 12, fontSize: '12px', color: '#999' }}>
                💡 Nhấp vào mỗi hàng để xem thông tin chi tiết
              </p>
            </Card>
          )}

          {result.recommendations && result.recommendations.length > 0 && (
            <Card 
              title="💡 Khuyến nghị" 
              style={{ marginTop: 20, backgroundColor: '#fffbe6', borderColor: '#ffe58f' }}
            >
              <div className="responsive-grid-2">
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
