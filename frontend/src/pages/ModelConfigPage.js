import React, { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, message, Collapse, Divider, Alert, Space, Popconfirm, Progress, Modal, Spin } from 'antd';
import { SettingOutlined, SaveOutlined, ReloadOutlined, ThunderboltOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Panel } = Collapse;
const { Option } = Select;

const ModelConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null); // Track saved config for comparison
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [training, setTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingMessage, setTrainingMessage] = useState('');
  const [trainingModalVisible, setTrainingModalVisible] = useState(false);
  const [configChanged, setConfigChanged] = useState(false); // Track if config has been modified

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
      const response = await api.getConfig();
      setConfig(response);
      setSavedConfig(JSON.parse(JSON.stringify(response))); // Deep copy for comparison
      setConfigChanged(false); // Reset change flag
      
      // Set form values
      if (response.logistic_regression) {
        lrForm.setFieldsValue(response.logistic_regression);
      }
      if (response.random_forest) {
        rfForm.setFieldsValue(response.random_forest);
      }
      // TEMPORARILY DISABLED: Gradient Boosting
      // if (response.gradient_boosting) {
      //   gbForm.setFieldsValue(response.gradient_boosting);
      // }
      if (response.knn) {
        knnForm.setFieldsValue(response.knn);
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
      // const gbValues = await gbForm.validateFields();  // TEMPORARILY DISABLED
      const knnValues = await knnForm.validateFields();

      const newConfig = {
        logistic_regression: lrValues,
        random_forest: rfValues,
        // gradient_boosting: gbValues,  // TEMPORARILY DISABLED
        knn: knnValues,
      };

      setSaving(true);
      await api.updateConfig(newConfig);
      setConfig(newConfig);
      setSavedConfig(JSON.parse(JSON.stringify(newConfig))); // Update saved config
      setConfigChanged(false); // Reset change flag after save
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
      await api.resetConfig();
      message.success('Đặt lại cấu hình mặc định thành công!');
      fetchConfig();
    } catch (error) {
      message.error('Không thể đặt lại cấu hình');
      console.error('Reset config error:', error);
    } finally {
      setSaving(false);
    }
  };

  const checkConfigChanges = () => {
    // Compare current form values with saved config
    if (!savedConfig) return true; // If no saved config, allow training

    try {
      const currentLR = lrForm.getFieldsValue();
      const currentRF = rfForm.getFieldsValue();
      // const currentGB = gbForm.getFieldsValue();  // TEMPORARILY DISABLED
      const currentKNN = knnForm.getFieldsValue();

      const currentConfig = {
        logistic_regression: currentLR,
        random_forest: currentRF,
        // gradient_boosting: currentGB,  // TEMPORARILY DISABLED
        knn: currentKNN,
      };

      // Deep comparison
      return JSON.stringify(currentConfig) !== JSON.stringify(savedConfig);
    } catch (error) {
      console.error('Error checking config changes:', error);
      return true; // Allow training if error
    }
  };

  const handleTrain = async () => {
    try {
      // Check if there are any changes
      const hasChanges = checkConfigChanges();
      
      if (!hasChanges) {
        Modal.info({
          title: '✅ Không có thay đổi',
          content: (
            <div>
              <p style={{ fontSize: 15, marginBottom: 12 }}>
                Không có thông số kỹ thuật nào thay đổi so với cấu hình hiện tại.
              </p>
              <p style={{ fontSize: 14, color: '#666', marginBottom: 0 }}>
                Models hiện tại đã được training với cấu hình này. Không cần training lại.
              </p>
            </div>
          ),
          okText: 'Đã hiểu',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
        return;
      }

      // Warn if config has changes but not saved yet
      Modal.confirm({
        title: '⚠️ Xác nhận training',
        content: (
          <div>
            <p style={{ fontSize: 15, marginBottom: 12 }}>
              Phát hiện có thay đổi cấu hình. Bạn có muốn tiếp tục training với cấu hình hiện tại?
            </p>
            <Alert
              message="Lưu ý"
              description="Nếu bạn chưa lưu cấu hình, các thay đổi sẽ không được áp dụng. Hãy nhấn 'Lưu cấu hình' trước khi training."
              type="warning"
              showIcon
              style={{ marginTop: 12 }}
            />
          </div>
        ),
        okText: 'Tiếp tục training',
        cancelText: 'Hủy',
        okButtonProps: { danger: true },
        onOk: () => {
          startTraining();
        },
      });
      
    } catch (error) {
      message.error('Không thể bắt đầu training: ' + (error.response?.data?.error || error.message));
      setTraining(false);
      setTrainingModalVisible(false);
    }
  };

  const startTraining = async () => {
    try {
      setTraining(true);
      setTrainingProgress(0);
      setTrainingMessage('Bắt đầu training...');
      setTrainingModalVisible(true);

      // Start training
      await api.trainModels();
      
      // Poll training status
      const pollInterval = setInterval(async () => {
        try {
          const status = await api.getTrainingStatus();
          
          setTrainingProgress(status.progress || 0);
          setTrainingMessage(status.message || 'Đang training...');
          
          if (!status.is_training) {
            clearInterval(pollInterval);
            
            if (status.error) {
              message.error('Training thất bại: ' + status.error);
            } else if (status.progress === 100) {
              message.success('Training hoàn tất thành công!');
              setTimeout(() => {
                setTrainingModalVisible(false);
              }, 2000);
            }
            
            setTraining(false);
          }
        } catch (error) {
          clearInterval(pollInterval);
          message.error('Không thể lấy trạng thái training');
          setTraining(false);
        }
      }, 2000); // Poll every 2 seconds
      
    } catch (error) {
      message.error('Không thể bắt đầu training: ' + (error.response?.data?.error || error.message));
      setTraining(false);
      setTrainingModalVisible(false);
    }
  };

  return (
    <div style={{ margin: '0 auto', padding: '0 16px' }}>
      <Card 
        title={
          <div className="model-config-header">
            <div className="model-config-title">
              <SettingOutlined style={{ marginRight: 8 }} />
              Cấu hình Hyperparameters
            </div>
            <Space wrap size="small" className="card-actions-mobile">
              <Popconfirm
                title="Đặt lại cấu hình?"
                description="Bạn có chắc muốn đặt lại về cấu hình mặc định?"
                onConfirm={handleReset}
                okText="Đặt lại"
                cancelText="Hủy"
                disabled={training}
              >
                <Button 
                  icon={<ReloadOutlined />} 
                  loading={saving} 
                  size="small"
                  disabled={training}
                >
                  Đặt lại
                </Button>
              </Popconfirm>
              <Button 
                type="primary" 
                icon={<SaveOutlined />} 
                onClick={handleSave} 
                loading={saving} 
                size="small"
                disabled={training}
              >
                Lưu
              </Button>
            </Space>
          </div>
        }
        
      >
        <Alert
          message={
            <span>
              {checkConfigChanges() ? (
                <>⚠️ Có thay đổi chưa áp dụng</>
              ) : (
                <>✅ Cấu hình đã đồng bộ</>
              )}
            </span>
          }
          description={
            checkConfigChanges() ? (
              <span>
                Cần <strong>lưu cấu hình</strong> và <strong>train lại</strong> để áp dụng.
              </span>
            ) : (
              <span>
                Models đã được training với cấu hình này. Nếu thay đổi, hãy train lại.
              </span>
            )
          }
          type={checkConfigChanges() ? "warning" : "success"}
          showIcon
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <Button 
            size="large" 
            type="primary" 
            danger={checkConfigChanges()}
            icon={training ? <LoadingOutlined /> : <ThunderboltOutlined />}
            onClick={handleTrain}
            loading={training}
            disabled={training}
            style={{ minWidth: 200 }}
          >
            {training ? 'Đang Training...' : 'Train Models'}
          </Button>
        </div>

        <Collapse accordion defaultActiveKey={['lr']}>
          {/* Logistic Regression */}
          <Panel header={<strong style={{ fontSize: 16 }}>🔵 Logistic Regression</strong>} key="lr">
            <Form form={lrForm} layout="vertical">
              <div className="responsive-grid-3">
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
              </div>
            </Form>
          </Panel>

          {/* Random Forest */}
          <Panel header={<strong style={{ fontSize: 16 }}>🟢 Random Forest</strong>} key="rf">
            <Form form={rfForm} layout="vertical">
              <div className="responsive-grid-3">
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
              </div>
            </Form>
          </Panel>

          {/* TEMPORARILY DISABLED: Gradient Boosting */}
          {/* <Panel header={<strong style={{ fontSize: 16 }}>🟡 Gradient Boosting</strong>} key="gb">
            <Form form={gbForm} layout="vertical">
              <div className="responsive-grid-3">
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
              </div>
            </Form>
          </Panel> */}

          {/* KNN */}
          <Panel header={<strong style={{ fontSize: 16 }}>🟣 K-Nearest Neighbors (KNN)</strong>} key="knn">
            <Form form={knnForm} layout="vertical">
              <div className="responsive-grid-3">
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
              </div>
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
              <li>Nhấn nút "Train Models" trong Alert phía trên để train lại models</li>
              <li>Sau khi train xong, các model mới sẽ được áp dụng tự động</li>
              <li>Kiểm tra metrics để so sánh hiệu suất các thuật toán</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginTop: 16 }}
        />
      </Card>

      {/* Training Progress Modal */}
      <Modal
        title={
          <span>
            <ThunderboltOutlined style={{ marginRight: 8, color: '#faad14' }} />
            Đang Training Models
          </span>
        }
        open={trainingModalVisible}
        closable={!training}
        maskClosable={false}
        footer={null}
        width={600}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            spinning={training}
          >
            <div style={{ marginTop: 20 }}>
              <Progress 
                percent={trainingProgress} 
                status={training ? 'active' : trainingProgress === 100 ? 'success' : 'exception'}
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <p style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
                {trainingMessage}
              </p>
              {training && (
                <Alert
                  message="Vui lòng chờ"
                  description="Quá trình training đang diễn ra. Không được đóng trang này hoặc thực hiện các thao tác khác."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16, textAlign: 'left' }}
                />
              )}
            </div>
          </Spin>
        </div>
      </Modal>
    </div>
  );
};

export default ModelConfigPage;
