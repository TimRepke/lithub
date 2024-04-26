import type { ReadonlyRef } from "@/util/types";
import { type Ref } from "vue";
import { readonly, ref, toRef, watch } from "vue";
import { and, or, type Bitmask, isNew } from "@/util/dataset/masks/bitmask.ts";
import { None } from "@/util";

export type Counts = {
  countTotal: number;
  countFiltered: number;
};

export interface BaseParams {
  active?: boolean;
  bitmask?: Bitmask | null;
}

export interface MaskBase {
  params?: BaseParams;
  active: Ref<boolean>;
  version: ReadonlyRef<number>;
  counts: ReadonlyRef<Counts>;
  bitmask: Ref<Bitmask | None>;
  setFilterCount: (c: number) => void;
  setTotalCount: (c: number) => void;
  setActive: (active: boolean) => void;
  toggleActive: () => void;
  clear: () => void;
  update: () => void;
  updateCounts: (globalMask: Bitmask | None) => void;
}

export interface GroupBaseParams<K extends string | number | symbol, M extends MaskBase> extends BaseParams {
  inclusive?: boolean;
  masks: Record<K, M>;
}

export type Extent = [number, number];

export interface GroupMaskBase<K extends string | number | symbol, M extends MaskBase> extends MaskBase {
  inclusive: Ref<boolean>;
  masks: Record<K, M>;
  extent: Ref<{ total: Extent; filtered: Extent }>;
  getCombinedMasks: () => Bitmask | None;
}

export function useBase(params: BaseParams): MaskBase {
  const active = ref(params.active ?? false);

  const _version = ref(0);
  const version = readonly(_version);

  const initCount = params.bitmask?.count ?? 0;
  const _counts = ref({
    countFiltered: initCount,
    countTotal: initCount,
  });
  const counts = readonly(_counts);
  const bitmask = ref<Bitmask | None>();
  if (params.bitmask) bitmask.value = params.bitmask;

  function update() {
    _version.value += 1;
  }

  function setActive(newActive: boolean) {
    active.value = newActive;
  }

  function toggleActive() {
    active.value = !active.value;
  }

  function setFilterCount(c: number) {
    _counts.value.countFiltered = c;
  }

  function setTotalCount(c: number) {
    _counts.value.countTotal = c;
  }

  function updateCounts(globalMask: Bitmask | None) {
    if (bitmask.value) _counts.value.countFiltered = and(globalMask, bitmask.value)?.count ?? _counts.value.countTotal;
  }

  function clear() {
    if (active.value) active.value = false;
    else update();
  }

  watch(active, update);

  return {
    params,
    active: toRef(active),
    version: toRef(version),
    counts: toRef(counts),
    bitmask: toRef(bitmask),
    setTotalCount,
    setFilterCount,
    clear,
    update,
    updateCounts,
    setActive,
    toggleActive,
  };
}

export function useGroupBase<K extends string | number | symbol, M extends MaskBase>(
  params: GroupBaseParams<K, M>,
): GroupMaskBase<K, M> {
  const base = useBase(params);
  const { bitmask } = base;
  const inclusive = ref(params.inclusive ?? true);

  const initCounts: number[] = Object.values<M>(params.masks).map((mask) => mask.counts.value.countTotal);
  const initExtent: Extent = [Math.min(...initCounts), Math.max(...initCounts)];
  const extent = ref({
    total: initExtent,
    filtered: initExtent,
  });

  bitmask.value = getCombinedMasks();

  function updateExtents() {
    const filteredCounts = Object.values<M>(params.masks).map((mask) => mask.counts.value.countFiltered);
    extent.value.filtered = [Math.min(...filteredCounts), Math.max(...filteredCounts)];
  }

  function updateCounts(globalMask: Bitmask | None) {
    Object.values<M>(params.masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
    updateExtents();
  }

  function getCombinedMasks() {
    const bitmasks = Object.values<M>(params.masks).map((mask) => (mask.active.value ? mask.bitmask.value : null));
    if (inclusive.value) return or(...bitmasks);
    return and(...bitmasks);
  }

  function update() {
    const newMask = getCombinedMasks();
    if (isNew(bitmask.value, newMask)) {
      bitmask.value = newMask;
      base.update();
    }
  }

  function clear() {
    Object.values<M>(params.masks).forEach((mask) => mask.clear());
    base.clear();
  }

  watch(inclusive, update);
  watch(
    Object.values<M>(params.masks).map((mask) => mask.version),
    update,
  );

  return {
    ...base,
    inclusive: toRef(inclusive),
    extent: toRef(extent),
    masks: params.masks,
    updateCounts,
    getCombinedMasks,
    update,
    clear,
  };
}

export function colKey(key: string, value: number | boolean) {
  return `${key}|${+value}`;
}
