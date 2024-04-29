import { request } from "@/util/api.ts";
import { computed, readonly, Ref, ref, toRef, watch } from "vue";
import type { HSLColour, ReadonlyRef, SchemeLabelType } from "@/util/types";
import { hslToHex, None } from "@/util";
import { and, Bitmask } from "@/util/dataset/masks/bitmask.ts";
import type { MaskBase } from "@/util/dataset/masks/base.ts";
import { GroupMaskBase, useBase, useGroupBase } from "@/util/dataset/masks/base.ts";

export const DEFAULT_THRESHOLD = 0.5;

export interface LabelValueMask extends MaskBase {
  name: string;
  key: string;
  value: number;
  colourHSL: HSLColour;
  colourHex: string;
  threshold: ReadonlyRef<number>;
  setThreshold: (threshold?: number | null) => Promise<void>;
}

export interface LabelMaskGroup extends GroupMaskBase<number, LabelValueMask> {
  name: string;
  key: string;

  colours: Ref<number[]>;
  hexColours: Ref<string[]>;
  hslColours: Ref<HSLColour[]>;
  type: SchemeLabelType;
  setThresholds: (threshold?: number | null) => Promise<void>;
}

export function useLabelValueMask(params: {
  dataset: string;
  name: string;
  key: string;
  value: number;
  colour: HSLColour;
  bitmask: Bitmask;
}): LabelValueMask {
  const base = useBase({ bitmask: params.bitmask, active: false });
  const { setFilterCount, setTotalCount, counts, bitmask } = base;

  const _threshold = ref(DEFAULT_THRESHOLD);
  const threshold = readonly(_threshold);
  const colourHex = hslToHex(...params.colour);

  async function setThreshold(threshold: number | null = null) {
    if (threshold !== null) _threshold.value = threshold;
    bitmask.value = await loadMask(params.dataset, params.key, _threshold.value);

    const newTotal = bitmask.value.count;
    setTotalCount(newTotal);
    setFilterCount(newTotal);

    base.update();
  }

  function updateCounts(globalMask: Bitmask | None) {
    // setFilterCount(active.value ? and(globalMask, params.mask)?.count ?? counts.value.countTotal : 0);
    setFilterCount(and(globalMask, bitmask.value)?.count ?? counts.value.countTotal);
  }

  return {
    ...base,
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
  value: number;
  colour: HSLColour;
  threshold?: number;
}) {
  const bitmask = await loadMask(params.dataset, params.key, DEFAULT_THRESHOLD);
  return useLabelValueMask({ ...params, bitmask });
}

export function useLabelMaskGroup(params: {
  dataset: string;
  key: string;
  name: string;
  type: SchemeLabelType;
  masks: LabelValueMask[];
}): LabelMaskGroup {
  const masks = Object.fromEntries<LabelValueMask>(params.masks.map((mask) => [mask.value, mask]));
  const base = useGroupBase({ masks });
  const { active } = base;

  // prepend new colour for "undefined"
  const hslColours = computed<HSLColour[]>(() =>
    [[165, 3.0, 77.0] as HSLColour].concat(Object.values(masks).map((mask) => mask.colourHSL)),
  );
  const hexColours = computed<string[]>(() => hslColours.value.map((col) => hslToHex(...col)));
  const colours = computed<number[]>(() => {
    function first(row: number): number {
      for (let j = 0; j < bitmasks.length; j++) {
        if (bitmasks[j].get(row)) return j + 1;
      }
      return 0;
    }

    const bitmasks = Object.values(masks).map((mask) => mask.bitmask.value!);
    const len = bitmasks[0].length;
    const ret: number[] = new Array(len);
    for (let i = 0; i < len; i++) {
      ret[i] = first(i);
    }
    return ret;
  });

  function updateCounts(globalMask: Bitmask | None) {
    Object.values(masks).forEach((mask) => {
      mask.updateCounts(globalMask);
    });
  }

  async function setThresholds(threshold: number | null = null) {
    for (const mask of Object.values(masks)) {
      await mask.setThreshold(threshold);
    }
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
    colours: toRef(colours),
    hexColours: toRef(hexColours),
    hslColours: toRef(hslColours),
    updateCounts,
    setThresholds,
  };
}

function loadMask(dataset: string, col: string, threshold: number = DEFAULT_THRESHOLD) {
  return new Promise((resolve: (bitmask: Bitmask) => void, reject) => {
    request({
      method: "GET",
      path: "/basic/bitmask",
      params: { key: col, min_score: threshold, dataset },
    })
      .then(async (result) => {
        resolve(Bitmask.fromBase64(await result.text()));
      })
      .catch(reject);
  });
}
