import os
import glob
import pandas as pd
import numpy as np

def get_raw_files(data_dir):
    """Get list of all campus_users CSV files in data_dir."""
    pattern = os.path.join(data_dir, "campus_users_*.csv")
    files = glob.glob(pattern)
    return sorted(files)

def parse_time_column(series):
    """Parse CEST/CET timestamps into standard datetime objects.
    Strips the CEST/CET timezone abbreviation to parse as local datetime.
    """
    cleaned = series.astype(str).str.replace(' CEST', '', regex=False).str.replace(' CET', '', regex=False)
    return pd.to_datetime(cleaned, format='%a %b %d %H:%M:%S %Y', errors='coerce')

def load_dataset(data_dir):
    """Load and combine all campus_users files, parsing timestamps.
    Returns:
        combined_df (pd.DataFrame): Concatenated DataFrame of all records.
        num_files (int): Number of files read.
        invalid_timestamp_count (int): Count of records where timestamp parsing failed.
    """
    files = get_raw_files(data_dir)
    dfs = []
    invalid_timestamp_count = 0
    
    for f in files:
        df = pd.read_csv(f)
        parsed_time = parse_time_column(df['Time'])
        invalid_timestamp_count += parsed_time.isna().sum()
        df['ParsedTime'] = parsed_time
        dfs.append(df)
        
    combined_df = pd.concat(dfs, ignore_index=True)
    return combined_df, len(files), invalid_timestamp_count

def get_sampling_intervals(df):
    """Calculate sampling intervals (in minutes) between consecutive observations per AP."""
    # Sort by AP and time
    sorted_df = df.sort_values(by=['AP_id', 'ParsedTime'])
    # Diff timestamps within each AP group
    sorted_df['TimeDiff'] = sorted_df.groupby('AP_id')['ParsedTime'].diff()
    # Convert timedelta to minutes
    intervals = sorted_df['TimeDiff'].dropna().dt.total_seconds() / 60.0
    return intervals

def load_region_maps(data_dir):
    """Load and return the floor region maps as a dictionary.
    Keys are floor numbers (0, 1, 2), values are pandas DataFrames.
    """
    maps = {}
    for floor in [0, 1, 2]:
        path = os.path.join(data_dir, f"regions_map_floor_{floor}.csv")
        if os.path.exists(path):
            df_map = pd.read_csv(path, header=None)
            maps[floor] = df_map
    return maps
