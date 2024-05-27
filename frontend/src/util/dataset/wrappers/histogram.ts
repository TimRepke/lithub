import { useDatasetStore } from "@/stores/datasetstore.ts";
import { and, Bitmask } from "@/util/dataset/filters/bitmask.ts";
import type { Vector } from "apache-arrow/vector";
import type { DataType } from "apache-arrow/type";
import type { Type } from "apache-arrow/enum";
import { useMask } from "@/util/dataset/filters/mask.ts";
import { useFilter } from "@/util/dataset/filters/filter.ts";
import { FilterParams, Index, MaskParams } from "@/util/dataset/filters/types";
import { AnyMask, AnyFilter, HistogramMask, HistogramFilter } from "@/util/dataset/wrappers/types";

export interface HistogramMaskParams extends MaskParams {
  year?: number | null;
}

export interface HistogramFilterParams extends FilterParams {
  years: number[];
  keys: string[];
  restKey: string;
  maskIndex: Index<AnyMask>;
}

export function useHistogramMask(params: HistogramMaskParams): HistogramMask {
  const base = useMask(params);

  function updateCounts() {
    const globalMask = useDatasetStore().dataset?.bitmask.value;
    base.setFilterCount(base.active.value ? and(globalMask, base.bitmask.value)?.count ?? base.countTotal.value : 0);
  }

  return {
    ...base,
    updateCounts,
    year: params.year ?? null,
  };
}

export function useHistogramFilter(params: HistogramFilterParams): HistogramFilter {
  const base = useFilter(params);
  const { keys, maskIndex, restKey } = params;

  function selectRange(begin: number, end: number): void {
    let mask;
    for (const key of keys) {
      mask = maskIndex.index[key] as HistogramMask;
      mask.setActive((mask.year ?? 0) >= begin && (mask.year ?? 3000) <= end);
    }
    maskIndex.index[restKey].setActive(false);
    if (!base.active.value) base.active.value = true;
    else base.update();
  }

  function selectYears(years: number[]): void {
    let mask;
    for (const key of keys) {
      mask = maskIndex.index[key] as HistogramMask;
      mask.setActive(years.indexOf(mask.year ?? 0) >= 0);
    }
    maskIndex.index[restKey].setActive(false);
    if (!base.active.value) base.active.value = true;
    else base.update();
  }

  return {
    ...base,
    years: params.years,
    selectYears,
    selectRange,
  };
}

export function registerHistogramFilter(
  keyFilter: string,
  startYear: number,
  endYear: number,
  col: Vector<DataType<Type.Uint16>>,
  maskIndex: Index<AnyMask>,
  filterIndex: Index<AnyFilter>,
) {
  const diff = endYear - startYear;
  const years = [...Array(diff).keys()].map((i) => i + startYear);

  const bitmasks: Record<number, Bitmask> = Object.fromEntries(years.map((yr) => [yr, new Bitmask(col.length)]));
  const restBitmask = new Bitmask(col.length); // includes items not in the year range
  let yr;
  for (let i = 0; i < col.length; i++) {
    yr = col.get(i);
    if (yr in bitmasks) bitmasks[yr].set(i);
    else restBitmask.set(i);
  }

  const keys = Object.entries(bitmasks).map(([yr, bitmask]) => {
    const key = `msk-yr-${yr}`;
    maskIndex.register(key, useHistogramMask({ key, bitmask, year: +yr }), true);
    return key;
  });
  const restKey = "msk-yr-rest";
  maskIndex.register(restKey, useHistogramMask({ key: restKey, bitmask: restBitmask }));

  filterIndex.register(
    keyFilter,
    useHistogramFilter({
      key: keyFilter,
      masks: keys,
      years,
      keys,
      restKey,
      maskIndex,
    }),
    true,
  );
}
