# Rate Limiting Configuration

## Overview
API rate limiting đã được triển khai để ngăn chặn lạm dụng và đảm bảo tính ổn định của hệ thống.

## Rate Limits

### Global Limits (Áp dụng cho tất cả endpoints)
- **200 requests per day** (200 yêu cầu mỗi ngày)
- **50 requests per hour** (50 yêu cầu mỗi giờ)

### Endpoint-Specific Limits

#### `/api/v1/predictions/predict` (POST)
- **5 predictions per minute** (5 chẩn đoán mỗi phút)
- Giới hạn này áp dụng cho mỗi địa chỉ IP
- **Lý do:** Ngăn chặn spam và lạm dụng hệ thống ML

#### `/api/v1/report/generate` (POST)
- **20 reports per minute** (20 báo cáo mỗi phút)
- Giới hạn này áp dụng cho mỗi địa chỉ IP

## HTTP Status Codes

### 429 Too Many Requests
Khi vượt quá giới hạn, API sẽ trả về:
```json
{
  "error": "429 Too Many Requests: X per Y minute"
}
```

Headers bao gồm:
- `X-RateLimit-Limit`: Giới hạn tối đa
- `X-RateLimit-Remaining`: Số lượng request còn lại
- `X-RateLimit-Reset`: Timestamp khi giới hạn được reset
- `Retry-After`: Số giây cần chờ trước khi thử lại

## Cấu hình

Rate limiting được cấu hình trong `app/__init__.py`:
```python
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)
```

## Testing Rate Limits

### Kiểm tra prediction limit (5/phút):
```bash
# Gửi 6 requests liên tục để test spam protection
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/predictions/predict \
    -H "Content-Type: application/json" \
    -d '{"age": 45, "avgGlucoseLevel": 100, "bmi": 25, ...}'
  echo "Request $i"
done
```

### Kiểm tra report limit (20/phút):
```bash
# Gửi 21 requests liên tục
for i in {1..21}; do
  curl -X POST http://localhost:8000/api/v1/report/generate \
    -H "Content-Type: application/json" \
    -d '{"patientData": {...}, "predictionResult": {...}}'
  echo "Request $i"
done
```

## Frontend Handling

Frontend nên xử lý lỗi 429:
```javascript
try {
  const response = await api.predictStrokeRisk(values);
  // ... handle success
} catch (error) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    message.error(`Vượt quá giới hạn request. Vui lòng thử lại sau ${retryAfter} giây.`);
  } else {
    message.error('Có lỗi xảy ra khi chẩn đoán');
  }
}
```

## Production Recommendations

Để production, nên:
1. Sử dụng Redis thay vì memory storage:
   ```python
   storage_uri="redis://localhost:6379"
   ```
2. Tùy chỉnh limits dựa trên user authentication
3. Thêm monitoring và alerting
4. Whitelist các IP tin cậy nếu cần
