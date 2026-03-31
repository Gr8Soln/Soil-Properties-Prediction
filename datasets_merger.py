import logging
from pathlib import Path
from typing import List, Optional

import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DatasetsMerger:
    """
    Unified data ingestion system for geotechnical borehole reports.
    
    Responsibilities:
        - Schema harmonization across heterogeneous sources
        - Data lineage tracking
        - Quality assurance logging
    """
    
    def __init__(self, data_directory: Optional[str] = None):
        """
        Initialize the merger with source data location.
        
        Args:
            data_directory: Path containing source .xlsx files.
                Defaults to ./datasets relative to this script.
        """
        project_root = Path(__file__).resolve().parent
        self.data_directory = Path(data_directory) if data_directory else (project_root / "datasets")
        self.raw_dataframes: List[pd.DataFrame] = []
        self.unified_dataframe: pd.DataFrame = None
        
        # Standard schema mapping - handles common naming variations
        self.column_mapping = {
            # Atterberg Limits
            'Liquid_Limit': 'LL',
            'LiquidLimit': 'LL',
            'Liquid Limit': 'LL',
            'LL_%': 'LL',
            
            'Plastic_Limit': 'PL',
            'PlasticLimit': 'PL',
            'Plastic Limit': 'PL',
            'PL_%': 'PL',
            
            'Plasticity_Index': 'PI',
            'PlasticityIndex': 'PI',
            'Plasticity Index': 'PI',
            'PI_%': 'PI',
            
            # Fines Content (particles < 75 microns)
            'Grain_75um': 'Fines_Content',
            'Grain_0.075mm': 'Fines_Content',
            'Fines_Percent': 'Fines_Content',
            'Fines%': 'Fines_Content',
            'Passing_75um': 'Fines_Content',
            'Passing_No200': 'Fines_Content',
            
            # Unit Weight
            'Sat_Unit_Wt': 'Unit_Weight',
            'Saturated_Unit_Weight': 'Unit_Weight',
            'Bulk_Density': 'Unit_Weight',
            'Gamma_sat': 'Unit_Weight',
            'Unit_Wt': 'Unit_Weight',
            
            # Moisture Content
            'Water_Content': 'Moisture_Content',
            'W': 'Moisture_Content',
            'Wn': 'Moisture_Content',
            'Natural_Moisture': 'Moisture_Content',
            
            # Shear Strength Parameters
            'Phi': 'Angle_Internal_Friction',
            'Friction_Angle': 'Angle_Internal_Friction',
            'φ': 'Angle_Internal_Friction',
            'phi_deg': 'Angle_Internal_Friction',
            
            'Cu': 'Undrained_Cohesion',
            'Cohesion': 'Undrained_Cohesion',
            'c_u': 'Undrained_Cohesion',
            'Undrained_Shear_Strength': 'Undrained_Cohesion',
            
            # In-situ Testing
            'SPT': 'SPT_N',
            'N_value': 'SPT_N',
            'SPT_Blows': 'SPT_N',
            
            'CPT': 'CPT_qc',
            'Cone_Resistance': 'CPT_qc',
            'qc': 'CPT_qc',
            
            # Depth
            'Depth_m': 'Depth',
            'Depth_ft': 'Depth',
            'Sample_Depth': 'Depth',
            
            # Soil Classification
            'USCS': 'Soil_Type',
            'Classification': 'Soil_Type',
            'Soil_Class': 'Soil_Type',
        }
    
    def discover_files(self) -> List[Path]:
        """
        Locate all .xlsx files in the configured data directory (recursive).
        
        Returns:
            List of Path objects for discovered Excel files
        """
        if not self.data_directory.exists():
            logger.warning(f"Data directory does not exist: {self.data_directory}")
            return []

        files = sorted(
            [p for p in self.data_directory.rglob("*") if p.is_file() and p.suffix.lower() == ".xlsx"],
            key=lambda p: str(p).lower()
        )

        if not files:
            logger.warning(f"No .xlsx files found in: {self.data_directory}")
        
        logger.info(f"Discovered {len(files)} borehole dataset(s)")
        return files
    
    def standardize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply schema standardization to a single dataframe.
        
        Args:
            df: Raw input dataframe
            
        Returns:
            DataFrame with standardized column names
        """
        # Create a copy to avoid modifying original
        standardized = df.copy()
        
        # Apply mapping
        rename_dict = {}
        for old_col in standardized.columns:
            if old_col in self.column_mapping:
                rename_dict[old_col] = self.column_mapping[old_col]
        
        if rename_dict:
            standardized.rename(columns=rename_dict, inplace=True)
            logger.debug(f"Renamed columns: {rename_dict}")
        
        return standardized
    
    def add_source_tracking(self, df: pd.DataFrame, source_id: int, 
                           source_file: Path) -> pd.DataFrame:
        """
        Add data lineage metadata to the dataframe.
        
        Args:
            df: Standardized dataframe
            source_id: Numeric identifier for source file
            source_file: Original file path
            
        Returns:
            DataFrame with source tracking columns
        """
        df = df.copy()
        df['Source_ID'] = source_id
        df['Source_File'] = source_file.name
        
        return df
    
    def ingest_and_merge(self) -> pd.DataFrame:
        """
        Execute the complete ETL pipeline.
        
        Returns:
            Unified master dataframe with all borehole data
        """
        files = self.discover_files()
        
        if not files:
            raise FileNotFoundError(
                "No .xlsx geotechnical data files found. "
                f"Please place Excel files under: {self.data_directory}"
            )
        
        all_data = []
        
        for idx, file_path in enumerate(files):
            try:
                logger.info(f"Processing: {file_path.name}")
                
                # Load raw data
                df_raw = pd.read_excel(file_path)
                logger.info(f"  Loaded {len(df_raw)} records with {len(df_raw.columns)} columns")
                
                # Standardize schema
                df_std = self.standardize_columns(df_raw)
                
                # Add lineage tracking
                df_tracked = self.add_source_tracking(df_std, idx, file_path)
                
                all_data.append(df_tracked)
                logger.info(f"  ✓ Successfully processed {file_path.name}")
                
            except Exception as e:
                logger.error(f"  ✗ Failed to process {file_path.name}: {str(e)}")
                continue
        
        if not all_data:
            raise RuntimeError("No data was successfully loaded from any file")
        
        # Concatenate all dataframes
        self.unified_dataframe = pd.concat(all_data, ignore_index=True)
        
        logger.info(f"\n{'='*60}")
        logger.info(f"MERGE COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"Total records: {len(self.unified_dataframe)}")
        logger.info(f"Total columns: {len(self.unified_dataframe.columns)}")
        logger.info(f"Sources merged: {self.unified_dataframe['Source_ID'].nunique()}")
        logger.info(f"{'='*60}\n")
        
        return self.unified_dataframe
    
    def export_master_dataset(self, output_path: Optional[str] = None):
        """
        Save the unified dataset to CSV.
        
        Args:
            output_path: Destination file path. Defaults to
                ./geotechnical_master_raw.csv at project root.
        """
        if self.unified_dataframe is None:
            raise RuntimeError("No data to export. Run ingest_and_merge() first.")

        if output_path is None:
            output_path = str(Path(__file__).resolve().parent / "geotechnical_master_raw.csv")
        
        self.unified_dataframe.to_csv(output_path, index=False)
        logger.info(f"✓ Exported master dataset to: {output_path}")
        
        # Generate summary report
        self._generate_summary_report(output_path)
    
    def _generate_summary_report(self, output_path: str):
        """Generate a brief summary of the merged dataset."""
        report_path = output_path.replace('.csv', '_summary.txt')
        
        with open(report_path, 'w') as f:
            f.write("GEOTECHNICAL DATA MERGE SUMMARY\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"Output File: {output_path}\n")
            f.write(f"Total Records: {len(self.unified_dataframe)}\n")
            f.write(f"Total Features: {len(self.unified_dataframe.columns)}\n\n")
            
            f.write("Column Names:\n")
            f.write("-" * 60 + "\n")
            for col in sorted(self.unified_dataframe.columns):
                non_null = self.unified_dataframe[col].notna().sum()
                pct = (non_null / len(self.unified_dataframe)) * 100
                f.write(f"  {col:30s} ({non_null:5d} records, {pct:5.1f}% complete)\n")
            
            f.write("\n" + "=" * 60 + "\n")
            f.write("Data lineage preserved via Source_ID and Source_File columns\n")
        
        logger.info(f"✓ Summary report saved to: {report_path}")


def main():
    merger = DatasetsMerger()
    
    try:
        merger.ingest_and_merge()
        merger.export_master_dataset()
        
        print("\n" + "="*60)
        print("SUCCESS: Borehole data merger completed")
        print("="*60)
        print(f"\nNext steps:")
        print("  1. Review: geotechnical_master_raw.csv")
        print("  2. Proceed to: Data_Cleaning.ipynb")
        print("="*60 + "\n")
        
    except Exception as e:
        logger.error(f"Pipeline failed: {str(e)}")
        raise


if __name__ == "__main__":
    main()
