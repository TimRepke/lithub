import { readonly, ref, toRef, watch } from "vue";
import { None } from "@/util";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import type { Mask, MaskParams } from "@/util/dataset/filters/types";
import { type Bitmask, and } from "@/util/dataset/filters/bitmask.ts";

export function useMask(params: MaskParams): Mask {
  let pauseUpdate: boolean = false;

  const initActive = params.active ?? false;
  const active = ref(params.active ?? false);
  const inverted = ref(false);

  const version = ref(0);

  const initCount = params.bitmask?.count ?? 0;
  const _countFiltered = ref(initCount);
  const _countTotal = ref(initCount);
  const countFiltered = readonly(_countFiltered);
  const countTotal = readonly(_countTotal);
  const bitmask = ref<Bitmask | None>();
  if (params.bitmask) bitmask.value = params.bitmask;

  function setActive(newActive: boolean) {
    active.value = newActive;
  }

  function toggleActive() {
    active.value = !active.value;
  }

  function toggleInvert() {
    inverted.value = !inverted.value;
    bitmask.value?.invert();
    updateCounts(true);
  }

  function setFilterCount(c: number) {
    _countFiltered.value = c;
  }

  function setTotalCount(c: number) {
    _countTotal.value = c;
  }

  function updateCounts(fullUpdate?: boolean) {
    if (bitmask.value) {
      const globalMask = useDatasetStore().dataset?.bitmask.value;
      if (fullUpdate) _countTotal.value = bitmask.value?.count ?? initCount;
      _countFiltered.value = and(globalMask, bitmask.value)?.count ?? _countTotal.value;
    }
  }

  function clear() {
    pauseUpdate = true;
    active.value = initActive;
    if (inverted.value && bitmask.value) {
      bitmask.value.invert();
      inverted.value = false;
    }
    pauseUpdate = false;
    update();
  }

  function update() {
    if (!pauseUpdate) version.value += 1;
  }

  watch([active, inverted], update);

  return {
    key: params.key,
    active: toRef(active),
    inverted: toRef(inverted),
    version: toRef(version),
    countTotal: toRef(countTotal),
    countFiltered: toRef(countFiltered),
    bitmask: toRef(bitmask),
    setTotalCount,
    setFilterCount,
    clear,
    updateCounts,
    setActive,
    toggleActive,
    toggleInvert,
    update,
  };
}
