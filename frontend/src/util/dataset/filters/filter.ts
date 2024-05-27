import { ref, toRef, watch } from "vue";
import { and, or } from "@/util/dataset/filters/bitmask.ts";
import { useMask } from "@/util/dataset/filters/mask.ts";
import type { Extent, Filter, FilterParams, Mask } from "@/util/dataset/filters/types";

export function useFilter(params: FilterParams): Filter {
  const inclusive = ref(params.inclusive ?? true);
  const base = useMask({
    name: params.name,
    key: params.key,
    colour: params.colour,
    active: params.active,
    bitmask: getCombinedMasks(),
  });

  const initCounts: number[] = [...masks()].map((mask) => mask.countTotal.value);
  const initExtent: Extent = [Math.min(...initCounts), Math.max(...initCounts)];
  const extentTotal = ref(initExtent);
  const extentFiltered = ref(initExtent);

  function* masks(): Generator<Mask, void, unknown> {
    for (const key of params.masks) if (params.maskIndex.index[key]) yield params.maskIndex.index[key];
  }

  function* activeMasks(): Generator<Mask, void, unknown> {
    for (const mask of masks()) if (mask.active.value) yield mask;
  }

  function getCombinedMasks() {
    const bitmasks = [...activeMasks()].map((mask) => mask.bitmask.value);
    const mask = inclusive.value ? or(...bitmasks) : and(...bitmasks);
    return (base.inverted.value ? mask?.invert() : mask) ?? null;
  }

  function updateExtents() {
    const filteredCounts = [...activeMasks()].map((mask) => mask.countFiltered.value);
    extentFiltered.value = [Math.min(...filteredCounts), Math.max(...filteredCounts)];
  }

  function updateCounts(fullUpdate?: boolean) {
    for (const mask of masks()) {
      mask.updateCounts(fullUpdate);
    }
    updateExtents();
  }

  function update() {
    base.bitmask.value = getCombinedMasks();
    updateCounts();
    base.version.value += 1;
  }

  function setActive(newActive: boolean) {
    for (const mask of masks()) {
      mask.setActive(newActive);
    }
    base.setActive(newActive);
  }

  function toggleActive() {
    setActive(!base.active.value);
  }

  // watch(base.active, () => {
  //   for (const mask of masks()) {
  //     mask.setActive(base.active.value);
  //   }
  // });
  watch(params.maskIndex.version, update);
  watch(
    [...masks()].map((mask) => mask.active),
    () => {
      base.active.value = [...activeMasks()].length > 0;
    },
  );

  return {
    ...base,
    type: params.type ?? "multi",
    masks: params.masks ?? [],
    subFilters: params.subFilters ?? null,
    inclusive: toRef(inclusive),
    extentTotal: toRef(extentTotal),
    extentFiltered: toRef(extentFiltered),
    update,
    updateCounts,
    setActive,
    toggleActive,
  };
}
