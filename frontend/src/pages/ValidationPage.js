import React, { useState, useEffect } from 'react';
import { Card, Button, InputNumber, message, Spin, Alert, Table, Statistic, Row, Col, Divider, Tag, Progress } from 'antd';
import { ThunderboltOutlined, DatabaseOutlined, LineChartOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../services/api';

const ValidationPage = () => {
  const [loading, setLoading] = useState(false);
  const [kFolds, setKFolds] = useState(5);
  const [dataPercent, setDataPercent] = useState(100);
  const [results, setResults] = useState(null);
  const [datasetInfo, setDatasetInfo] = useState(null);

  useEffect(() => {
    fetchDatasetInfo();
  }, []);

  const fetchDatasetInfo = async () => {
    try {
      const response = await api.getDatasetInfo();
      setDatasetInfo(response);
    } catch (error) {
      console.error('Error fetching dataset info:', error);
    }
  };

  const handleValidation = async () => {
    if (kFolds < 2 || kFolds > 20) {
      message.error('K-Folds phải nằm trong khoảng từ 2 đến 20!');
      return;
    }

    if (dataPercent < 10 || dataPercent > 100) {
      message.error('Phần trăm dữ liệu phải nằm trong khoảng từ 10% đến 100%!');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const response = await api.kfoldValidation(kFolds, dataPercent);
      setResults(response);
      message.success(`Hoàn thành K-Fold Cross Validation với K=${kFolds}, sử dụng ${dataPercent}% dữ liệu!`);
    } catch (error) {
      message.error('Không thể thực hiện validation: ' + (error.response?.data?.error || error.message));
      console.error('Validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricColor = (value) => {
    if (value >= 0.9) return '#52c41a'; // Green
    if (value >= 0.8) return '#1890ff'; // Blue
    if (value >= 0.7) return '#faad14'; // Orange
    return '#ff4d4f'; // Red
  };

  const formatPercent = (value) => `${(value * 100).toFixed(2)}%`;

  const columns = [
    {
      title: 'Thuật toán',
      dataIndex: 'algorithm',
      key: 'algorithm',
      fixed: 'left',
      width: 180,
      render: (text) => <Tag color="blue" style={{ fontSize: 14 }}>{text}</Tag>,
    },
    {
      title: 'Accuracy',
      key: 'accuracy',
      width: 150,
      children: [
        {
          title: 'Mean ± Std',
          key: 'accuracy_mean',
          width: 150,
          render: (_, record) => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: getMetricColor(record.accuracy_mean) }}>
                {formatPercent(record.accuracy_mean)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ± {formatPercent(record.accuracy_std)}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: 'Precision',
      key: 'precision',
      width: 150,
      children: [
        {
          title: 'Mean ± Std',
          key: 'precision_mean',
          width: 150,
          render: (_, record) => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: getMetricColor(record.precision_mean) }}>
                {formatPercent(record.precision_mean)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ± {formatPercent(record.precision_std)}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: 'Recall',
      key: 'recall',
      width: 150,
      children: [
        {
          title: 'Mean ± Std',
          key: 'recall_mean',
          width: 150,
          render: (_, record) => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: getMetricColor(record.recall_mean) }}>
                {formatPercent(record.recall_mean)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ± {formatPercent(record.recall_std)}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: 'F1-Score',
      key: 'f1',
      width: 150,
      children: [
        {
          title: 'Mean ± Std',
          key: 'f1_mean',
          width: 150,
          render: (_, record) => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: getMetricColor(record.f1_mean) }}>
                {formatPercent(record.f1_mean)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ± {formatPercent(record.f1_std)}
              </div>
            </div>
          ),
        },
      ],
    },
    {
      title: 'ROC-AUC',
      key: 'roc_auc',
      width: 150,
      children: [
        {
          title: 'Mean ± Std',
          key: 'roc_auc_mean',
          width: 150,
          render: (_, record) => (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: getMetricColor(record.roc_auc_mean) }}>
                {formatPercent(record.roc_auc_mean)}
              </div>
              <div style={{ fontSize: 12, color: '#999' }}>
                ± {formatPercent(record.roc_auc_std)}
              </div>
            </div>
          ),
        },
      ],
    },
  ];

  const expandedRowRender = (record) => {
    const foldColumns = [
      { title: 'Fold', dataIndex: 'fold', key: 'fold', width: 80 },
      { 
        title: 'Accuracy', 
        dataIndex: 'accuracy', 
        key: 'accuracy',
        render: (val) => <span style={{ color: getMetricColor(val) }}>{formatPercent(val)}</span>
      },
      { 
        title: 'Precision', 
        dataIndex: 'precision', 
        key: 'precision',
        render: (val) => <span style={{ color: getMetricColor(val) }}>{formatPercent(val)}</span>
      },
      { 
        title: 'Recall', 
        dataIndex: 'recall', 
        key: 'recall',
        render: (val) => <span style={{ color: getMetricColor(val) }}>{formatPercent(val)}</span>
      },
      { 
        title: 'F1-Score', 
        dataIndex: 'f1', 
        key: 'f1',
        render: (val) => <span style={{ color: getMetricColor(val) }}>{formatPercent(val)}</span>
      },
      { 
        title: 'ROC-AUC', 
        dataIndex: 'roc_auc', 
        key: 'roc_auc',
        render: (val) => <span style={{ color: getMetricColor(val) }}>{formatPercent(val)}</span>
      },
    ];

    const foldData = record.foldDetails || [];

    return (
      <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
        <h4 style={{ marginBottom: 16 }}>📊 Chi tiết từng Fold</h4>
        <Table
          columns={foldColumns}
          dataSource={foldData}
          pagination={false}
          size="small"
          bordered
        />
      </div>
    );
  };

  const processResults = () => {
    if (!results || !results.results) return [];

    return Object.entries(results.results).map(([algorithm, metrics]) => {
      if (metrics.error) {
        return {
          algorithm,
          error: metrics.error,
          accuracy_mean: 0,
          accuracy_std: 0,
          precision_mean: 0,
          precision_std: 0,
          recall_mean: 0,
          recall_std: 0,
          f1_mean: 0,
          f1_std: 0,
          roc_auc_mean: 0,
          roc_auc_std: 0,
        };
      }

      // Prepare fold details
      const foldDetails = [];
      const numFolds = metrics.accuracy?.folds?.length || 0;
      for (let i = 0; i < numFolds; i++) {
        foldDetails.push({
          key: i,
          fold: i + 1,
          accuracy: metrics.accuracy.folds[i],
          precision: metrics.precision.folds[i],
          recall: metrics.recall.folds[i],
          f1: metrics.f1.folds[i],
          roc_auc: metrics.roc_auc.folds[i],
        });
      }

      return {
        algorithm,
        accuracy_mean: metrics.accuracy?.mean || 0,
        accuracy_std: metrics.accuracy?.std || 0,
        precision_mean: metrics.precision?.mean || 0,
        precision_std: metrics.precision?.std || 0,
        recall_mean: metrics.recall?.mean || 0,
        recall_std: metrics.recall?.std || 0,
        f1_mean: metrics.f1?.mean || 0,
        f1_std: metrics.f1?.std || 0,
        roc_auc_mean: metrics.roc_auc?.mean || 0,
        roc_auc_std: metrics.roc_auc?.std || 0,
        train_accuracy_mean: metrics.train_accuracy?.mean || 0,
        foldDetails,
      };
    });
  };

  return (
    <div style={{ maxWidth: 1800, margin: '0 auto', padding: '0 24px' }}>
      <Card
        title={
          <span style={{ fontSize: 20 }}>
            <LineChartOutlined style={{ marginRight: 8 }} />
            📊 K-Fold Cross Validation - Kiểm tra độ chính xác Model
          </span>
        }
      >
        <Alert
          message="K-Fold Cross Validation là gì?"
          description={
            <div>
              <p style={{ marginBottom: 8 }}>
                K-Fold Cross Validation là phương pháp chia dataset thành K phần (folds) bằng nhau. 
                Mỗi lần, 1 fold được dùng làm test set và K-1 fold còn lại làm training set. 
                Quá trình lặp lại K lần với các fold khác nhau.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Lợi ích:</strong> Đánh giá hiệu suất model khách quan hơn, tránh overfitting, 
                tận dụng tối đa dữ liệu để training và testing.
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        {/* Dataset Info */}
        {datasetInfo && (
          <Card 
            title={
              <span>
                <DatabaseOutlined style={{ marginRight: 8 }} />
                Thông tin Dataset
              </span>
            } 
            size="small" 
            style={{ marginBottom: 24 }}
          >
            <Row gutter={24}>
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Tổng số mẫu" 
                  value={datasetInfo.total_rows} 
                  prefix={<DatabaseOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Không đột quỵ" 
                  value={datasetInfo.stroke_distribution?.no_stroke || 0}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic 
                  title="Có đột quỵ" 
                  value={datasetInfo.stroke_distribution?.stroke || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
            </Row>
          </Card>
        )}

        {/* Configuration */}
        <Card 
          title="⚙️ Cấu hình K-Fold" 
          size="small" 
          style={{ marginBottom: 24 }}
        >
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Số lượng Folds (K):
              </label>
              <InputNumber
                min={2}
                max={20}
                value={kFolds}
                onChange={setKFolds}
                style={{ width: '100%' }}
                size="large"
                disabled={loading}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                Dataset sẽ được chia thành {kFolds} phần. Mỗi phần chiếm ~{(100/kFolds).toFixed(1)}% dữ liệu.
              </div>
            </Col>
            <Col xs={24} md={12}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Phần trăm dữ liệu sử dụng (%):
              </label>
              <InputNumber
                min={10}
                max={100}
                value={dataPercent}
                onChange={setDataPercent}
                style={{ width: '100%' }}
                size="large"
                disabled={loading}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
              />
              <div style={{ marginTop: 8, fontSize: 13, color: '#666' }}>
                {datasetInfo && (
                  <>Sẽ sử dụng {Math.round(datasetInfo.total_rows * dataPercent / 100)} / {datasetInfo.total_rows} mẫu dữ liệu.</>
                )}
              </div>
            </Col>
          </Row>
          <Divider />
          <div style={{ textAlign: 'center' }}>
            <Button
              type="primary"
              size="large"
              icon={loading ? <Spin /> : <ThunderboltOutlined />}
              onClick={handleValidation}
              loading={loading}
              style={{ height: 60, fontSize: 16, minWidth: 250 }}
            >
              {loading ? 'Đang xử lý...' : 'Bắt đầu Validation'}
            </Button>
          </div>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <p style={{ marginTop: 20, fontSize: 16 }}>
              Đang thực hiện K-Fold Cross Validation...
            </p>
            <p style={{ color: '#666' }}>
              Quá trình này có thể mất vài phút tùy thuộc vào số lượng folds và độ phức tạp của models.
            </p>
          </Card>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            <Divider orientation="left" style={{ fontSize: 18, fontWeight: 'bold' }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              Kết quả Validation
            </Divider>

            <Alert
              message={`Hoàn thành với K=${results.k_folds} folds trên ${results.dataset_size} mẫu dữ liệu`}
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Card>
              <Table
                columns={columns}
                dataSource={processResults()}
                rowKey="algorithm"
                scroll={{ x: 1200 }}
                expandable={{
                  expandedRowRender,
                  expandIcon: ({ expanded, onExpand, record }) => 
                    expanded ? (
                      <Button size="small" onClick={e => onExpand(record, e)}>Ẩn chi tiết</Button>
                    ) : (
                      <Button size="small" type="primary" onClick={e => onExpand(record, e)}>Xem chi tiết</Button>
                    )
                }}
                pagination={false}
              />
              
              <Divider />
              
              <Alert
                message="💡 Cách đọc kết quả"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li><strong>Mean:</strong> Giá trị trung bình của metric qua tất cả các folds</li>
                    <li><strong>Std (Standard Deviation):</strong> Độ lệch chuẩn - giá trị càng nhỏ, model càng ổn định</li>
                    <li><strong>Chi tiết từng Fold:</strong> Nhấn "Xem chi tiết" để xem kết quả từng fold</li>
                    <li><strong>So sánh giữa các thuật toán:</strong> Thuật toán có Mean cao và Std thấp là tốt nhất</li>
                  </ul>
                }
                type="info"
                showIcon
              />
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default ValidationPage;
