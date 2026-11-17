from training.data import build_xy, load_harmonized, load_target_frame, workbook_paths


def test_copy_workbooks_are_ignored():
    names = [path.name for path in workbook_paths()]
    assert names == [f"geotechnical_data_{i}.xlsx" for i in range(10)]


def test_row_and_site_counts():
    assert len(load_harmonized()) == 258
    cu, phi = load_target_frame("cu"), load_target_frame("phi")
    assert (len(cu), len(phi)) == (227, 228)
    # Workbook 5 repeats workbook 4, so nine sites remain.
    assert cu["Site"].nunique() == phi["Site"].nunique() == 9
    assert "site_5" not in set(cu["Site"])


def test_no_missing_values_in_model_matrix():
    for target in ("cu", "phi"):
        X, y, groups = build_xy(load_target_frame(target), target)
        assert not X.isna().any().any() and not y.isna().any() and len(groups) == len(X)
