<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import type { None } from "@/util";
import type { Scheme } from "@/util/types";
import { and, Bitmask } from "@/util/dataset/masks/bitmask";
import type { LabelMaskGroup } from "@/util/dataset/masks/labels";
import {
  extent as d3extent,
  scaleSequential as d3scaleSequential,
  scaleSequentialLog as d3scaleSequentialLog,
} from "d3";
import { interpolateYlGn } from "d3-scale-chromatic";

const uniq = crypto.randomUUID();
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const groupMasks = defineModel<Record<string, LabelMaskGroup>>("groupMasks", { required: true });
const { scheme } = defineProps({
  scheme: { type: Object as PropType<Scheme>, required: true },
});

const xKey = ref<string>(Object.keys(scheme)[0]);
const yKey = ref<string>(Object.keys(scheme)[1]);
const applyGlobalMask = ref<boolean>(true);
const useLogScale = ref<boolean>(true);

const isAvailable = computed(() => Object.keys(scheme).length > 1);
const counts = computed<Record<number, Record<number, number>>>(() => {
  return Object.fromEntries(
    scheme[yKey.value].values.map((yValue) => [
      +yValue.value,
      Object.fromEntries(
        scheme[xKey.value].values.map((xValue) => [
          +xValue.value,
          and(
            groupMasks.value[yKey.value].masks[+yValue.value].bitmask.value,
            groupMasks.value[xKey.value].masks[+xValue.value].bitmask.value,
            applyGlobalMask.value ? globalMask.value : null,
          )?.count,
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
</script>

<template>
  <div class="d-flex flex-column">
    <template v-if="isAvailable">
      <div class="row m-2">
        <div class="col">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              :id="`logscale-${uniq}`"
              v-model="useLogScale"
            />
            <label class="form-check-label" :for="`logscale-${uniq}`">Use log-scale</label>
          </div>
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              :id="`incl-global-${uniq}`"
              v-model="applyGlobalMask"
            />
            <label class="form-check-label" :for="`incl-global-${uniq}`">Apply global filter</label>
          </div>
        </div>

        <div class="col">
          <label :for="`ykey-${uniq}`">Vertical axis</label>
          <select class="form-select form-select-sm" v-model="yKey" :id="`ykey-${uniq}`">
            <option v-for="label in scheme" :key="label.key" :value="label.key" :disabled="label.key === xKey">
              {{ label.name }}
            </option>
          </select>
        </div>
        <div class="col">
          <label :for="`xkey-${uniq}`">Horizontal axis</label>
          <select class="form-select form-select-sm" v-model="xKey" :id="`xkey-${uniq}`">
            <option v-for="label in scheme" :key="label.key" :value="label.key" :disabled="label.key === yKey">
              {{ label.name }}
            </option>
          </select>
        </div>
      </div>

      <div>
        <table>
          <tr>
            <th></th>
            <th v-for="value in scheme[xKey].values" :key="+value.value">{{ value.name }}</th>
          </tr>
          <tr v-for="yValue in scheme[yKey].values" :key="+yValue.value">
            <th>{{ yValue.name }}</th>
            <td
              v-for="xValue in scheme[xKey].values"
              :key="+xValue.value"
              :style="{ 'background-color': colours(counts[+yValue.value][+xValue.value]) }"
            >
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
