import { request } from "@/util/api.ts";
import { readonly, ref, toRef, watch } from "vue";
import type { HSLColour, ReadonlyRef, SchemeLabelType } from "@/util/types";
import { hslToHex, None } from "@/util";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";
import type { MaskBase } from "@/util/dataset/masks/base.ts";
import { colKey, GroupMaskBase, useBase, useGroupBase } from "@/util/dataset/masks/base.ts";

const DEFAULT_THRESHOLD = 0.5;

export interface MaskBufferEntry {
  key: string;
  name: string;
  type: SchemeLabelType;
  masks: LabelValueMask[];
}

export interface LabelValueMask extends MaskBase {
  name: string;
  key: string;
  value: number | boolean;
  column: string;
  colourHSL: HSLColour;
  colourHex: string;
  threshold: ReadonlyRef<number>;

  setThreshold(threshold?: number | null): void;
}

export interface LabelMaskGroup extends GroupMaskBase<number, LabelValueMask> {
  name: string;
  key: string;
  type: SchemeLabelType;
}

export function useLabelValueMask(params: {
  dataset: string;
  name: string;
  key: string;
  value: number | boolean;
  colour: HSLColour;
  bitmask: Bitmask;
}): LabelValueMask {
  const base = useBase({ bitmask: params.bitmask, active: false });
  const { setFilterCount, counts, bitmask } = base;

  const _threshold = ref(DEFAULT_THRESHOLD);
  const threshold = readonly(_threshold);
  const column = colKey(params.key, params.value);
  const colourHex = hslToHex(...params.colour);

  async function setThreshold(threshold: number | null = null) {
    if (threshold !== null) _threshold.value = threshold;
    bitmask.value = await loadMask(params.dataset, column, _threshold.value);
    this.update();
  }

  function updateCounts(globalMask: Bitmask | None) {
    // setFilterCount(active.value ? and(globalMask, params.mask)?.count ?? counts.value.countTotal : 0);
    setFilterCount(and(globalMask, bitmask.value)?.count ?? counts.value.countTotal);
  }

  return {
    ...base,
    column,
    colourHex,
    name: params.name,
    key: params.key,
    value: params.value,
    colourHSL: params.colour,
    threshold: toRef(threshold),
    setThreshold,
    updateCounts,
  };
}

export async function loadLabelValueMask(params: {
  dataset: string;
  name: string;
  key: string;
  value: number | boolean;
  colour: HSLColour;
  threshold?: number;
}) {
  const col = colKey(params.key, params.value);
  const bitmask = await loadMask(params.dataset, col, DEFAULT_THRESHOLD);
  return useLabelValueMask({ ...params, bitmask });
}

export function useLabelMaskGroup(params: {
  dataset: string;
  key: string;
  name: string;
  type: SchemeLabelType;
  masks: LabelValueMask[];
}): LabelMaskGroup {
  const masks = Object.fromEntries(params.masks.map((mask) => [+mask.value, mask]));
  const base = useGroupBase({ masks });
  const { active } = base;

  function updateCounts(globalMask: Bitmask | None) {
    Object.values(masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
  }

  watch(
    Object.values(masks).map((mask) => mask.active),
    () => (active.value = true),
  );

  return {
    ...base,
    type: params.type,
    key: params.key,
    name: params.name,
    updateCounts,
  };
}

function loadMask(dataset: string, col: string, threshold: number = 0.5) {
  return new Promise((resolve: (bitmask: Bitmask) => void, reject) => {
    request({
      method: "GET",
      path: `/basic/bitmask/${dataset}`,
      params: { key: col, min_score: threshold },
    })
      .then(async (result) => {
        resolve(Bitmask.fromBase64(await result.text()));
      })
      .catch(reject);
  });
}
