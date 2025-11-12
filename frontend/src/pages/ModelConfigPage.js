import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, message, Collapse, Divider, Alert, Space, Popconfirm } from 'antd';
import { SettingOutlined, SaveOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Panel } = Collapse;
const { Option } = Select;

const API_BASE = 'http://localhost:8000/api/v1';

const ModelConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [lrForm] = Form.useForm();
  const [rfForm] = Form.useForm();
  const [gbForm] = Form.useForm();
  const [knnForm] = Form.useForm();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/config`);
      setConfig(response.data);
      
      // Set form values
      if (response.data.logistic_regression) {
        lrForm.setFieldsValue(response.data.logistic_regression);
      }
      if (response.data.random_forest) {
        rfForm.setFieldsValue(response.data.random_forest);
      }
      if (response.data.gradient_boosting) {
        gbForm.setFieldsValue(response.data.gradient_boosting);
      }
      if (response.data.knn) {
        knnForm.setFieldsValue(response.data.knn);
      }
      
      message.success('Tải cấu hình thành công!');
    } catch (error) {
      message.error('Không thể tải cấu hình');
      console.error('Fetch config error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const lrValues = await lrForm.validateFields();
      const rfValues = await rfForm.validateFields();
      const gbValues = await gbForm.validateFields();
      const knnValues = await knnForm.validateFields();

      const newConfig = {
        logistic_regression: lrValues,
        random_forest: rfValues,
        gradient_boosting: gbValues,
        knn: knnValues,
      };

      setSaving(true);
      await axios.put(`${API_BASE}/config`, newConfig);
      setConfig(newConfig);
      message.success('Lưu cấu hình thành công! Vui lòng train lại model để áp dụng.');
    } catch (error) {
      if (error.errorFields) {
        message.error('Vui lòng kiểm tra lại các trường nhập liệu!');
      } else {
        message.error('Không thể lưu cấu hình');
        console.error('Save config error:', error);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await axios.post(`${API_BASE}/config/reset`);
      message.success('Đặt lại cấu hình mặc định thành công!');
      fetchConfig();
    } catch (error) {
      message.error('Không thể đặt lại cấu hình');
      console.error('Reset config error:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card 
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            Cấu hình Hyperparameters cho các thuật toán ML
          </span>
        }
        extra={
          <Space>
            <Popconfirm
              title="Đặt lại cấu hình?"
              description="Bạn có chắc muốn đặt lại về cấu hình mặc định?"
              onConfirm={handleReset}
              okText="Đặt lại"
              cancelText="Hủy"
            >
              <Button icon={<ReloadOutlined />} loading={saving}>
                Đặt lại mặc định
              </Button>
            </Popconfirm>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              Lưu cấu hình
            </Button>
          </Space>
        }
      >
        <Alert
          message="Lưu ý quan trọng"
          description="Sau khi thay đổi cấu hình, bạn cần chạy lại script train_model.py để train lại các model với hyperparameters mới."
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          action={
            <Button size="small" type="link" icon={<ThunderboltOutlined />}>
              python train_model.py
            </Button>
          }
        />

        <Collapse accordion defaultActiveKey={['lr']}>
          {/* Logistic Regression */}
          <Panel header={<strong>🔵 Logistic Regression</strong>} key="lr">
            <Form form={lrForm} layout="vertical">
              <Form.Item 
                label="Max Iterations" 
                name="max_iter" 
                tooltip="Số lần lặp tối đa"
                rules={[{ required: true }]}
              >
                <InputNumber min={100} max={10000} step={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Solver" 
                name="solver"
                tooltip="Thuật toán tối ưu hóa"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="liblinear">liblinear (small datasets)</Option>
                  <Option value="lbfgs">lbfgs (default)</Option>
                  <Option value="saga">saga (large datasets)</Option>
                  <Option value="sag">sag</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label="C (Regularization)" 
                name="C"
                tooltip="Inverse of regularization strength. Smaller = stronger regularization"
                rules={[{ required: true }]}
              >
                <InputNumber min={0.001} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Penalty" 
                name="penalty"
                tooltip="Loại regularization"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="l1">L1 (Lasso)</Option>
                  <Option value="l2">L2 (Ridge)</Option>
                  <Option value="elasticnet">ElasticNet</Option>
                  <Option value="none">None</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Class Weight" name="class_weight">
                <Select>
                  <Option value="balanced">Balanced (auto)</Option>
                  <Option value={null}>None</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Random State" name="random_state">
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Panel>

          {/* Random Forest */}
          <Panel header={<strong>🟢 Random Forest</strong>} key="rf">
            <Form form={rfForm} layout="vertical">
              <Form.Item 
                label="N Estimators" 
                name="n_estimators"
                tooltip="Số lượng cây quyết định"
                rules={[{ required: true }]}
              >
                <InputNumber min={10} max={1000} step={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Max Depth" 
                name="max_depth"
                tooltip="Độ sâu tối đa của cây (null = không giới hạn)"
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} placeholder="null" />
              </Form.Item>

              <Form.Item 
                label="Min Samples Split" 
                name="min_samples_split"
                tooltip="Số mẫu tối thiểu để chia node"
                rules={[{ required: true }]}
              >
                <InputNumber min={2} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Min Samples Leaf" 
                name="min_samples_leaf"
                tooltip="Số mẫu tối thiểu tại leaf node"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Max Features" 
                name="max_features"
                tooltip="Số lượng features xem xét khi split"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="sqrt">sqrt (recommended)</Option>
                  <Option value="log2">log2</Option>
                  <Option value={null}>None (all features)</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Class Weight" name="class_weight">
                <Select>
                  <Option value="balanced">Balanced</Option>
                  <Option value="balanced_subsample">Balanced Subsample</Option>
                  <Option value={null}>None</Option>
                </Select>
              </Form.Item>

              <Form.Item label="Random State" name="random_state">
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Panel>

          {/* Gradient Boosting */}
          <Panel header={<strong>🟡 Gradient Boosting</strong>} key="gb">
            <Form form={gbForm} layout="vertical">
              <Form.Item 
                label="N Estimators" 
                name="n_estimators"
                tooltip="Số lượng boosting stages"
                rules={[{ required: true }]}
              >
                <InputNumber min={10} max={1000} step={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Learning Rate" 
                name="learning_rate"
                tooltip="Shrinks contribution của mỗi tree"
                rules={[{ required: true }]}
              >
                <InputNumber min={0.001} max={1} step={0.01} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Max Depth" 
                name="max_depth"
                tooltip="Độ sâu tối đa của individual estimators"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Min Samples Split" 
                name="min_samples_split"
                tooltip="Số mẫu tối thiểu để chia internal node"
                rules={[{ required: true }]}
              >
                <InputNumber min={2} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Min Samples Leaf" 
                name="min_samples_leaf"
                tooltip="Số mẫu tối thiểu tại leaf node"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Subsample" 
                name="subsample"
                tooltip="Tỷ lệ mẫu sử dụng cho mỗi tree"
                rules={[{ required: true }]}
              >
                <InputNumber min={0.1} max={1} step={0.1} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item label="Random State" name="random_state">
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Form>
          </Panel>

          {/* KNN */}
          <Panel header={<strong>🟣 K-Nearest Neighbors (KNN)</strong>} key="knn">
            <Form form={knnForm} layout="vertical">
              <Form.Item 
                label="N Neighbors" 
                name="n_neighbors"
                tooltip="Số lượng láng giềng gần nhất"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={50} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Weights" 
                name="weights"
                tooltip="Hàm trọng số cho predictions"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="uniform">Uniform (all equal)</Option>
                  <Option value="distance">Distance (closer = higher weight)</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label="Algorithm" 
                name="algorithm"
                tooltip="Thuật toán tính nearest neighbors"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="auto">Auto (recommended)</Option>
                  <Option value="ball_tree">Ball Tree</Option>
                  <Option value="kd_tree">KD Tree</Option>
                  <Option value="brute">Brute Force</Option>
                </Select>
              </Form.Item>

              <Form.Item 
                label="Leaf Size" 
                name="leaf_size"
                tooltip="Leaf size cho BallTree hoặc KDTree"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="P (Minkowski)" 
                name="p"
                tooltip="Power parameter cho Minkowski metric (1=Manhattan, 2=Euclidean)"
                rules={[{ required: true }]}
              >
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item 
                label="Metric" 
                name="metric"
                tooltip="Distance metric"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="minkowski">Minkowski (default)</Option>
                  <Option value="euclidean">Euclidean</Option>
                  <Option value="manhattan">Manhattan</Option>
                  <Option value="chebyshev">Chebyshev</Option>
                </Select>
              </Form.Item>
            </Form>
          </Panel>
        </Collapse>

        <Divider />

        <Alert
          message="Hướng dẫn sử dụng"
          description={
            <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
              <li>Điều chỉnh các hyperparameters phù hợp với dữ liệu của bạn</li>
              <li>Nhấn "Lưu cấu hình" để lưu các thay đổi</li>
              <li>Mở terminal và chạy: <code>cd ml-api && python train_model.py</code></li>
              <li>Sau khi train xong, restart Flask API để load models mới</li>
              <li>Kiểm tra metrics để so sánh hiệu suất các thuật toán</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>
    </div>
  );
};

export default ModelConfigPage;
