"""
model_training.py

Reusable training, evaluation, and diagnostic utilities for baseline and ML models
in the Predictive Bandwidth & WiFi Congestion Manager.
"""

import os
import json
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
import lightgbm as lgb


def load_ml_dataset(csv_path):
    """Load ML dataset and separate into Train, Validation, and Test splits."""
    df = pd.read_csv(csv_path)
    
    cleaned_time = (
        df['timestamp']
        .astype(str)
        .str.replace(' CEST', '', regex=False)
        .str.replace(' CET', '', regex=False)
    )
    df['dt'] = pd.to_datetime(cleaned_time, format='%a %b %d %H:%M:%S %Y')
    
    train_df = df[df['split'] == 'train'].reset_index(drop=True)
    val_df = df[df['split'] == 'val'].reset_index(drop=True)
    test_df = df[df['split'] == 'test'].reset_index(drop=True)
    
    return train_df, val_df, test_df, df


def evaluate_model_performance(y_true, y_pred, model_name="Model", split_name="Test"):
    """Compute comprehensive regression evaluation metrics."""
    y_pred_clean = np.clip(y_pred, 0, None)
    
    mae = mean_absolute_error(y_true, y_pred_clean)
    rmse = root_mean_squared_error(y_true, y_pred_clean)
    r2 = r2_score(y_true, y_pred_clean)
    
    abs_err = np.abs(y_true - y_pred_clean)
    within_1 = (abs_err <= 1.0).mean() * 100.0
    within_2 = (abs_err <= 2.0).mean() * 100.0
    
    return {
        'model': model_name,
        'split': split_name,
        'mae': round(float(mae), 4),
        'rmse': round(float(rmse), 4),
        'r2': round(float(r2), 4),
        'within_1_pct': round(float(within_1), 2),
        'within_2_pct': round(float(within_2), 2)
    }


def train_baseline_models(train_df, val_df, test_df, feature_cols, target_col='target_t1'):
    """Train and evaluate Persistence, Historical Mean, Random Forest,
    HistGradientBoosting, and LightGBM models.
    """
    X_train, y_train = train_df[feature_cols], train_df[target_col]
    X_val, y_val = val_df[feature_cols], val_df[target_col]
    X_test, y_test = test_df[feature_cols], test_df[target_col]
    
    models_dict = {}
    predictions_dict = {}
    
    # 1. Baseline 1: Persistence
    val_pred_pers = val_df['users'].values
    test_pred_pers = test_df['users'].values
    train_pred_pers = train_df['users'].values
    predictions_dict['Persistence'] = {
        'train': train_pred_pers, 'val': val_pred_pers, 'test': test_pred_pers
    }
    
    # 2. Baseline 2: Historical Mean (AP-level mean computed on train set ONLY)
    ap_train_means = train_df.groupby('ap_id')[target_col].mean().to_dict()
    global_train_mean = float(y_train.mean())
    
    train_pred_mean = train_df['ap_id'].map(ap_train_means).fillna(global_train_mean).values
    val_pred_mean = val_df['ap_id'].map(ap_train_means).fillna(global_train_mean).values
    test_pred_mean = test_df['ap_id'].map(ap_train_means).fillna(global_train_mean).values
    predictions_dict['Historical Mean'] = {
        'train': train_pred_mean, 'val': val_pred_mean, 'test': test_pred_mean
    }
    
    # 3. Model A: Random Forest Regressor
    print("Fitting Random Forest Regressor...")
    rf = RandomForestRegressor(
        n_estimators=60,
        max_depth=14,
        min_samples_leaf=20,
        max_samples=0.5,
        n_jobs=-1,
        random_state=42
    )
    rf.fit(X_train, y_train)
    models_dict['Random Forest'] = rf
    predictions_dict['Random Forest'] = {
        'train': np.clip(rf.predict(X_train), 0, None),
        'val': np.clip(rf.predict(X_val), 0, None),
        'test': np.clip(rf.predict(X_test), 0, None)
    }
    
    # 4. Model B: HistGradientBoostingRegressor
    print("Fitting HistGradientBoosting Regressor...")
    hgbr = HistGradientBoostingRegressor(
        max_iter=100,
        max_depth=10,
        min_samples_leaf=50,
        learning_rate=0.08,
        random_state=42
    )
    hgbr.fit(X_train, y_train)
    models_dict['HistGradientBoosting'] = hgbr
    predictions_dict['HistGradientBoosting'] = {
        'train': np.clip(hgbr.predict(X_train), 0, None),
        'val': np.clip(hgbr.predict(X_val), 0, None),
        'test': np.clip(hgbr.predict(X_test), 0, None)
    }
    
    # 5. Model C: LightGBM Regressor
    print("Fitting LightGBM Regressor...")
    lgbm = lgb.LGBMRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=8,
        num_leaves=63,
        min_child_samples=50,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        verbose=-1
    )
    lgbm.fit(X_train, y_train)
    models_dict['LightGBM'] = lgbm
    predictions_dict['LightGBM'] = {
        'train': np.clip(lgbm.predict(X_train), 0, None),
        'val': np.clip(lgbm.predict(X_val), 0, None),
        'test': np.clip(lgbm.predict(X_test), 0, None)
    }
    
    # Build comparison metrics table
    comparison_rows = []
    pers_val_mae = mean_absolute_error(y_val, val_pred_pers)
    pers_test_mae = mean_absolute_error(y_test, test_pred_pers)
    
    for name, p_dict in predictions_dict.items():
        v_eval = evaluate_model_performance(y_val, p_dict['val'], name, 'val')
        t_eval = evaluate_model_performance(y_test, p_dict['test'], name, 'test')
        tr_eval = evaluate_model_performance(y_train, p_dict['train'], name, 'train')
        
        # Improvement over persistence
        v_mae_imp = ((pers_val_mae - v_eval['mae']) / pers_val_mae) * 100.0
        t_mae_imp = ((pers_test_mae - t_eval['mae']) / pers_test_mae) * 100.0
        
        comparison_rows.append({
            'Model': name,
            'Train MAE': tr_eval['mae'],
            'Validation MAE': v_eval['mae'],
            'Test MAE': t_eval['mae'],
            'Validation RMSE': v_eval['rmse'],
            'Test RMSE': t_eval['rmse'],
            'Validation R2': v_eval['r2'],
            'Test R2': t_eval['r2'],
            'Test Within ±1 User (%)': t_eval['within_1_pct'],
            'Test Within ±2 Users (%)': t_eval['within_2_pct'],
            'Test MAE Improvement (%)': round(t_mae_imp, 2)
        })
        
    df_comparison = pd.DataFrame(comparison_rows)
    return models_dict, predictions_dict, df_comparison
