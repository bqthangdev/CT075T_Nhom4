import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Result, Row, Col, Alert, Divider, Table, Tag } from 'antd';
import { CalculatorOutlined, UserOutlined } from '@ant-design/icons';

const BMICalculatorPage = () => {
  const [form] = Form.useForm();
  const [result, setResult] = useState(null);

  const calculateBMI = (values) => {
    const { weight, height } = values;
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    let category = '';
    let status = '';
    let color = '';
    let recommendations = [];

    if (bmi < 18.5) {
      category = 'Thiếu cân';
      status = 'warning';
      color = 'orange';
      recommendations = [
        'Tăng cường dinh dưỡng với chế độ ăn giàu protein và calories',
        'Tập thể dục để tăng cơ bắp',
        'Khám sức khỏe định kỳ',
        'Tránh stress và nghỉ ngơi đầy đủ'
      ];
    } else if (bmi >= 18.5 && bmi < 25) {
      category = 'Bình thường';
      status = 'success';
      color = 'green';
      recommendations = [
        'Duy trì chế độ ăn uống cân bằng',
        'Tập thể dục đều đặn ít nhất 30 phút/ngày',
        'Uống đủ nước (2-2.5 lít/ngày)',
        'Ngủ đủ 7-8 giờ mỗi đêm'
      ];
    } else if (bmi >= 25 && bmi < 30) {
      category = 'Thừa cân';
      status = 'warning';
      color = 'orange';
      recommendations = [
        'Giảm lượng calories nạp vào hàng ngày',
        'Tăng cường vận động và tập luyện',
        'Hạn chế đồ ăn nhiều dầu mỡ và đường',
        'Tham khảo ý kiến chuyên gia dinh dưỡng'
      ];
    } else {
      category = 'Béo phì';
      status = 'error';
      color = 'red';
      recommendations = [
        'Cần có kế hoạch giảm cân khoa học',
        'Tư vấn với bác sĩ hoặc chuyên gia dinh dưỡng',
        'Tập luyện thường xuyên dưới sự hướng dẫn',
        'Kiểm tra sức khỏe toàn diện',
        'Theo dõi các bệnh lý liên quan (tiểu đường, huyết áp, tim mạch)'
      ];
    }

    setResult({
      bmi: bmi.toFixed(2),
      category,
      status,
      color,
      recommendations,
      weight,
      height
    });
  };

  const handleReset = () => {
    form.resetFields();
    setResult(null);
  };

  const bmiRanges = [
    {
      key: '1',
      range: '< 18.5',
      category: 'Thiếu cân',
      color: 'orange',
      risk: 'Nguy cơ suy dinh dưỡng, giảm miễn dịch'
    },
    {
      key: '2',
      range: '18.5 - 24.9',
      category: 'Bình thường',
      color: 'green',
      risk: 'Nguy cơ thấp'
    },
    {
      key: '3',
      range: '25.0 - 29.9',
      category: 'Thừa cân',
      color: 'orange',
      risk: 'Tăng nguy cơ bệnh tim mạch, tiểu đường'
    },
    {
      key: '4',
      range: '≥ 30.0',
      category: 'Béo phì',
      color: 'red',
      risk: 'Nguy cơ cao bệnh tim mạch, tiểu đường, đột quỵ'
    }
  ];

  const columns = [
    {
      title: 'Chỉ số BMI',
      dataIndex: 'range',
      key: 'range',
      align: 'center',
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      align: 'center',
      render: (text, record) => <Tag color={record.color}>{text}</Tag>
    },
    {
      title: 'Nguy cơ sức khỏe',
      dataIndex: 'risk',
      key: 'risk',
    }
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        title={
          <span>
            <CalculatorOutlined style={{ marginRight: 8 }} />
            Máy tính chỉ số BMI (Body Mass Index)
          </span>
        }
      >
        <Alert
          message="Chỉ số BMI là gì?"
          description="BMI (Body Mass Index) là chỉ số khối cơ thể, dùng để đánh giá mức độ béo gầy của một người dựa trên chiều cao và cân nặng. Công thức: BMI = Cân nặng (kg) / [Chiều cao (m)]²"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={24}>
          <Col xs={24} lg={12}>
            <Card title="Nhập thông tin" size="small" style={{ marginBottom: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={calculateBMI}
              >
                <Form.Item
                  label="Cân nặng (kg)"
                  name="weight"
                  rules={[
                    { required: true, message: 'Vui lòng nhập cân nặng!' },
                    { type: 'number', min: 1, max: 300, message: 'Cân nặng phải từ 1-300 kg' }
                  ]}
                >
                  <InputNumber
                    min={1}
                    max={300}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="Ví dụ: 65"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Form.Item
                  label="Chiều cao (cm)"
                  name="height"
                  rules={[
                    { required: true, message: 'Vui lòng nhập chiều cao!' },
                    { type: 'number', min: 50, max: 250, message: 'Chiều cao phải từ 50-250 cm' }
                  ]}
                >
                  <InputNumber
                    min={50}
                    max={250}
                    step={0.1}
                    style={{ width: '100%' }}
                    placeholder="Ví dụ: 170"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>

                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<CalculatorOutlined />}
                    block
                    size="large"
                  >
                    Tính BMI
                  </Button>
                  <Button 
                    style={{ marginTop: 8 }}
                    onClick={handleReset}
                    block
                  >
                    Làm mới
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            {result ? (
              <Card title="Kết quả" size="small" style={{ marginBottom: 16 }}>
                <Result
                  status={result.status}
                  title={
                    <div>
                      <div style={{ fontSize: 48, fontWeight: 'bold', color: result.color }}>
                        {result.bmi}
                      </div>
                      <Tag color={result.color} style={{ fontSize: 16, padding: '4px 16px' }}>
                        {result.category}
                      </Tag>
                    </div>
                  }
                  subTitle={
                    <div style={{ textAlign: 'left', marginTop: 16 }}>
                      <p><strong>Cân nặng:</strong> {result.weight} kg</p>
                      <p><strong>Chiều cao:</strong> {result.height} cm</p>
                      
                      <Divider />
                      
                      <h4>Khuyến nghị:</h4>
                      <ul style={{ textAlign: 'left', paddingLeft: 20 }}>
                        {result.recommendations.map((rec, index) => (
                          <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  }
                />
              </Card>
            ) : (
              <Card 
                title="Kết quả" 
                size="small" 
                style={{ 
                  marginBottom: 16, 
                  minHeight: 400, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <Result
                  icon={<CalculatorOutlined style={{ fontSize: 72 }} />}
                  title="Nhập thông tin để tính BMI"
                  subTitle="Vui lòng nhập cân nặng và chiều cao của bạn"
                />
              </Card>
            )}
          </Col>
        </Row>

        <Divider />

        <Card title="Bảng phân loại BMI" size="small">
          <Table
            columns={columns}
            dataSource={bmiRanges}
            pagination={false}
            size="small"
          />
          
          <Alert
            message="Lưu ý"
            description={
              <ul style={{ paddingLeft: 20, marginBottom: 0 }}>
                <li>BMI chỉ mang tính chất tham khảo và không phải là chỉ số tuyệt đối</li>
                <li>Chỉ số này không phân biệt khối lượng cơ bắp và mỡ</li>
                <li>Đối với vận động viên hoặc người tập thể hình, BMI có thể cao hơn do khối lượng cơ bắp lớn</li>
                <li>Nên tham khảo ý kiến bác sĩ để có đánh giá chính xác về tình trạng sức khỏe</li>
              </ul>
            }
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        </Card>
      </Card>
    </div>
  );
};

export default BMICalculatorPage;
