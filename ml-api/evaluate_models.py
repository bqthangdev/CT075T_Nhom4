"""
Script để đánh giá toàn diện các models và chọn model tốt nhất
"""
import json
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.metrics import roc_curve, precision_recall_curve
import joblib

METRICS_FILE = Path('app/models/metrics.json')
MODEL_DIR = Path('app/models')

def load_metrics():
    """Load metrics từ file"""
    with open(METRICS_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def calculate_composite_score(metrics):
    """
    Tính điểm tổng hợp dựa trên nhiều metrics
    Ưu tiên: ROC-AUC, F1-Score, Recall (Sensitivity), Precision
    """
    # Trọng số cho từng metric
    weights = {
        'roc_auc': 0.35,      # Quan trọng nhất - khả năng phân biệt class
        'f1_score': 0.25,     # Cân bằng precision/recall
        'sensitivity': 0.20,  # Recall - phát hiện được stroke (quan trọng y tế)
        'specificity': 0.10,  # Phát hiện không có stroke
        'precision': 0.10     # Độ chính xác khi dự đoán có stroke
    }
    
    score = 0
    for metric, weight in weights.items():
        value = metrics.get(metric, 0)
        if value is not None:
            score += value * weight
        else:
            # Nếu thiếu metric quan trọng, trừ điểm
            if metric == 'roc_auc':
                score -= 0.2
    
    return score

def evaluate_model_performance(name, metrics):
    """Đánh giá chi tiết hiệu suất của model"""
    print(f"\n{'='*80}")
    print(f"MODEL: {name.upper()}")
    print(f"{'='*80}")
    
    # 1. Metrics cơ bản
    print(f"\n[1] METRICS CƠ BẢN:")
    print(f"  - Accuracy:     {metrics.get('accuracy', 0):.4f} ({metrics.get('accuracy', 0)*100:.2f}%)")
    print(f"  - ROC-AUC:      {metrics.get('roc_auc', 0):.4f}")
    print(f"  - F1-Score:     {metrics.get('f1_score', 0):.4f}")
    print(f"  - Precision:    {metrics.get('precision', 0):.4f}")
    print(f"  - Recall:       {metrics.get('recall', 0):.4f}")
    
    # 2. Medical metrics (quan trọng cho chẩn đoán y tế)
    print(f"\n[2] MEDICAL METRICS:")
    sensitivity = metrics.get('sensitivity', 0)
    specificity = metrics.get('specificity', 0)
    print(f"  - Sensitivity (True Positive Rate):  {sensitivity:.4f} ({sensitivity*100:.2f}%)")
    print(f"  - Specificity (True Negative Rate):  {specificity:.4f} ({specificity*100:.2f}%)")
    
    # 3. Confusion Matrix
    cm = metrics.get('confusion_matrix', {})
    tn = cm.get('true_negative', 0)
    fp = cm.get('false_positive', 0)
    fn = cm.get('false_negative', 0)
    tp = cm.get('true_positive', 0)
    total = tn + fp + fn + tp
    
    print(f"\n[3] CONFUSION MATRIX:")
    print(f"  {'':>15} | Predicted NO | Predicted YES")
    print(f"  {'-'*50}")
    print(f"  {'Actual NO':>15} |   {tn:>6}     |   {fp:>6}")
    print(f"  {'Actual YES':>15} |   {fn:>6}     |   {tp:>6}")
    print(f"\n  Total samples: {total}")
    
    # 4. Phân tích lỗi
    print(f"\n[4] PHÂN TÍCH LỖI:")
    if total > 0:
        print(f"  - False Positive Rate: {fp/total*100:.2f}% ({fp}/{total})")
        print(f"  - False Negative Rate: {fn/total*100:.2f}% ({fn}/{total})")
        
        # False Negative rất nguy hiểm trong y tế (bỏ sót bệnh nhân thực sự có stroke)
        if fn > 0:
            if tp > 0:
                miss_rate = fn / (fn + tp)
                print(f"  - MISS RATE (bỏ sót stroke): {miss_rate*100:.2f}% ({fn}/{fn+tp}) - {'NGUY HIỂM!' if miss_rate > 0.3 else 'Chấp nhận được'}")
            else:
                print(f"  - MISS RATE: 100% - Model KHÔNG PHÁT HIỆN được stroke!")
    
    # 5. Probability errors
    print(f"\n[5] PROBABILITY PREDICTION ERRORS:")
    print(f"  - MAE (Probability): {metrics.get('mae_proba', 0):.4f}")
    print(f"  - MSE (Probability): {metrics.get('mse_proba', 0):.4f}")
    
    # 6. Điểm tổng hợp
    composite = calculate_composite_score(metrics)
    print(f"\n[6] COMPOSITE SCORE: {composite:.4f}")
    
    # 7. Đánh giá tổng quan
    print(f"\n[7] ĐÁNH GIÁ TỔNG QUAN:")
    issues = []
    strengths = []
    
    # Kiểm tra các vấn đề
    if sensitivity < 0.5:
        issues.append(f"Sensitivity thấp ({sensitivity*100:.1f}%) - khó phát hiện stroke")
    if specificity < 0.5:
        issues.append(f"Specificity thấp ({specificity*100:.1f}%) - nhiều false alarm")
    if metrics.get('f1_score', 0) < 0.3:
        issues.append(f"F1-Score rất thấp ({metrics.get('f1_score', 0):.3f}) - model kém cân bằng")
    if tp == 0:
        issues.append("KHÔNG PHÁT HIỆN được TRUE POSITIVE - Model vô dụng!")
    if metrics.get('roc_auc', 0) < 0.7:
        issues.append(f"ROC-AUC thấp ({metrics.get('roc_auc', 0):.3f}) - khả năng phân biệt kém")
    
    # Kiểm tra điểm mạnh
    if sensitivity > 0.7:
        strengths.append(f"Sensitivity tốt ({sensitivity*100:.1f}%) - phát hiện stroke hiệu quả")
    if specificity > 0.8:
        strengths.append(f"Specificity cao ({specificity*100:.1f}%) - ít false alarm")
    if metrics.get('roc_auc', 0) > 0.8:
        strengths.append(f"ROC-AUC cao ({metrics.get('roc_auc', 0):.3f}) - phân biệt tốt")
    if metrics.get('f1_score', 0) > 0.5:
        strengths.append(f"F1-Score tốt ({metrics.get('f1_score', 0):.3f}) - cân bằng precision/recall")
    
    if strengths:
        print(f"  ĐIỂM MẠNH:")
        for s in strengths:
            print(f"    + {s}")
    
    if issues:
        print(f"  VẤN ĐỀ:")
        for issue in issues:
            print(f"    - {issue}")
    
    if not issues and strengths:
        print(f"  => Model XUẤT SẮC cho chẩn đoán")
    elif len(issues) <= 2 and strengths:
        print(f"  => Model TỐT, có thể sử dụng")
    elif len(issues) > len(strengths):
        print(f"  => Model CẦN CẢI THIỆN")
    else:
        print(f"  => Model KHÔNG PHÙ HỢP cho chẩn đoán y tế")
    
    return composite

def compare_models():
    """So sánh và xếp hạng các models"""
    print("\n" + "="*80)
    print("ĐÁNH GIÁ VÀ SO SÁNH CÁC MODELS")
    print("="*80)
    
    metrics_data = load_metrics()
    
    # Đánh giá từng model
    scores = {}
    for name, metrics in metrics_data.items():
        score = evaluate_model_performance(name, metrics)
        scores[name] = {
            'composite_score': score,
            'metrics': metrics
        }
    
    # Xếp hạng
    print("\n" + "="*80)
    print("XẾP HẠNG MODELS (theo Composite Score)")
    print("="*80)
    
    ranked = sorted(scores.items(), key=lambda x: x[1]['composite_score'], reverse=True)
    
    print(f"\n{'Hạng':^6} | {'Model':^15} | {'Score':^8} | {'ROC-AUC':^8} | {'F1':^8} | {'Sensitivity':^12} | {'Đánh giá'}")
    print("-" * 95)
    
    for rank, (name, data) in enumerate(ranked, 1):
        score = data['composite_score']
        m = data['metrics']
        roc_auc = m.get('roc_auc', 0)
        f1 = m.get('f1_score', 0)
        sens = m.get('sensitivity', 0)
        
        if rank == 1:
            rating = "★★★★★ BEST"
        elif score > 0.5:
            rating = "★★★★ GOOD"
        elif score > 0.3:
            rating = "★★★ OK"
        else:
            rating = "★★ WEAK"
        
        print(f"  {rank:^6} | {name:^15} | {score:^8.4f} | {roc_auc:^8.4f} | {f1:^8.4f} | {sens:^12.4f} | {rating}")
    
    # Khuyến nghị model tốt nhất
    best_model = ranked[0][0]
    best_score = ranked[0][1]['composite_score']
    best_metrics = ranked[0][1]['metrics']
    
    print("\n" + "="*80)
    print("KHUYẾN NGHỊ")
    print("="*80)
    print(f"\nMODEL TỐT NHẤT: {best_model.upper()}")
    print(f"Composite Score: {best_score:.4f}")
    print(f"\nLý do:")
    print(f"  - ROC-AUC:      {best_metrics.get('roc_auc', 0):.4f}")
    print(f"  - F1-Score:     {best_metrics.get('f1_score', 0):.4f}")
    print(f"  - Sensitivity:  {best_metrics.get('sensitivity', 0):.4f} (khả năng phát hiện stroke)")
    print(f"  - Specificity:  {best_metrics.get('specificity', 0):.4f} (khả năng xác định không stroke)")
    
    # Warning nếu cả 3 models đều kém
    if best_score < 0.4:
        print(f"\n⚠️  CẢNH BÁO: Ngay cả model tốt nhất cũng có composite score < 0.4")
        print(f"   Tất cả models cần được RETRAIN hoặc ĐIỀU CHỈNH THAM SỐ")
        print(f"   Nguyên nhân có thể:")
        print(f"     1. Dữ liệu training không đủ hoặc không cân bằng")
        print(f"     2. Tham số model chưa tối ưu")
        print(f"     3. Feature engineering chưa hiệu quả")
        print(f"     4. Ngưỡng phân loại (threshold) cần điều chỉnh")
    
    # Lưu kết quả vào file
    result = {
        'best_model': best_model,
        'best_score': best_score,
        'ranking': [
            {
                'rank': i,
                'model': name,
                'score': data['composite_score'],
                'roc_auc': data['metrics'].get('roc_auc', 0),
                'f1_score': data['metrics'].get('f1_score', 0),
                'sensitivity': data['metrics'].get('sensitivity', 0),
                'specificity': data['metrics'].get('specificity', 0)
            }
            for i, (name, data) in enumerate(ranked, 1)
        ],
        'recommendation': {
            'use_model': best_model,
            'reason': f"Highest composite score ({best_score:.4f}) with best balance of metrics"
        }
    }
    
    output_file = Path('model_evaluation_result.json')
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)
    
    print(f"\n✓ Kết quả đánh giá đã được lưu vào: {output_file}")
    
    return best_model, best_score, ranked

if __name__ == '__main__':
    compare_models()
