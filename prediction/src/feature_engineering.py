"""
feature_engineering.py

Module for strictly causal feature engineering, prediction target alignment,
and chronological train/validation/test dataset construction.
"""

import os
import json
import pandas as pd
import numpy as np


def compute_features_and_targets(df_raw, df_map):
    """Compute the approved 23 baseline features and targets t+1 and t+2
    strictly causally from the integrated campus users dataset.

    Parameters:
        df_raw (pd.DataFrame): Integrated dataset with timestamp, ap_id, users, floor, region.
        df_map (pd.DataFrame): AP location mapping with spatial coordinates.

    Returns:
        pd.DataFrame: DataFrame containing all 23 features, targets, and metadata.
    """
    df = df_raw.copy()
    
    # Parse timestamps
    cleaned_time = (
        df['timestamp']
        .astype(str)
        .str.replace(' CEST', '', regex=False)
        .str.replace(' CET', '', regex=False)
    )
    df['dt'] = pd.to_datetime(cleaned_time, format='%a %b %d %H:%M:%S %Y')
    df = df.sort_values(by=['ap_id', 'dt']).reset_index(drop=True)

    # 1. Prediction Targets (Shift backwards chronologically per AP)
    df['target_t1'] = df.groupby('ap_id')['users'].shift(-1)
    df['target_t2'] = df.groupby('ap_id')['users'].shift(-2)

    # 2. Temporal Features
    df['hour'] = df['dt'].dt.hour
    df['minute'] = df['dt'].dt.minute
    df['day_of_week'] = df['dt'].dt.dayofweek
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_weekday'] = (df['day_of_week'] < 5).astype(int)
    df['is_peak_hours'] = ((df['is_weekday'] == 1) & (df['hour'] >= 8) & (df['hour'] <= 20)).astype(int)

    time_of_day_hours = df['hour'] + df['minute'] / 60.0
    df['sin_hour'] = np.sin(2 * np.pi * time_of_day_hours / 24.0)
    df['cos_hour'] = np.cos(2 * np.pi * time_of_day_hours / 24.0)

    # 3. AP Historical Features (Strictly causal, past-only lags and rolling statistics)
    for lag in [1, 2, 3]:
        df[f'users_lag_{lag}'] = df.groupby('ap_id')['users'].shift(lag)

    df['rolling_mean_3'] = df.groupby('ap_id')['users'].transform(lambda x: x.rolling(3).mean())
    df['rolling_mean_6'] = df.groupby('ap_id')['users'].transform(lambda x: x.rolling(6).mean())
    df['rolling_std_3'] = df.groupby('ap_id')['users'].transform(lambda x: x.rolling(3).std())
    df['rolling_std_6'] = df.groupby('ap_id')['users'].transform(lambda x: x.rolling(6).std())
    df['rolling_max_6'] = df.groupby('ap_id')['users'].transform(lambda x: x.rolling(6).max())

    df['users_change_1'] = df['users'] - df['users_lag_1']
    df['users_change_2'] = df['users'] - df['users_lag_2']

    # 4. Spatial Features
    spatial_cols = ['ap_id', 'centroid_x', 'centroid_y', 'coverage_cells']
    df = df.merge(df_map[spatial_cols], on='ap_id', how='left')
    df['floor'] = df['floor'].astype(int)

    # 5. Campus-Level Macro Features (Synchronized across all APs at timestamp t)
    campus_agg = df.groupby('dt').agg(
        campus_total_users=('users', 'sum')
    ).reset_index()
    df = df.merge(campus_agg, on='dt', how='left')

    # Floor-level aggregates (Synchronized across APs on same floor at timestamp t)
    floor_agg = df.groupby(['dt', 'floor']).agg(
        floor_total_users=('users', 'sum')
    ).reset_index()
    df = df.merge(floor_agg, on=['dt', 'floor'], how='left')

    # 6. Spatial Neighbor Features (k=3 nearest APs on same floor at timestamp t)
    neighbor_map = {}
    for floor_num in [0, 1, 2]:
        floor_aps = df_map[df_map['floor'] == floor_num].copy()
        coords = floor_aps[['centroid_x', 'centroid_y']].values
        ap_ids = floor_aps['ap_id'].values
        diff = coords[:, np.newaxis, :] - coords[np.newaxis, :, :]
        dist_matrix = np.sqrt(np.sum(diff ** 2, axis=-1))
        
        for i, ap in enumerate(ap_ids):
            sorted_idx = np.argsort(dist_matrix[i])
            nearest_idx = [idx for idx in sorted_idx if idx != i][:3]
            neighbor_map[ap] = ap_ids[nearest_idx].tolist()

    neighbor_rows = []
    for ap, neighbors in neighbor_map.items():
        for n in neighbors:
            neighbor_rows.append({'ap_id': ap, 'neighbor_id': n})
    df_neighbor_pairs = pd.DataFrame(neighbor_rows)

    df_ap_dt = df[['dt', 'ap_id']].drop_duplicates()
    df_ap_neighbors = df_ap_dt.merge(df_neighbor_pairs, on='ap_id')
    df_ap_neighbors = df_ap_neighbors.merge(
        df[['dt', 'ap_id', 'users']].rename(columns={'ap_id': 'neighbor_id', 'users': 'neighbor_users'}),
        on=['dt', 'neighbor_id'],
        how='left'
    )

    neighbor_agg = df_ap_neighbors.groupby(['dt', 'ap_id']).agg(
        neighbor_mean_users=('neighbor_users', 'mean'),
        neighbor_max_users=('neighbor_users', 'max')
    ).reset_index()

    df = df.merge(neighbor_agg, on=['dt', 'ap_id'], how='left')

    return df


FEATURE_COLUMNS_23 = [
    # Current State (1)
    'users',
    # AP Historical Momentum & Volatility (10)
    'users_lag_1', 'users_lag_2', 'users_lag_3',
    'rolling_mean_3', 'rolling_mean_6',
    'rolling_std_3', 'rolling_std_6',
    'rolling_max_6',
    'users_change_1', 'users_change_2',
    # Spatial & Physical (4)
    'floor', 'centroid_x', 'centroid_y', 'coverage_cells',
    # Spatial Neighborhood (2)
    'neighbor_mean_users', 'neighbor_max_users',
    # Campus & Floor Macro Dynamics (2)
    'campus_total_users', 'floor_total_users',
    # Temporal & Diurnal Context (4)
    'cos_hour', 'sin_hour', 'is_weekend', 'is_peak_hours'
]


def split_and_clean_dataset(df_full, target_col='target_t1', train_pct=0.70, val_pct=0.15):
    """Filter uninitialized boundary rows and assign timestamp-level chronological splits.

    Parameters:
        df_full (pd.DataFrame): Full engineered DataFrame.
        target_col (str): 'target_t1' or 'target_t2'.
        train_pct (float): Fraction of earliest timestamps for training (0.70).
        val_pct (float): Fraction of middle timestamps for validation (0.15).

    Returns:
        df_clean (pd.DataFrame): Clean dataset with 'split' column and reordered schema.
        split_info (dict): Summary of split timestamps and boundary dates.
    """
    # 1. Filter out uninitialized boundary rows (initial rolling window NaNs and trailing target NaNs)
    mask_features = df_full[FEATURE_COLUMNS_23].notna().all(axis=1)
    mask_target = df_full[target_col].notna()
    
    df_clean = df_full[mask_features & mask_target].copy().reset_index(drop=True)

    # 2. Chronological Splitting by TIMESTAMP
    timestamps = sorted(df_clean['dt'].unique())
    n_ts = len(timestamps)
    n_train = int(np.floor(train_pct * n_ts))
    n_val = int(np.floor(val_pct * n_ts))
    n_test = n_ts - n_train - n_val

    train_ts = timestamps[:n_train]
    val_ts = timestamps[n_train:n_train + n_val]
    test_ts = timestamps[n_train + n_val:]

    ts_to_split = {ts: 'train' for ts in train_ts}
    ts_to_split.update({ts: 'val' for ts in val_ts} )
    ts_to_split.update({ts: 'test' for ts in test_ts})

    df_clean['split'] = df_clean['dt'].map(ts_to_split)

    # Verify zero temporal leakage
    leakage_train_val = train_ts[-1] >= val_ts[0]
    leakage_val_test = val_ts[-1] >= test_ts[0]
    has_leakage = leakage_train_val or leakage_val_test

    # Reorder final columns
    output_cols = ['timestamp', 'ap_id'] + FEATURE_COLUMNS_23 + [target_col, 'split']
    df_clean = df_clean[output_cols]

    split_info = {
        'target_column': target_col,
        'total_timestamps': n_ts,
        'total_rows': len(df_clean),
        'train': {
            'timestamps_count': len(train_ts),
            'rows_count': len(train_ts) * 247,
            'start_timestamp': str(train_ts[0]),
            'end_timestamp': str(train_ts[-1])
        },
        'val': {
            'timestamps_count': len(val_ts),
            'rows_count': len(val_ts) * 247,
            'start_timestamp': str(val_ts[0]),
            'end_timestamp': str(val_ts[-1])
        },
        'test': {
            'timestamps_count': len(test_ts),
            'rows_count': len(test_ts) * 247,
            'start_timestamp': str(test_ts[0]),
            'end_timestamp': str(test_ts[-1])
        },
        'has_temporal_leakage': has_leakage
    }

    return df_clean, split_info
