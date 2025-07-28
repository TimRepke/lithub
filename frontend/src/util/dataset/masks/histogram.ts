import type { GroupMaskBase, MaskBase } from "@/util/dataset/masks/base";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";
import { useBase } from "@/util/dataset/masks/base.ts";
import { Vector } from "apache-arrow/vector";
import { DataType } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";
import { useGroupBase } from "@/util/dataset/masks/base";
import { None } from "@/util";

export interface HistogramMask extends GroupMaskBase<number, HistogramValueMask> {
  years: number[];
  masks: Record<number, HistogramValueMask>;
  restMask: HistogramValueMask;
  selectRange: (begin: number, end: number) => void;
  selectYears: (years: number[]) => void;
}

export interface HistogramValueMask extends MaskBase {
  year: number | null;
}

export function useHistogramValueMask(initMask: Bitmask, year: number | null = null): HistogramValueMask {
  const base = useBase({ bitmask: initMask, active: true });
  const { active, counts, bitmask } = base;

  function updateCounts(globalMask: Bitmask | None) {
    base.setFilterCount(active.value ? (and(globalMask, bitmask.value)?.count ?? counts.value.countTotal) : 0);
  }

  function clear() {
    active.value = true;
  }

  return {
    ...base,
    year,
    updateCounts,
    clear,
  };
}

export function useHistogramMask(
  startYear: number,
  endYear: number,
  col: Vector<DataType<Type.Uint16>>,
): HistogramMask {
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
  const masks: Record<number, HistogramValueMask> = Object.fromEntries(
    Object.entries(bitmasks).map(([yr, mask]) => [yr, useHistogramValueMask(mask, +yr)]),
  );
  const restMask = useHistogramValueMask(restBitmask);
  const base = useGroupBase({ masks });

  function clear() {
    base.clear();
    restMask.clear();
    base.update();
  }

  function updateCounts(globalMask: Bitmask | None) {
    base.updateCounts(globalMask);
    restMask.updateCounts(globalMask);
  }

  const { active } = base;

  function selectRange(begin: number, end: number) {
    // [begin, end] = [Math.floor(begin), Math.ceil(end)];
    Object.entries(masks).forEach(([yr, mask]) => mask.setActive(+yr >= begin && +yr <= end));
    restMask.setActive(false);
    if (!active.value) active.value = true;
    else base.update();
  }

  function selectYears(years: number[]) {
    Object.entries(masks).forEach(([yr, mask]) => mask.setActive(years.indexOf(+yr) >= 0));
    restMask.setActive(false);
    base.update();
  }

  return {
    ...base,
    years,
    restMask,
    selectRange,
    selectYears,
    clear,
    updateCounts,
  };
}
