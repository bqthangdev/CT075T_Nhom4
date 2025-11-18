import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Row, Col, Alert, Divider, Select, Space, Table, Tag } from 'antd';
import { SwapOutlined, ReloadOutlined } from '@ant-design/icons';
import { convertGlucose, GLUCOSE_UNITS } from '../utils/helpers';

const { Option } = Select;

const UnitConverterPage = () => {
  const [glucoseForm] = Form.useForm();
  const [weightForm] = Form.useForm();
  const [heightForm] = Form.useForm();
  const [tempForm] = Form.useForm();

  // Glucose state
  const [glucoseValue, setGlucoseValue] = useState(100);
  const [glucoseFromUnit, setGlucoseFromUnit] = useState(GLUCOSE_UNITS.MG_DL);
  const [glucoseToUnit, setGlucoseToUnit] = useState(GLUCOSE_UNITS.MMOL_L);

  // Weight state
  const [weightValue, setWeightValue] = useState(70);
  const [weightFromUnit, setWeightFromUnit] = useState('kg');
  const [weightToUnit, setWeightToUnit] = useState('lb');

  // Height state
  const [heightValue, setHeightValue] = useState(170);
  const [heightFromUnit, setHeightFromUnit] = useState('cm');
  const [heightToUnit, setHeightToUnit] = useState('inch');

  // Temperature state
  const [tempValue, setTempValue] = useState(37);
  const [tempFromUnit, setTempFromUnit] = useState('C');
  const [tempToUnit, setTempToUnit] = useState('F');

  // === CONVERSION FUNCTIONS ===

  const convertWeight = (value, from, to) => {
    if (!value || isNaN(value)) return 0;
    const kg = from === 'kg' ? value : value * 0.453592; // lb to kg
    return to === 'kg' ? kg : kg * 2.20462; // kg to lb
  };

  const convertHeight = (value, from, to) => {
    if (!value || isNaN(value)) return 0;
    const cm = from === 'cm' ? value : value * 2.54; // inch to cm
    return to === 'cm' ? cm : cm / 2.54; // cm to inch
  };

  const convertTemperature = (value, from, to) => {
    if (!value || isNaN(value)) return 0;
    if (from === to) return value;
    if (from === 'C' && to === 'F') return (value * 9/5) + 32;
    if (from === 'F' && to === 'C') return (value - 32) * 5/9;
    return value;
  };

  // === GLUCOSE ===
  const handleGlucoseConvert = () => {
    const result = convertGlucose(glucoseValue, glucoseFromUnit, glucoseToUnit, 2);
    glucoseForm.setFieldsValue({ result });
  };

  const handleGlucoseReset = () => {
    setGlucoseValue(100);
    setGlucoseFromUnit(GLUCOSE_UNITS.MG_DL);
    setGlucoseToUnit(GLUCOSE_UNITS.MMOL_L);
    glucoseForm.resetFields();
  };

  const handleGlucoseSwap = () => {
    setGlucoseFromUnit(glucoseToUnit);
    setGlucoseToUnit(glucoseFromUnit);
  };

  // === WEIGHT ===
  const handleWeightConvert = () => {
    const result = convertWeight(weightValue, weightFromUnit, weightToUnit);
    weightForm.setFieldsValue({ result: result.toFixed(2) });
  };

  const handleWeightReset = () => {
    setWeightValue(70);
    setWeightFromUnit('kg');
    setWeightToUnit('lb');
    weightForm.resetFields();
  };

  const handleWeightSwap = () => {
    setWeightFromUnit(weightToUnit);
    setWeightToUnit(weightFromUnit);
  };

  // === HEIGHT ===
  const handleHeightConvert = () => {
    const result = convertHeight(heightValue, heightFromUnit, heightToUnit);
    heightForm.setFieldsValue({ result: result.toFixed(2) });
  };

  const handleHeightReset = () => {
    setHeightValue(170);
    setHeightFromUnit('cm');
    setHeightToUnit('inch');
    heightForm.resetFields();
  };

  const handleHeightSwap = () => {
    setHeightFromUnit(heightToUnit);
    setHeightToUnit(heightFromUnit);
  };

  // === TEMPERATURE ===
  const handleTempConvert = () => {
    const result = convertTemperature(tempValue, tempFromUnit, tempToUnit);
    tempForm.setFieldsValue({ result: result.toFixed(2) });
  };

  const handleTempReset = () => {
    setTempValue(37);
    setTempFromUnit('C');
    setTempToUnit('F');
    tempForm.resetFields();
  };

  const handleTempSwap = () => {
    setTempFromUnit(tempToUnit);
    setTempToUnit(tempFromUnit);
  };

  // === REFERENCE TABLES ===
  const glucoseRefData = [
    { key: '1', condition: 'Bình thường (đói)', mgdl: '70-100', mmoll: '3.9-5.6' },
    { key: '2', condition: 'Tiền tiểu đường', mgdl: '100-125', mmoll: '5.6-6.9' },
    { key: '3', condition: 'Tiểu đường', mgdl: '≥126', mmoll: '≥7.0' },
    { key: '4', condition: 'Sau ăn 2h (bình thường)', mgdl: '<140', mmoll: '<7.8' },
  ];

  const weightRefData = [
    { key: '1', category: 'Cân nặng lý tưởng (Nam)', kg: '60-80', lb: '132-176' },
    { key: '2', category: 'Cân nặng lý tưởng (Nữ)', kg: '50-65', lb: '110-143' },
    { key: '3', category: 'Cân nặng trẻ sơ sinh', kg: '2.5-4.0', lb: '5.5-8.8' },
  ];

  const tempRefData = [
    { key: '1', condition: 'Nhiệt độ cơ thể bình thường', celsius: '36.5-37.5', fahrenheit: '97.7-99.5' },
    { key: '2', condition: 'Sốt nhẹ', celsius: '37.5-38.0', fahrenheit: '99.5-100.4' },
    { key: '3', condition: 'Sốt cao', celsius: '>38.0', fahrenheit: '>100.4' },
  ];

  return (
    <div style={{ margin: '0 auto', padding: '0 clamp(12px, 2vw, 24px)' }}>
      <Card 
        title={
          <span>
            <SwapOutlined style={{ marginRight: 8 }} />
            Công cụ quy đổi đơn vị y tế
          </span>
        }
      >
        <Alert
          message="Quy đổi đơn vị nhanh chóng"
          description="Công cụ này giúp bạn quy đổi các đơn vị y tế thường dùng như glucose, cân nặng, chiều cao và nhiệt độ."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* === GLUCOSE CONVERTER === */}
        <Card 
          title="🩸 Quy đổi chỉ số Glucose" 
          size="small" 
          style={{ marginBottom: 24, backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form form={glucoseForm} layout="vertical">
                <Form.Item label="Giá trị">
                  <InputNumber
                    value={glucoseValue}
                    onChange={setGlucoseValue}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                  />
                </Form.Item>

                <Form.Item label="Từ đơn vị">
                  <Select value={glucoseFromUnit} onChange={setGlucoseFromUnit} style={{ width: '100%' }}>
                    <Option value={GLUCOSE_UNITS.MG_DL}>mg/dL</Option>
                    <Option value={GLUCOSE_UNITS.MMOL_L}>mmol/L</Option>
                    <Option value={GLUCOSE_UNITS.G_L}>g/L</Option>
                    <Option value={GLUCOSE_UNITS.MG_L}>mg/L</Option>
                  </Select>
                </Form.Item>

                <Button 
                  icon={<SwapOutlined />} 
                  onClick={handleGlucoseSwap}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Đảo ngược
                </Button>

                <Form.Item label="Sang đơn vị">
                  <Select value={glucoseToUnit} onChange={setGlucoseToUnit} style={{ width: '100%' }}>
                    <Option value={GLUCOSE_UNITS.MG_DL}>mg/dL</Option>
                    <Option value={GLUCOSE_UNITS.MMOL_L}>mmol/L</Option>
                    <Option value={GLUCOSE_UNITS.G_L}>g/L</Option>
                    <Option value={GLUCOSE_UNITS.MG_L}>mg/L</Option>
                  </Select>
                </Form.Item>

                <Space style={{ width: '100%' }}>
                  <Button type="primary" onClick={handleGlucoseConvert} icon={<SwapOutlined />}>
                    Quy đổi
                  </Button>
                  <Button onClick={handleGlucoseReset} icon={<ReloadOutlined />}>
                    Làm mới
                  </Button>
                </Space>
              </Form>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small" style={{ backgroundColor: '#fff', minHeight: 300 }}>
                <Form.Item label="Kết quả">
                  <Form form={glucoseForm}>
                    <Form.Item name="result">
                      <InputNumber 
                        style={{ width: '100%', fontSize: 24, fontWeight: 'bold' }} 
                        readOnly 
                        bordered={false}
                      />
                    </Form.Item>
                  </Form>
                </Form.Item>
                <Divider />
                <Table
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Tình trạng', dataIndex: 'condition', key: 'condition' },
                    { title: 'mg/dL', dataIndex: 'mgdl', key: 'mgdl', align: 'center' },
                    { title: 'mmol/L', dataIndex: 'mmoll', key: 'mmoll', align: 'center' },
                  ]}
                  dataSource={glucoseRefData}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* === WEIGHT CONVERTER === */}
        <Card 
          title="⚖️ Quy đổi Cân nặng" 
          size="small" 
          style={{ marginBottom: 24, backgroundColor: '#e6f7ff', borderColor: '#91d5ff' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form form={weightForm} layout="vertical">
                <Form.Item label="Giá trị">
                  <InputNumber
                    value={weightValue}
                    onChange={setWeightValue}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                  />
                </Form.Item>

                <Form.Item label="Từ đơn vị">
                  <Select value={weightFromUnit} onChange={setWeightFromUnit} style={{ width: '100%' }}>
                    <Option value="kg">Kilogram (kg)</Option>
                    <Option value="lb">Pound (lb)</Option>
                  </Select>
                </Form.Item>

                <Button 
                  icon={<SwapOutlined />} 
                  onClick={handleWeightSwap}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Đảo ngược
                </Button>

                <Form.Item label="Sang đơn vị">
                  <Select value={weightToUnit} onChange={setWeightToUnit} style={{ width: '100%' }}>
                    <Option value="kg">Kilogram (kg)</Option>
                    <Option value="lb">Pound (lb)</Option>
                  </Select>
                </Form.Item>

                <Space style={{ width: '100%' }}>
                  <Button type="primary" onClick={handleWeightConvert} icon={<SwapOutlined />}>
                    Quy đổi
                  </Button>
                  <Button onClick={handleWeightReset} icon={<ReloadOutlined />}>
                    Làm mới
                  </Button>
                </Space>
              </Form>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small" style={{ backgroundColor: '#fff', minHeight: 300 }}>
                <Form.Item label="Kết quả">
                  <Form form={weightForm}>
                    <Form.Item name="result">
                      <InputNumber 
                        style={{ width: '100%', fontSize: 24, fontWeight: 'bold' }} 
                        readOnly 
                        bordered={false}
                      />
                    </Form.Item>
                  </Form>
                </Form.Item>
                <Divider />
                <Table
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Phân loại', dataIndex: 'category', key: 'category' },
                    { title: 'kg', dataIndex: 'kg', key: 'kg', align: 'center' },
                    { title: 'lb', dataIndex: 'lb', key: 'lb', align: 'center' },
                  ]}
                  dataSource={weightRefData}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* === HEIGHT CONVERTER === */}
        <Card 
          title="📏 Quy đổi Chiều cao" 
          size="small" 
          style={{ marginBottom: 24, backgroundColor: '#fff7e6', borderColor: '#ffd591' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form form={heightForm} layout="vertical">
                <Form.Item label="Giá trị">
                  <InputNumber
                    value={heightValue}
                    onChange={setHeightValue}
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                  />
                </Form.Item>

                <Form.Item label="Từ đơn vị">
                  <Select value={heightFromUnit} onChange={setHeightFromUnit} style={{ width: '100%' }}>
                    <Option value="cm">Centimet (cm)</Option>
                    <Option value="inch">Inch (in)</Option>
                  </Select>
                </Form.Item>

                <Button 
                  icon={<SwapOutlined />} 
                  onClick={handleHeightSwap}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Đảo ngược
                </Button>

                <Form.Item label="Sang đơn vị">
                  <Select value={heightToUnit} onChange={setHeightToUnit} style={{ width: '100%' }}>
                    <Option value="cm">Centimet (cm)</Option>
                    <Option value="inch">Inch (in)</Option>
                  </Select>
                </Form.Item>

                <Space style={{ width: '100%' }}>
                  <Button type="primary" onClick={handleHeightConvert} icon={<SwapOutlined />}>
                    Quy đổi
                  </Button>
                  <Button onClick={handleHeightReset} icon={<ReloadOutlined />}>
                    Làm mới
                  </Button>
                </Space>
              </Form>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small" style={{ backgroundColor: '#fff', minHeight: 300 }}>
                <Form.Item label="Kết quả">
                  <Form form={heightForm}>
                    <Form.Item name="result">
                      <InputNumber 
                        style={{ width: '100%', fontSize: 24, fontWeight: 'bold' }} 
                        readOnly 
                        bordered={false}
                      />
                    </Form.Item>
                  </Form>
                </Form.Item>
                <Divider />
                <Alert
                  message="Công thức quy đổi"
                  description={
                    <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                      <li>1 inch = 2.54 cm</li>
                      <li>1 cm = 0.3937 inch</li>
                      <li>1 feet = 12 inches = 30.48 cm</li>
                      <li>Ví dụ: 5'7" (5 feet 7 inches) = 170.18 cm</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </Card>

        {/* === TEMPERATURE CONVERTER === */}
        <Card 
          title="🌡️ Quy đổi Nhiệt độ" 
          size="small" 
          style={{ marginBottom: 24, backgroundColor: '#fff1f0', borderColor: '#ffccc7' }}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form form={tempForm} layout="vertical">
                <Form.Item label="Giá trị">
                  <InputNumber
                    value={tempValue}
                    onChange={setTempValue}
                    style={{ width: '100%' }}
                    step={0.1}
                  />
                </Form.Item>

                <Form.Item label="Từ đơn vị">
                  <Select value={tempFromUnit} onChange={setTempFromUnit} style={{ width: '100%' }}>
                    <Option value="C">Celsius (°C)</Option>
                    <Option value="F">Fahrenheit (°F)</Option>
                  </Select>
                </Form.Item>

                <Button 
                  icon={<SwapOutlined />} 
                  onClick={handleTempSwap}
                  block
                  style={{ marginBottom: 16 }}
                >
                  Đảo ngược
                </Button>

                <Form.Item label="Sang đơn vị">
                  <Select value={tempToUnit} onChange={setTempToUnit} style={{ width: '100%' }}>
                    <Option value="C">Celsius (°C)</Option>
                    <Option value="F">Fahrenheit (°F)</Option>
                  </Select>
                </Form.Item>

                <Space style={{ width: '100%' }}>
                  <Button type="primary" onClick={handleTempConvert} icon={<SwapOutlined />}>
                    Quy đổi
                  </Button>
                  <Button onClick={handleTempReset} icon={<ReloadOutlined />}>
                    Làm mới
                  </Button>
                </Space>
              </Form>
            </Col>

            <Col xs={24} md={12}>
              <Card size="small" style={{ backgroundColor: '#fff', minHeight: 300 }}>
                <Form.Item label="Kết quả">
                  <Form form={tempForm}>
                    <Form.Item name="result">
                      <InputNumber 
                        style={{ width: '100%', fontSize: 24, fontWeight: 'bold' }} 
                        readOnly 
                        bordered={false}
                      />
                    </Form.Item>
                  </Form>
                </Form.Item>
                <Divider />
                <Table
                  size="small"
                  pagination={false}
                  columns={[
                    { title: 'Tình trạng', dataIndex: 'condition', key: 'condition' },
                    { title: '°C', dataIndex: 'celsius', key: 'celsius', align: 'center' },
                    { title: '°F', dataIndex: 'fahrenheit', key: 'fahrenheit', align: 'center' },
                  ]}
                  dataSource={tempRefData}
                />
                <Divider />
                <Alert
                  message="Công thức quy đổi"
                  description={
                    <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                      <li>°F = (°C × 9/5) + 32</li>
                      <li>°C = (°F - 32) × 5/9</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Alert
          message="Lưu ý"
          description={
            <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>Các giá trị quy đổi được làm tròn đến 2 chữ số thập phân</li>
              <li>Bảng tham khảo chỉ mang tính chất hướng dẫn</li>
              <li>Vui lòng tham khảo ý kiến bác sĩ để có đánh giá chính xác về tình trạng sức khỏe</li>
              <li>Các giá trị chuẩn có thể thay đổi tùy theo độ tuổi, giới tính và tình trạng sức khỏe</li>
            </ul>
          }
          type="warning"
          showIcon
        />
      </Card>
    </div>
  );
};

export default UnitConverterPage;
