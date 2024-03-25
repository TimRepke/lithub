import { ReadonlyRef } from "@/util/types";
import { readonly, ref, toRef } from "vue";
import { GroupMaskBase, MaskBase, useBase, useGroupBase } from "@/util/dataset/masks/base.ts";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";
import { None } from "@/util";

export type Indexes = "scatter";

export interface IndexMask extends MaskBase {
  ids: ReadonlyRef<number[]>;
  selectIds: (ids: number[]) => void;
}

export interface IndexMasks<K extends Indexes> extends GroupMaskBase<K, IndexMask> {
  masks: Record<K, IndexMask>;

  registerMask(key: K): void;

  unregisterMask(key: K): void;
}

export function useIndexMask(length: number): IndexMask {
  const bitmask = new Bitmask(length);
  const base = useBase({ bitmask });
  const { active, counts, setFilterCount, setTotalCount } = base;
  const _ids = ref<number[]>([]);
  const ids = readonly(_ids);

  function selectIds(ids: number[]) {
    bitmask.reset();
    for (const idx of ids) {
      bitmask.set(idx);
    }
    _ids.value = ids;
    if (!active.value) active.value = true;
    else base.update();
  }

  function clear() {
    active.value = false;
    _ids.value = [];
    bitmask.reset();
  }

  function updateCounts(globalMask: Bitmask | None): void {
    setTotalCount(ids.value.length);
    setFilterCount(globalMask ? and(bitmask, globalMask)?.count ?? counts.value.countTotal : counts.value.countTotal);
  }

  return {
    ...base,
    ids: toRef(ids),
    updateCounts,
    clear,
    selectIds,
  };
}

export function useIndexMasks<K extends Indexes>(length: number): IndexMasks<K> {
  const masks = { scatter: useIndexMask(length) } as Record<K, IndexMask>;
  const base = useGroupBase<K, IndexMask>({ masks, inclusive: false, active: true });

  function registerMask(key: K) {
    masks[key] = useIndexMask(length);
    // we need no update here (effectively nothing changed to counts anyway)
  }

  function unregisterMask(key: K) {
    delete masks[key];
    base.update();
  }

  return {
    ...base,
    registerMask,
    unregisterMask,
  };
}
