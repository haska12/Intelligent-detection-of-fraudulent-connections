"""
normalize.py
────────────
Pandas-native replica of the PySpark `normalize_unsw_raw` function.
Used by the Kafka producer (which works on a plain pandas DataFrame)
and by any lightweight inference path that does not spin up Spark.
"""
import pandas as pd
from typing import Optional


# ── Column rename map (identical to the PySpark version) ──────────────────
_RENAME_MAP = {
    "Spkts":       "spkts",
    "Dpkts":       "dpkts",
    "Sload":       "sload",
    "Dload":       "dload",
    "Sjit":        "sjit",
    "Djit":        "djit",
    "Sintpkt":     "sinpkt",
    "Dintpkt":     "dinpkt",
    "Label":       "label",
    "smeansz":     "smean",
    "dmeansz":     "dmean",
    "res_bdy_len": "response_body_len",
    "ct_src_ ltm": "ct_src_ltm",   # hidden-space column fixed
}

_DROP_COLS = ["srcip", "sport", "dstip", "dsport", "Stime", "Ltime", "id", "rate"]


def normalize_unsw_raw(df: pd.DataFrame) -> pd.DataFrame:
    """
    Rename and drop columns so that UNSW-NB15_1.csv aligns with the
    training-set schema expected by the saved PySpark PipelineModel.
    """
    df = df.copy()

    # Rename: only rename columns that actually exist
    rename_existing = {k: v for k, v in _RENAME_MAP.items() if k in df.columns}
    df.rename(columns=rename_existing, inplace=True)

    # Drop: only drop columns that actually exist
    drop_existing = [c for c in _DROP_COLS if c in df.columns]
    df.drop(columns=drop_existing, inplace=True)

    return df


def load_raw_csv(csv_path: str, features_csv: Optional[str] = None) -> pd.DataFrame:
    """
    Load UNSW-NB15_1.csv (no header) and assign column names.

    If `features_csv` is provided the names are read from it;
    otherwise the hard-coded list from config.py is used.
    """
    from config import RAW_COLUMNS

    if features_csv:
        feat_df = pd.read_csv(features_csv)
        col_names = feat_df["Name"].tolist()
    else:
        col_names = RAW_COLUMNS

    df = pd.read_csv(csv_path, header=None, names=col_names, low_memory=False)
    return df