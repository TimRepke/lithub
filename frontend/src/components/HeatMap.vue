<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import type { None } from "@/util";
import { and, Bitmask } from "@/util/dataset/masks/bitmask";
import type { LabelMaskGroup } from "@/util/dataset/masks/labels";
import { extent as d3extent } from "d3-array";
import { scaleSequential as d3scaleSequential, scaleSequentialLog as d3scaleSequentialLog } from "d3-scale";
import { interpolateYlGn } from "d3-scale-chromatic";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

interface SCM {
  name: string;
  key: string;
  values: Record<number, { name: string; value: boolean | number; mask: Bitmask }>;
}

const uniq = crypto.randomUUID();
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const groupMasks = defineModel<Record<string, LabelMaskGroup>>("groupMasks", { required: true });
const yearMasks = defineModel<HistogramMask>("yearMasks", { required: false });
const { selectableGroups, initVert, initHori } = defineProps({
  selectableGroups: { type: Object as PropType<string[]>, required: true },
  initVert: { type: String, required: false },
  initHori: { type: String, required: false },
});

const xKey = ref<string>(initHori ?? selectableGroups[0]);
const yKey = ref<string>(initVert ?? selectableGroups[1]);
const applyGlobalMask = ref<boolean>(true);
const useLogScale = ref<boolean>(false);

const isAvailable = computed(() => Object.keys(groupMasks).length > 1);

const fullScheme = computed<Record<string, SCM>>(() => {
  const keys = Object.fromEntries(
    selectableGroups.map((labelKey) => {
      const group = groupMasks.value[labelKey];
      return [
        group.key,
        {
          name: group.name,
          key: group.key,
          values: Object.fromEntries(
            Object.values(group.masks).map((mask) => [
              mask.value,
              {
                name: mask.name,
                value: mask.value,
                mask: mask.bitmask.value,
              },
            ]),
          ),
        } as SCM,
      ];
    }),
  );
  if (yearMasks.value)
    keys.PUB_YEAR = {
      name: "Publication year",
      key: "PUB_YEAR",
      values: Object.fromEntries(
        yearMasks.value.years.map((yr) => [
          yr,
          {
            value: yr,
            name: `${yr}`,
            mask: yearMasks.value?.masks[yr].bitmask.value,
          },
        ]),
      ),
    } as SCM;
  return keys;
});

const counts = computed<Record<number, Record<number, number>>>(() => {
  return Object.fromEntries(
    Object.values(fullScheme.value[yKey.value].values).map((yValue) => [
      +yValue.value,
      Object.fromEntries(
        Object.values(fullScheme.value[xKey.value].values).map((xValue) => [
          +xValue.value,
          and(yValue.mask, xValue.mask, applyGlobalMask.value ? globalMask.value : null)?.count,
        ]),
      ),
    ]),
  ) as Record<number, Record<number, number>>;
});

const colours = computed(() => {
  const extent = d3extent(Object.values(counts.value).flatMap((row) => Object.values(row))) as [number, number];
  extent[1] += (extent[1] - extent[0]) * 0.8;
  if (useLogScale.value) return d3scaleSequentialLog(extent, interpolateYlGn);
  return d3scaleSequential(extent, interpolateYlGn);
});

function swapAxes() {
  const tmp = xKey.value;
  xKey.value = yKey.value;
  yKey.value = tmp;
}
</script>

<template>
  <div class="d-flex flex-column" style="height: 0">
    <template v-if="isAvailable">
      <div class="row m-2">
        <div class="col">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              :id="`logscale-${uniq}`"
              v-model="useLogScale" />
            <label class="form-check-label" :for="`logscale-${uniq}`">Use log-scale</label>
          </div>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              :id="`incl-global-${uniq}`"
              v-model="applyGlobalMask" />
            <label class="form-check-label" :for="`incl-global-${uniq}`">Apply global filter</label>
          </div>
        </div>

        <div class="col">
          <label :for="`ykey-${uniq}`">Vertical axis</label>
          <select class="form-select form-select-sm" v-model="yKey" :id="`ykey-${uniq}`">
            <option v-for="label in fullScheme" :key="label.key" :value="label.key" :disabled="label.key === xKey">
              {{ label.name }}
            </option>
          </select>
        </div>
        <div class="col text-muted small p-0" style="flex: 0">
          <font-awesome-icon icon="right-left" role="button" @click="swapAxes" />
        </div>
        <div class="col">
          <label :for="`xkey-${uniq}`">Horizontal axis</label>
          <select class="form-select form-select-sm" v-model="xKey" :id="`xkey-${uniq}`">
            <option v-for="label in fullScheme" :key="label.key" :value="label.key" :disabled="label.key === yKey">
              {{ label.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="overflow-auto">
        <table v-if="fullScheme[xKey] && fullScheme[yKey]">
          <tr>
            <th></th>
            <th v-for="value in fullScheme[xKey].values" :key="+value.value">{{ value.name }}</th>
          </tr>
          <tr v-for="yValue in fullScheme[yKey].values" :key="+yValue.value">
            <th>{{ yValue.name }}</th>
            <td
              v-for="xValue in fullScheme[xKey].values"
              :key="+xValue.value"
              :style="{ 'background-color': colours(counts[+yValue.value][+xValue.value]) }">
              {{ counts[+yValue.value][+xValue.value] }}
            </td>
          </tr>
        </table>
      </div>
    </template>

    <div v-else>Sorry, seems like the evidence heatmap is not available here.</div>
  </div>
</template>

<style scoped>
th {
  font-size: 0.75em;
  font-weight: 600;
  padding: 0.25em;
}

td {
  text-align: center;
  padding: 0.5em;
}

table {
  margin: 1em;
}
</style>
