import { LabelMask, LabelFilter } from "@/util/dataset/wrappers/types";
import { useMask } from "@/util/dataset/filters/mask.ts";
import { ref, toRef, watch } from "vue";
import { hslToHex, useDelay } from "@/util";
import { HSLColour } from "@/util/types";
import { Bitmask } from "@/util/dataset/filters/bitmask.ts";
import { request } from "@/util/api.ts";
import { FilterParams, MaskParams } from "@/util/dataset/filters/types";

const DEFAULT_COLOUR: HSLColour = [60, 14.94, 82.94];
const LOAD_TIMEOUT = 100;

export interface LabelMaskParams extends MaskParams {
  name: string;
  value: number;
  colour: HSLColour;
  threshold?: number | null;
  dataset: string;
}
export interface LabelFilterParams extends FilterParams {

}

export function useLabelMask(params: LabelMaskParams): LabelMask {
  const base = useMask(params);
  const threshold = ref(params.threshold ?? 0.5);

  const { delayedCall: reload } = useDelay(async () => {
    base.bitmask.value = await loadMask(params.dataset, params.key, threshold.value);
    base.updateCounts(true);
    base.update();
  }, LOAD_TIMEOUT);

  watch(threshold, reload);

  return {
    ...base,
    name: params.name,
    value: params.value,
    colour: params.colour ?? DEFAULT_COLOUR,
    hexColour: hslToHex(...(params.colour ?? DEFAULT_COLOUR)),
    threshold: toRef(threshold),
  };
}

function useLabelFilter(params: LabelFilterParams) : LabelFilter {

}

