<script setup lang="ts">
import { computed, ref } from "vue";
import type { PropType } from "vue";
import type { None } from "@/util";
import { and, Bitmask } from "@/util/dataset/masks/bitmask";
import type { LabelMaskGroup } from "@/util/dataset/masks/labels";
import { extent as d3extent } from "d3-array";
import { scaleSequential as d3scaleSequential } from "d3-scale"; //, scaleSequentialLog as d3scaleSequentialLog
import { interpolateYlGn } from "d3-scale-chromatic";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Counts } from "@/util/dataset/masks/base.ts";

interface SCMValue {
  name: string;
  value: boolean | number;
  mask: Bitmask;
}

interface SCM {
  name: string;
  key: string;
  values: Record<number, SCMValue>;
}

enum Normalisation {
  None = "No normalisation",
  Total = "Normalise by overall total",
  RowTotal = "Normalise by row total",
  ColTotal = "Normalise by column total",
  Sum = "Normalise by sum of counts",
  RowSum = "Normalise by row sum",
  ColSum = "Normalise by column sum",
  RowMax = "Normalise by row max",
  ColMax = "Normalise by column max",
}

const uniq = crypto.randomUUID();
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const groupMasks = defineModel<Record<string, LabelMaskGroup>>("groupMasks", { required: true });
const yearMasks = defineModel<HistogramMask>("yearMasks", { required: false });
const { selectableGroups, initVert, initHori, globalCounts } = defineProps({
  selectableGroups: { type: Object as PropType<string[]>, required: true },
  initVert: { type: String, required: false },
  initHori: { type: String, required: false },
  globalCounts: { type: Object as PropType<Counts>, required: true },
});

const xKey = ref<string>(initHori ?? selectableGroups[0]);
const yKey = ref<string>(initVert ?? selectableGroups[1]);
const applyGlobalMask = ref<boolean>(true);
// const useLogScale = ref<boolean>(false);
const normalisation = ref<Normalisation>(Normalisation.None);

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

const normalisedCounts = computed<Record<number, Record<number, number>>>(() => {
  const rawData = counts.value;
  const mode = normalisation.value;

  // If no normalisation is required, just return the raw counts
  if (mode === Normalisation.None) return rawData;

  return Object.fromEntries(
    Object.entries(rawData).map(([y, row], i) => [
      y,
      Object.fromEntries(
        Object.entries(row).map(([x, val], j) => {
          let divisor = 1;

          switch (mode) {
            case Normalisation.Total:
              divisor = total.value;
              break;
            case Normalisation.ColTotal:
              divisor = colTotal.value[i];
              break;
            case Normalisation.RowTotal:
              divisor = rowTotal.value[i];
              break;
            case Normalisation.Sum:
              divisor = sum.value;
              break;
            case Normalisation.RowSum:
              divisor = rowSum.value[i];
              break;
            case Normalisation.ColSum:
              divisor = colSum.value[j];
              break;
            case Normalisation.RowMax:
              divisor = rowMax.value[i];
              break;
            case Normalisation.ColMax:
              divisor = colMax.value[j];
              break;
          }

          // Avoid division by zero so we don't end up with Infinity/NaN in your UI
          const result = divisor !== 0 ? val / divisor : 0;
          return [x, result];
        }),
      ),
    ]),
  ) as Record<number, Record<number, number>>;
});
const total = computed(() => (applyGlobalMask.value ? globalCounts.countFiltered : globalCounts.countTotal));
const sum = computed(() =>
  Object.values(counts.value).reduce(
    (sum, values) => sum + Object.values(values).reduce((sum, val) => sum + val, 0),
    0,
  ),
);
const rowMax = computed(() => Object.values(counts.value).map((values) => Math.max.apply(null, Object.values(values))));
const colMax = computed(() => {
  const maxima: Record<number, number> = {};
  Object.values(counts.value).forEach((values) => {
    Object.values(values).forEach((value, j) => {
      if (!(j in maxima)) maxima[j] = value;
      else if (maxima[j] < value) maxima[j] = value;
    });
  });
  return Object.values(maxima);
});
const rowSum = computed(() =>
  Object.values(counts.value).map((values) => Object.values(values).reduce((sum, val) => sum + val, 0)),
);
const colSum = computed(() => {
  const maxima: Record<number, number> = {};
  Object.values(counts.value).forEach((values) => {
    Object.values(values).forEach((value, j) => {
      if (!(j in maxima)) maxima[j] = value;
      else maxima[j] += value;
    });
  });
  return Object.values(maxima);
});

const colTotal = computed(() =>
  Object.values(groupMasks.value[xKey.value].masks).map((mask) =>
    applyGlobalMask.value ? mask.counts.value.countFiltered : mask.counts.value.countTotal,
  ),
);
const rowTotal = computed(() =>
  Object.values(groupMasks.value[yKey.value].masks).map((mask) =>
    applyGlobalMask.value ? mask.counts.value.countFiltered : mask.counts.value.countTotal,
  ),
);

const colours = computed(() => {
  const extent = d3extent(Object.values(normalisedCounts.value).flatMap((row) => Object.values(row))) as [
    number,
    number,
  ];
  extent[1] += (extent[1] - extent[0]) * 0.5;
  // if (useLogScale.value) return d3scaleSequentialLog(extent, interpolateYlGn);
  return d3scaleSequential(extent, interpolateYlGn);
});

const dropdownOptions = computed(
  () =>
    selectableGroups.map((key) => ({
      key: key,
      name: fullScheme.value[key].name,
    })),
  // Object.values(fullScheme.value)
  //   .map((label) => ({
  //     key: label.key,
  //     name: label.name,
  //     stackedName: label.key,
  //   }))
  //   .toSorted((a, b) => (a.name > b.name ? 1 : -1)),
);

function swapAxes() {
  const tmp = xKey.value;
  xKey.value = yKey.value;
  yKey.value = tmp;
}

function selectCell(x: SCMValue, y: SCMValue, event: Event) {
  groupMasks.value[xKey.value].active.value = true;
  for (const mask of Object.values(groupMasks.value[xKey.value].masks)) {
    if (mask.name === x.name) {
      mask.active.value = !mask.active.value;
    }
  }

  groupMasks.value[yKey.value].active.value = true;
  for (const mask of Object.values(groupMasks.value[yKey.value].masks)) {
    if (mask.name === y.name) {
      mask.active.value = !mask.active.value;
    }
  }

  try {
    if (event.target) {
      (event.target as HTMLElement).style.border = "2px solid black";
      setTimeout(() => {
        if (event.target) (event.target as HTMLElement).style.border = "none";
      }, 3500);
    }
  } catch {}
}

const formatPercent = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatNumber = new Intl.NumberFormat("en-US", {
  style: "decimal",
  maximumFractionDigits: 0,
});
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
              :id="`incl-global-${uniq}`"
              v-model="applyGlobalMask" />
            <label class="form-check-label" :for="`incl-global-${uniq}`">Apply global filter</label>
          </div>
          <select v-model="normalisation" class="form-select form-select-sm mb-3">
            <option v-for="norm in Normalisation" :value="norm" :key="norm">{{ norm }}</option>
          </select>
        </div>

        <div class="col">
          <label :for="`ykey-${uniq}`">Vertical axis</label>
          <select class="form-select form-select-sm" v-model="yKey" :id="`ykey-${uniq}`">
            <option v-for="label in dropdownOptions" :key="label.key" :value="label.key" :disabled="label.key === xKey">
              {{ label.name }}
            </option>
          </select>
        </div>
        <div class="col text-muted small p-0 mt-4" style="flex: 0">
          <font-awesome-icon icon="right-left" role="button" @click="swapAxes" />
        </div>
        <div class="col">
          <label :for="`xkey-${uniq}`">Horizontal axis</label>
          <select class="form-select form-select-sm" v-model="xKey" :id="`xkey-${uniq}`">
            <option v-for="label in dropdownOptions" :key="label.key" :value="label.key" :disabled="label.key === yKey">
              {{ label.name }}
            </option>
          </select>
        </div>
      </div>

      <div class="overflow-auto" style="padding: 1em">
        <table v-if="fullScheme[xKey] && fullScheme[yKey]" class="table align-middle" style="margin: 0">
          <tbody>
            <tr>
              <th></th>
              <th v-for="xValue in fullScheme[xKey].values" :key="String(xValue.value)" style="text-align: center">
                {{ xValue.name }}
              </th>
              <th>Total</th>
            </tr>
            <tr v-for="(yValue, idx) in fullScheme[yKey].values" :key="+yValue.value">
              <th>{{ yValue.name }}</th>
              <td
                v-for="xValue in fullScheme[xKey].values"
                :key="+xValue.value"
                :style="{ 'background-color': colours(normalisedCounts[+yValue.value][+xValue.value]) }"
                @click="selectCell(xValue, yValue, $event)">
                <!--                <span style="color: white; mix-blend-mode: difference">-->
                <template v-if="normalisation === Normalisation.None">{{
                  formatNumber.format(counts[+yValue.value][+xValue.value])
                }}</template>
                <template v-else>
                  {{ formatPercent.format(normalisedCounts[+yValue.value][+xValue.value]) }}<br />
                  <span class="fst-italic small opacity-75"
                    >({{ formatNumber.format(counts[+yValue.value][+xValue.value]) }})</span
                  >
                </template>
                <!--                </span>-->
              </td>
              <td>
                {{ formatNumber.format(rowTotal[idx]) }}<br />
                <span class="fst-italic small opacity-75">Sum: {{ formatNumber.format(rowSum[idx]) }}</span>
              </td>
            </tr>
            <tr>
              <th>Total</th>
              <td v-for="(value, idx) in colTotal">
                {{ formatNumber.format(value) }}<br />
                <span class="fst-italic small opacity-75">Sum: {{ formatNumber.format(colSum[idx]) }}</span>
              </td>
              <td>
                {{ formatNumber.format(total) }}<br />
                <span class="fst-italic small opacity-75">Sum: {{ formatNumber.format(sum) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="text-muted small">
          <span class="fst-italic">
            Please note, that most labels use double-coding. This means that multiple classes of a label can be assigned
            to a document and counts overlap. Therefore, you can select normalisation by total (the unique record count
            in the current filter) and sum (sum of counts).
          </span>
        </div>
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
