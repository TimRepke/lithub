import type { ReadonlyRef } from "@/util/types";
import type { Ref } from "vue";
import { readonly, ref, toRef, watch } from "vue";
import { and, or, type Bitmask } from "@/util/dataset/masks/bitmask.ts";

export type Counts = {
  countTotal: number;
  countFiltered: number;
};

export interface BaseParams {
  active?: boolean;
  mask?: Bitmask | null;
}

export interface MaskBase {
  params?: BaseParams;
  active: Ref<boolean>;
  version: ReadonlyRef<number>;
  counts: ReadonlyRef<Counts>;
  _mask: { value: Bitmask | null };

  get mask(): Bitmask | null;

  setFilterCount(c: number): void;

  setTotalCount(c: number): void;

  setActive(active: boolean): void;

  toggleActive(): void;

  clear(): void;

  update(): void;

  updateCounts(globalMask: Bitmask | null): void;
}

export interface GroupBaseParams<K extends string | number | symbol, M extends MaskBase> extends BaseParams {
  inclusive?: boolean;
  masks: Record<K, M>;
}

export interface GroupMaskBase<K extends string | number | symbol, M extends MaskBase> extends MaskBase {
  inclusive: Ref<boolean>;
  masks: Record<K, M>;

  getCombinedMasks(): Bitmask | null;
}

export function useBase(params: BaseParams): MaskBase {
  const active = ref(params.active ?? false);

  const _version = ref(0);
  const version = readonly(_version);

  const initCount = params.mask?.count ?? 0;
  const _counts = ref({
    countFiltered: initCount,
    countTotal: initCount,
  });
  const counts = readonly(_counts);
  const _mask = { value: params.mask ?? null };

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

  function updateCounts(globalMask: Bitmask) {
    if (params.mask) _counts.value.countFiltered = and(globalMask, params.mask)?.count ?? _counts.value.countTotal;
  }

  function clear() {
    active.value = false;
  }

  watch(active, update);

  return {
    params,
    active: toRef(active),
    version: toRef(version),
    counts: toRef(counts),
    _mask,
    get mask() {
      return _mask.value;
    },
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
  const { _mask } = base;
  const inclusive = ref(params.inclusive ?? true);
  _mask.value = getCombinedMasks();

  function updateCounts(globalMask: Bitmask | null) {
    Object.values<MaskBase>(params.masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
  }

  function getCombinedMasks() {
    const bitmasks = Object.values<M>(params.masks).map((mask) => (mask.active.value ? mask.mask : null));
    if (inclusive.value) return or(...bitmasks);
    return and(...bitmasks);
  }

  function update() {
    base._mask.value = getCombinedMasks();
    base.update();
  }

  function clear() {
    Object.values<MaskBase>(params.masks).forEach((mask) => mask.clear());
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
    masks: params.masks,
    get mask() {
      return base._mask.value;
    },
    updateCounts,
    getCombinedMasks,
    update,
    clear,
  };
}

export function colKey(key: string, value: number | boolean) {
  return `${key}|${+value}`;
}
