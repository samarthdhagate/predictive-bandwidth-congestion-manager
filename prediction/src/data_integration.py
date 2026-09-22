"""
data_integration.py

Module for AP location mapping extraction, campus user log integration,
and dataset validation for the WiFi Congestion Management system.
"""

import os
import glob
import pandas as pd
import numpy as np
from prediction.src import dataset_inspection as di


def build_ap_location_mapping(data_dir, output_csv=None):
    """Extract AP location and spatial coverage details from floor region maps.

    Parameters:
        data_dir (str): Path to directory containing raw floor map CSVs.
        output_csv (str, optional): Path to save the resulting mapping CSV.

    Returns:
        pd.DataFrame: Table with columns:
            [ap_id, floor, region, coverage_cells, centroid_x, centroid_y,
             bbox_x_min, bbox_x_max, bbox_y_min, bbox_y_max, spatial_information]
    """
    maps = di.load_region_maps(data_dir)
    ap_rows = []
    seen_aps = {}

    for floor_num, df_m in maps.items():
        grid = df_m.values
        unique_aps = np.unique(grid[grid != 0])
        
        for ap in sorted(unique_aps):
            ap_int = int(ap)
            if ap_int in seen_aps:
                raise ValueError(
                    f"Duplicate mapping detected: AP {ap_int} is mapped on floor {seen_aps[ap_int]} and floor {floor_num}"
                )
            seen_aps[ap_int] = floor_num

            ys, xs = np.where(grid == ap)
            min_y, max_y = int(ys.min()), int(ys.max())
            min_x, max_x = int(xs.min()), int(xs.max())
            cy, cx = float(ys.mean()), float(xs.mean())
            area = len(ys)
            spatial_info = (
                f"Centroid: ({cx:.2f}, {cy:.2f}), "
                f"Box: X[{min_x}-{max_x}] Y[{min_y}-{max_y}], "
                f"Area: {area} cells"
            )

            ap_rows.append({
                'ap_id': ap_int,
                'floor': int(floor_num),
                'region': f"Floor_{floor_num}_Zone_{ap_int}",
                'coverage_cells': int(area),
                'centroid_x': round(cx, 2),
                'centroid_y': round(cy, 2),
                'bbox_x_min': int(min_x),
                'bbox_x_max': int(max_x),
                'bbox_y_min': int(min_y),
                'bbox_y_max': int(max_y),
                'spatial_information': spatial_info
            })

    df_mapping = pd.DataFrame(ap_rows).sort_values(by='ap_id').reset_index(drop=True)

    if output_csv:
        os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
        df_mapping.to_csv(output_csv, index=False)

    return df_mapping


def merge_campus_users_with_location(data_dir, mapping_df=None, output_csv=None):
    """Load all campus_users raw logs and merge with AP location mapping.
    Preserves original timestamps and does not guess missing values.

    Parameters:
        data_dir (str): Path to directory containing raw campus_users_*.csv files.
        mapping_df (pd.DataFrame, optional): AP location mapping DataFrame.
        output_csv (str, optional): Path to save the merged dataset.

    Returns:
        df_merged (pd.DataFrame): Merged dataset with columns:
            ['timestamp', 'ap_id', 'users', 'floor', 'region']
        df_raw (pd.DataFrame): Combined raw dataset before merge.
    """
    if mapping_df is None:
        mapping_df = build_ap_location_mapping(data_dir)

    user_files = di.get_raw_files(data_dir)
    if not user_files:
        raise FileNotFoundError(f"No campus_users_*.csv files found in {data_dir}")

    user_dfs = []
    for f in user_files:
        df_temp = pd.read_csv(f)
        user_dfs.append(df_temp)

    df_raw = pd.concat(user_dfs, ignore_index=True)

    # Standardize column naming for merge
    df_to_merge = df_raw.rename(columns={
        'Time': 'timestamp',
        'AP_id': 'ap_id',
        'Users': 'users'
    })

    # Left join to guarantee zero loss of user observations
    # Unmapped APs will remain NaN/NULL
    df_merged = df_to_merge.merge(
        mapping_df[['ap_id', 'floor', 'region']],
        on='ap_id',
        how='left'
    )

    # Reorder columns explicitly
    cols = ['timestamp', 'ap_id', 'users', 'floor', 'region']
    df_merged = df_merged[cols]

    if output_csv:
        os.makedirs(os.path.dirname(os.path.abspath(output_csv)), exist_ok=True)
        df_merged.to_csv(output_csv, index=False)

    return df_merged, df_raw


def run_integration_validation(df_raw, df_merged, df_mapping):
    """Validate data integrity, row counts, mapping coverage, duplicates,
    missing values, timestamp validity, and user count validity.

    Returns:
        dict: Summary metrics and validation status.
    """
    raw_rows = len(df_raw)
    merged_rows = len(df_merged)
    row_diff = merged_rows - raw_rows

    unique_aps_raw = int(df_raw['AP_id'].nunique())
    unique_aps_maps = int(df_mapping['ap_id'].nunique())
    mapped_aps_count = int(df_merged[df_merged['floor'].notna()]['ap_id'].nunique())
    unmapped_aps_count = int(df_merged[df_merged['floor'].isna()]['ap_id'].nunique())
    coverage_pct = (mapped_aps_count / unique_aps_raw * 100.0) if unique_aps_raw > 0 else 0.0

    duplicate_records = int(df_merged.duplicated().sum())
    missing_values = {col: int(df_merged[col].isna().sum()) for col in df_merged.columns}

    raw_user_sum = int(df_raw['Users'].sum())
    merged_user_sum = int(df_merged['users'].sum())
    user_loss = raw_user_sum - merged_user_sum

    # Timestamp validity check
    cleaned_time = (
        df_merged['timestamp']
        .astype(str)
        .str.replace(' CEST', '', regex=False)
        .str.replace(' CET', '', regex=False)
    )
    parsed_dt = pd.to_datetime(cleaned_time, format='%a %b %d %H:%M:%S %Y', errors='coerce')
    invalid_timestamps = int(parsed_dt.isna().sum())

    # User count validity check
    negative_users = int((df_merged['users'] < 0).sum())
    non_numeric_users = int((~df_merged['users'].apply(lambda x: isinstance(x, (int, np.integer)))).sum())

    # Assertions / Integrity verification
    checks = {
        'row_count_preserved': (row_diff == 0),
        'user_counts_preserved': (user_loss == 0),
        'zero_invalid_timestamps': (invalid_timestamps == 0),
        'zero_negative_users': (negative_users == 0),
        'zero_duplicates': (duplicate_records == 0),
        'full_mapping_coverage': (coverage_pct == 100.0)
    }

    all_passed = all(checks.values())

    results = {
        'raw_rows': raw_rows,
        'merged_rows': merged_rows,
        'row_diff': row_diff,
        'unique_aps_raw': unique_aps_raw,
        'unique_aps_maps': unique_aps_maps,
        'mapped_aps': mapped_aps_count,
        'unmapped_aps': unmapped_aps_count,
        'mapping_coverage_pct': coverage_pct,
        'duplicate_records': duplicate_records,
        'missing_values': missing_values,
        'raw_user_sum': raw_user_sum,
        'merged_user_sum': merged_user_sum,
        'invalid_timestamps': invalid_timestamps,
        'timestamp_min': str(parsed_dt.min()),
        'timestamp_max': str(parsed_dt.max()),
        'negative_users': negative_users,
        'checks': checks,
        'all_passed': all_passed
    }

    return results
