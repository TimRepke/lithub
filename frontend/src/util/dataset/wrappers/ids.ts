import { readonly, ref, toRef } from "vue";
import type { Index, MaskParams } from "@/util/dataset/filters/types";
import { useMask } from "@/util/dataset/filters/mask.ts";
import { Bitmask } from "@/util/dataset/filters/bitmask.ts";
import type { AnyFilter, AnyMask, IndexMask } from "@/util/dataset/wrappers/types";
import { useFilter } from "@/util/dataset/filters/filter.ts";

export function useIndexMask(params: MaskParams): IndexMask {
  const base = useMask(params);

  const _ids = ref<number[]>(base.bitmask.value?.ids() ?? []);
  const ids = readonly(_ids);

  function selectIds(ids: number[]) {
    base.bitmask.value?.reset();
    for (const idx of ids) {
      base.bitmask.value?.set(idx);
    }
    _ids.value = ids;
    if (!base.active.value) base.active.value = true;
    else base.update();
  }

  function clear() {
    base.active.value = false;
    _ids.value = [];
    base.bitmask.value?.reset();
  }

  return {
    ...base,
    ids: toRef(ids),
    selectIds,
    clear,
  };
}

export function registerIndexFilter(
  keyMask: string,
  keyFilter: string,
  length: number,
  maskIndex: Index<AnyMask>,
  filterIndex: Index<AnyFilter>,
) {
  maskIndex.register(
    keyMask,
    useIndexMask({
      key: keyMask,
      bitmask: new Bitmask(length),
    }),
    true,
  );

  filterIndex.register(
    keyFilter,
    useFilter({
      key: keyFilter,
      masks: [keyMask],
      maskIndex: maskIndex,
    }),
    true,
  );
}
