import { ReadonlyRef } from "@/util/types";
import { readonly, ref, toRef } from "vue";
import { MaskBase, useBase } from "@/util/dataset/masks/base.ts";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";

export interface IndexMask extends MaskBase {
  ids: ReadonlyRef<number[]>;
  selectIds: (ids: number[]) => void;
}

export function useIndexMask(length: number): IndexMask {
  const mask = new Bitmask(length);
  const base = useBase({ mask });
  const { active, counts, setFilterCount, setTotalCount } = base;
  const _ids = ref<number[]>([]);
  const ids = readonly(_ids);

  function selectIds(ids: number[]) {
    mask.reset();
    for (const idx of ids) {
      mask.set(idx);
    }
    _ids.value = ids;
    active.value = true;
  }

  function clear() {
    active.value = false;
    _ids.value = [];
    mask.reset();
  }

  function updateCounts(globalMask: Bitmask | null): void {
    setTotalCount(ids.value.length);
    setFilterCount(globalMask ? and(mask, globalMask)?.count ?? counts.value.countTotal : counts.value.countTotal);
  }

  return {
    ...base,
    ids: toRef(ids),
    updateCounts,
    clear,
    selectIds,
  };
}
