import glob
import logging
import os

import pandas as pd

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

def merge_xlsx_to_csv(input_dir="datasets", output_file="geotechnical_master_raw.csv"):
    """
    Finds all .xlsx files in the directory and merges them into one CSV.
    """
    # Pattern to match the specific naming convention seen in your folder
    path_pattern = os.path.join(input_dir, "geotechnical_data_*.xlsx")
    files = glob.glob(path_pattern)
    
    if not files:
        logging.error("No .xlsx files found matching 'geotechnical_data_*.xlsx'")
        return

    all_data = []
    for file in sorted(files):
        logging.info(f"Processing: {os.path.basename(file)}")
        # engine='openpyxl' is required for modern .xlsx files
        df = pd.read_excel(file, engine='openpyxl')
        
        # Add metadata for traceability
        df['Source_File'] = os.path.basename(file)
        all_data.append(df)

    # Combine and export
    master_df = pd.concat(all_data, ignore_index=True)
    master_df.to_csv(output_file, index=False)
    logging.info(f"Successfully merged {len(files)} files into {output_file}")

if __name__ == "__main__":
    merge_xlsx_to_csv()