<script setup lang="ts">
import type { TopLevelSpec as VegaLiteSpec } from "vega-lite/build/src/spec";
import { onMounted, ref, watch } from "vue";
import embed, { Result } from "vega-embed";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useDelay } from "@/util";
import { SignalValue } from "vega";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";

const mask = defineModel<HistogramMask>("mask", { required: true });
const { masks, active, years, clear, selectRange } = mask.value;

const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  data: {
    name: "table",
  },
  background: "transparent",
  width: "container",
  padding: 5,
  autosize: {
    type: "fit-x",
    resize: true,
    contains: "padding",
  },
  height: 100,
  config: {
    numberFormat: "d",
  },
  layer: [
    {
      params: [
        {
          name: "brush",
          select: { type: "interval", encodings: ["x"] },
        },
      ],
      mark: { type: "bar", cursor: "col-resize" },

      encoding: {
        tooltip: [
          { field: "year", type: "quantitative", title: "Publication year" },
          { field: "countTotal", type: "quantitative", title: "# papers" },
          { field: "countFiltered", type: "quantitative", title: "# papers (filtered)" },
        ],
        // size: {
        //   legend: null,
        // },
        x: {
          type: "quantitative",
          field: "yearStart",
          bin: { binned: true },
          title: "",
          axis: {
            // title: "dimTitle",
            labelColor: "rgba(0, 0, 0, 0.6)",
          },
        },
        x2: { field: "yearEnd" },
        y: {
          field: "countTotal",
          type: "quantitative",
          title: "",
          axis: {
            // title: "countTitle",
            tickCount: 2,
            labelColor: "rgba(0, 0, 0, 0.6)",
          },
        },
        color: { value: "hsl(171,0%,80%)" },
      },
    },
    {
      mark: {
        type: "bar",
      },
      encoding: {
        // size: {
        //   legend: null,
        // },
        x: {
          type: "quantitative",
          field: "yearStart",
          bin: { binned: true },
          title: "",
        },
        x2: { field: "yearEnd" },
        y: {
          field: "countFiltered",
          type: "quantitative",
        },
        color: { value: "hsl(171,69%,47%)" },
      },
    },
  ],
} as VegaLiteSpec;

const histogramElement = ref<HTMLDivElement | null>(null);
const uniq = crypto.randomUUID();
let vegaContainer: Result;
onMounted(async () => {
  vegaContainer = await embed(histogramElement.value!, spec, { actions: false });
  updateData();

  const containerObserver = new ResizeObserver((r) => {
    // vega-view/src/watchPixelRatio.js
    vegaContainer.view.width(r[0].contentRect.width);
    vegaContainer.view.resize().runAsync();
  });
  containerObserver.observe(histogramElement.value!);

  vegaContainer.view.addSignalListener("brush", delayedPropagateSelection);
});

const { delayedCall: delayedPropagateSelection } = useDelay(
  // @ts-ignore
  (name: string, value: SignalValue) => {
    const brush: [number, number] | null = value["yearStart"] ?? null;
    if (brush !== null) {
      selectRange(...brush);
    } else {
      clear();
    }
    vegaContainer.view.runAsync();
  },
  100,
);

const { call: updateData } = useDelay(() => {
  vegaContainer.view.data(
    "table",
    years.map((yr) => ({
      year: yr,
      yearStart: yr,
      yearEnd: yr + 1,
      countFiltered: masks[yr].counts.value.countFiltered,
      countTotal: masks[yr].counts.value.countTotal,
    })),
  );
  vegaContainer.view.runAsync();
}, 200);

watch(
  [...Object.values(masks)].map((yMask) => yMask.counts.value),
  updateData,
);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>Publication years</div>
      <div>
        <input type="checkbox" :id="`active-pyhist-${uniq}`" v-model="active" />
        <label :for="`active-pyhist-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </div>
    </div>
    <div ref="histogramElement" class="hist" />
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
}
</style>
