"""
Script kiểm tra rate limiting của API
Chạy script này để verify rate limits đang hoạt động đúng
"""

import requests
import time
import json

API_URL = "http://localhost:8000/api/v1"

# Sample test data
SAMPLE_PATIENT = {
    "patientName": "Test Patient",
    "citizenId": "123456789012",
    "age": 45,
    "gender": "Male",
    "hypertension": False,
    "heartDisease": False,
    "everMarried": "Yes",
    "workType": "Private",
    "residenceType": "Urban",
    "avgGlucoseLevel": 100.5,
    "bmi": 25.3,
    "smokingStatus": "never smoked"
}

def test_prediction_rate_limit():
    """Test prediction endpoint: 10 per minute"""
    print("\n" + "="*60)
    print("🔍 Kiểm tra Rate Limit: /predictions/predict (10/phút)")
    print("="*60)
    
    success_count = 0
    rate_limited = False
    
    for i in range(1, 13):
        try:
            response = requests.post(
                f"{API_URL}/predictions/predict",
                json=SAMPLE_PATIENT,
                timeout=5
            )
            
            if response.status_code == 200:
                success_count += 1
                remaining = response.headers.get('X-RateLimit-Remaining', 'N/A')
                print(f"✅ Request {i:2d}: Success (Remaining: {remaining})")
            elif response.status_code == 429:
                rate_limited = True
                retry_after = response.headers.get('Retry-After', 'N/A')
                print(f"⛔ Request {i:2d}: Rate Limited (Retry after: {retry_after}s)")
                break
            else:
                print(f"❌ Request {i:2d}: Error {response.status_code}")
                
        except Exception as e:
            print(f"❌ Request {i:2d}: Exception - {str(e)}")
        
        time.sleep(0.5)  # Small delay between requests
    
    print(f"\n📊 Kết quả:")
    print(f"   - Thành công: {success_count}/12 requests")
    print(f"   - Rate limited: {'Có ✅' if rate_limited else 'Không ❌'}")
    
    if success_count <= 10 and rate_limited:
        print(f"   ✅ Rate limit hoạt động ĐÚNG (limit: 10/phút)")
    else:
        print(f"   ⚠️  Rate limit có thể CHƯA hoạt động đúng")


def test_global_rate_limit():
    """Test global limits: 50 per hour"""
    print("\n" + "="*60)
    print("🔍 Kiểm tra Global Rate Limit (50/giờ)")
    print("="*60)
    print("⚠️  Test này sẽ mất vài phút và gửi nhiều requests...")
    
    response = input("Bạn có muốn tiếp tục? (y/n): ")
    if response.lower() != 'y':
        print("❌ Đã hủy test global rate limit")
        return
    
    success_count = 0
    rate_limited = False
    
    print("\n🚀 Đang gửi requests...")
    for i in range(1, 52):
        try:
            response = requests.get(f"{API_URL}/predictions/history", timeout=5)
            
            if response.status_code == 200:
                success_count += 1
                if i % 10 == 0:
                    remaining = response.headers.get('X-RateLimit-Remaining', 'N/A')
                    print(f"   Request {i:2d}: OK (Remaining: {remaining})")
            elif response.status_code == 429:
                rate_limited = True
                print(f"⛔ Request {i:2d}: Rate Limited!")
                break
                
        except Exception as e:
            print(f"❌ Request {i:2d}: {str(e)}")
    
    print(f"\n📊 Kết quả:")
    print(f"   - Thành công: {success_count}/51 requests")
    print(f"   - Rate limited: {'Có ✅' if rate_limited else 'Không ❌'}")


def check_rate_limit_headers():
    """Kiểm tra rate limit headers"""
    print("\n" + "="*60)
    print("🔍 Kiểm tra Rate Limit Headers")
    print("="*60)
    
    try:
        response = requests.get(f"{API_URL}/predictions/history")
        
        print("📋 Response Headers liên quan đến Rate Limit:")
        headers_to_check = [
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining', 
            'X-RateLimit-Reset'
        ]
        
        found_headers = False
        for header in headers_to_check:
            value = response.headers.get(header)
            if value:
                found_headers = True
                print(f"   {header}: {value}")
        
        if not found_headers:
            print("   ⚠️  Không tìm thấy rate limit headers")
            print("   💡 Headers có thể chỉ xuất hiện khi đạt gần limit")
        else:
            print("   ✅ Rate limit headers có sẵn")
            
    except Exception as e:
        print(f"❌ Lỗi: {str(e)}")


def main():
    print("\n" + "="*60)
    print("🧪 KIỂM TRA RATE LIMITING - STROKE PREDICTION API")
    print("="*60)
    print("\nĐảm bảo API đang chạy tại: http://localhost:8000")
    
    # Check if API is running
    try:
        response = requests.get(f"http://localhost:8000/health", timeout=2)
        if response.status_code == 200:
            print("✅ API đang chạy")
        else:
            print("⚠️  API trả về status code:", response.status_code)
    except Exception as e:
        print(f"❌ Không thể kết nối đến API: {str(e)}")
        print("\n💡 Vui lòng chạy API trước: python run.py")
        return
    
    # Run tests
    check_rate_limit_headers()
    test_prediction_rate_limit()
    
    # Ask before running intensive test
    print("\n" + "="*60)
    test_global_rate_limit()
    
    print("\n" + "="*60)
    print("✅ Hoàn thành kiểm tra!")
    print("="*60)


if __name__ == "__main__":
    main()
