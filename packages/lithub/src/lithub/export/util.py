import pandas as pd

from lithub.models import DatasetInfoFull


def filter_labels(df: pd.DataFrame, info: DatasetInfoFull) -> DatasetInfoFull:
    # 1. Filter the top-level labels first
    info.labels = {k: v for k, v in info.labels.items() if k in df.columns}

    # Cache to store whether a group ID is valid (True/False)
    # This prevents redundant work and handles nested dependencies.
    memory: dict[str, bool] = {}

    def check_group_validity(key_: str) -> bool:
        # If we've already decided if this group is valid, return the result
        if key_ in memory:
            return memory[key_]

        group_ = info.groups.get(key_)
        if not group_:
            memory[key_] = False
            return False

        # Case 1: Group contains direct column labels
        if group_.labels is not None:
            group_.labels = [col for col in group_.labels if col in df.columns]
            is_valid = len(group_.labels) > 0

        # Case 2: Group contains references to other groups (subgroups)
        elif group_.subgroups is not None:
            # We recursively check each subgroup.
            # A subgroup is kept only if check_group_validity returns True.
            group_.subgroups = [s for s in group_.subgroups if check_group_validity(s)]
            is_valid = len(group_.subgroups) > 0

        else:
            is_valid = False

        memory[key_] = is_valid
        return is_valid

    # 2. Iterate through all group keys and trigger the recursive check
    all_keys = list(info.groups.keys())
    for key in all_keys:
        if not check_group_validity(key):
            # If the group (or its nested children) ended up empty, delete it
            if key in info.groups:
                del info.groups[key]

    return info
