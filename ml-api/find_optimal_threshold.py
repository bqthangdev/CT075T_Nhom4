import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score, accuracy_score, roc_curve, roc_auc_score
from pathlib import Path

# Load model and data
svm = joblib.load('app/models/svm.joblib')
data_path = Path('app/Dataset/healthcare-dataset-stroke-data.csv')
df = pd.read_csv(data_path)

# Prepare data
df = df.dropna(subset=['age', 'avg_glucose_level'])
for col in ['age', 'avg_glucose_level', 'bmi']:
    if col in df.columns:
        df[col] = df[col].astype('float64')

# Split features and target
cols = ['age', 'avg_glucose_level', 'bmi', 'gender', 'hypertension',
        'heart_disease', 'ever_married', 'work_type', 'Residence_type', 'smoking_status']
X = df[cols].copy()
y = df['stroke'].values

# Get predictions
y_proba = svm.predict_proba(X)[:, 1]

print('='*80)
print('FINDING OPTIMAL THRESHOLD FOR SVM')
print('='*80)

# Calculate metrics for different thresholds
thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
results = []

for threshold in thresholds:
    y_pred = (y_proba >= threshold).astype(int)
    cm = confusion_matrix(y, y_pred)
    tn, fp, fn, tp = cm.ravel()
    
    acc = accuracy_score(y, y_pred)
    prec = precision_score(y, y_pred, zero_division=0)
    rec = recall_score(y, y_pred, zero_division=0)
    f1 = f1_score(y, y_pred, zero_division=0)
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    
    results.append({
        'threshold': threshold,
        'accuracy': acc,
        'precision': prec,
        'recall': rec,
        'specificity': spec,
        'f1_score': f1,
        'tp': tp,
        'fp': fp,
        'tn': tn,
        'fn': fn
    })
    
    print(f"\nThreshold: {threshold:.2f}")
    print(f"  Accuracy:    {acc*100:6.2f}%")
    print(f"  Precision:   {prec*100:6.2f}%")
    print(f"  Recall:      {rec*100:6.2f}%")
    print(f"  Specificity: {spec*100:6.2f}%")
    print(f"  F1-Score:    {f1*100:6.2f}%")
    print(f"  Confusion Matrix: TP={tp}, FP={fp}, TN={tn}, FN={fn}")

# Find optimal threshold based on F1-score
best_f1 = max(results, key=lambda x: x['f1_score'])
best_recall = max(results, key=lambda x: x['recall'])
best_balanced = max(results, key=lambda x: (x['recall'] + x['specificity'])/2)

print('\n' + '='*80)
print('RECOMMENDATIONS:')
print('='*80)
print(f"\n1. BEST F1-SCORE: Threshold = {best_f1['threshold']:.2f}")
print(f"   F1: {best_f1['f1_score']*100:.2f}%, Recall: {best_f1['recall']*100:.2f}%, Precision: {best_f1['precision']*100:.2f}%")

print(f"\n2. BEST RECALL (for medical screening): Threshold = {best_recall['threshold']:.2f}")
print(f"   Recall: {best_recall['recall']*100:.2f}%, Precision: {best_recall['precision']*100:.2f}%, F1: {best_recall['f1_score']*100:.2f}%")

print(f"\n3. BEST BALANCED (Recall + Specificity): Threshold = {best_balanced['threshold']:.2f}")
print(f"   Recall: {best_balanced['recall']*100:.2f}%, Specificity: {best_balanced['specificity']*100:.2f}%")

# ROC curve analysis
fpr, tpr, roc_thresholds = roc_curve(y, y_proba)
roc_auc = roc_auc_score(y, y_proba)

# Find threshold with best Youden's J statistic (TPR - FPR)
j_scores = tpr - fpr
best_j_idx = np.argmax(j_scores)
best_j_threshold = roc_thresholds[best_j_idx]

print(f"\n4. OPTIMAL BY YOUDEN'S J (ROC): Threshold = {best_j_threshold:.4f}")
print(f"   TPR: {tpr[best_j_idx]*100:.2f}%, FPR: {fpr[best_j_idx]*100:.2f}%")
print(f"   ROC-AUC: {roc_auc:.4f}")

print('\n' + '='*80)
print('RECOMMENDED THRESHOLD FOR THIS PROJECT: 0.15 - 0.20')
print('This balances recall (detecting stroke) with acceptable false positive rate.')
print('='*80)
