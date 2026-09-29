import numpy as np
from sklearn.metrics import f1_score, brier_score_loss, average_precision_score, confusion_matrix
import xarray as xr

class ThunderstormMetrics:
    """
    Custom evaluation metrics for rare-event forecasting (Thunderstorms).
    """
    
    @staticmethod
    def calculate_contingency_table(y_true, y_pred):
        """
        Calculates Hits (TP), Misses (FN), False Alarms (FP), Correct Negatives (TN)
        """
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
        return tp, fn, fp, tn

    @staticmethod
    def csi(y_true, y_pred):
        """ Critical Success Index (CSI) / Threat Score """
        tp, fn, fp, tn = ThunderstormMetrics.calculate_contingency_table(y_true, y_pred)
        denominator = tp + fn + fp
        return tp / denominator if denominator > 0 else 0.0

    @staticmethod
    def pod(y_true, y_pred):
        """ Probability of Detection (POD) / Recall / Hit Rate """
        tp, fn, fp, tn = ThunderstormMetrics.calculate_contingency_table(y_true, y_pred)
        denominator = tp + fn
        return tp / denominator if denominator > 0 else 0.0

    @staticmethod
    def far(y_true, y_pred):
        """ False Alarm Ratio (FAR) """
        tp, fn, fp, tn = ThunderstormMetrics.calculate_contingency_table(y_true, y_pred)
        denominator = tp + fp
        return fp / denominator if denominator > 0 else 0.0

    @staticmethod
    def f1(y_true, y_pred):
        """ F1-Score """
        return f1_score(y_true, y_pred, zero_division=0)

    @staticmethod
    def brier_score(y_true, y_prob):
        """ Brier Score (lower is better) """
        return brier_score_loss(y_true, y_prob)

    @staticmethod
    def pr_auc(y_true, y_prob):
        """ Precision-Recall Area Under Curve """
        return average_precision_score(y_true, y_prob)

    @staticmethod
    def evaluate_all(y_true, y_pred, y_prob=None):
        """
        Returns a dictionary of all relevant metrics.
        """
        metrics = {
            'CSI': ThunderstormMetrics.csi(y_true, y_pred),
            'POD': ThunderstormMetrics.pod(y_true, y_pred),
            'FAR': ThunderstormMetrics.far(y_true, y_pred),
            'F1-Score': ThunderstormMetrics.f1(y_true, y_pred)
        }
        
        if y_prob is not None:
            metrics['Brier Score'] = ThunderstormMetrics.brier_score(y_true, y_prob)
            metrics['PR-AUC'] = ThunderstormMetrics.pr_auc(y_true, y_prob)
            
        return metrics


def split_dataset_chronologically(ds: xr.Dataset, train_ratio=0.7, val_ratio=0.15):
    """
    Splits an xarray Dataset into train, validation, and test sets chronologically
    to avoid data leakage.
    """
    if 'time' not in ds.dims:
        raise ValueError("Dataset must have a 'time' dimension for chronological splitting.")
        
    total_times = ds.sizes['time']
    train_end = int(total_times * train_ratio)
    val_end = int(total_times * (train_ratio + val_ratio))
    
    # Slice by integer index
    train_ds = ds.isel(time=slice(0, train_end))
    val_ds = ds.isel(time=slice(train_end, val_end))
    test_ds = ds.isel(time=slice(val_end, total_times))
    
    return train_ds, val_ds, test_ds

if __name__ == "__main__":
    print("--- Phase 10: Evaluation Framework ---")
    print("Metrics module and chronological splitting ready.")
    
    # Simple Mock Test
    print("\nRunning mock test for metrics...")
    y_true_mock = np.array([0, 1, 1, 0, 1, 0, 0, 1])
    y_pred_mock = np.array([0, 1, 0, 0, 1, 1, 0, 1])
    y_prob_mock = np.array([0.1, 0.9, 0.4, 0.2, 0.8, 0.7, 0.1, 0.85])
    
    results = ThunderstormMetrics.evaluate_all(y_true_mock, y_pred_mock, y_prob_mock)
    for k, v in results.items():
        print(f"{k}: {v:.4f}")
    
    print("\nEvaluation Framework is successfully implemented.")
