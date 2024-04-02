<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import embed, { Result } from "vega-embed";
import { Spec as VegaSpec } from "vega";
import { tableFromIPC } from "apache-arrow";
import { DATA_BASE, request } from "@/util/api.ts";
import { DataType, TypeMap } from "apache-arrow/type";
import { Type } from "apache-arrow/enum";

const spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  background: "white",
  padding: 5,
  width: 600,
  autosize: { type: "none", resize: true },
  height: 400,
  style: "view",
  data: [
    { name: "counts" },
    {
      name: "world",
      url: "world-110m.json",
      format: { type: "topojson", feature: "countries" },
      transform: [
        {
          type: "lookup",
          from: "counts",
          key: "id",
          fields: ["id"],
          values: ["count"],
        },
        {
          type: "filter",
          expr: 'isValid(datum["count"]) && isFinite(+datum["count"])',
        },
      ],
    },
  ],
  signals: [
    { name: "tx", update: "width / 2" },
    { name: "ty", update: "height / 2" },
    {
      name: "scale",
      value: 100,
      on: [
        {
          events: { type: "wheel", consume: true },
          update: "clamp(scale * pow(1.0005, -event.deltaY * pow(16, event.deltaMode)), 10, 3000)",
        },
      ],
    },
    {
      name: "angles",
      value: [0, 0],
      on: [{ events: "pointerdown", update: "[rotateX, centerY]" }],
    },
    {
      name: "cloned",
      value: null,
      on: [{ events: "pointerdown", update: "copy('projection')" }],
    },
    {
      name: "start",
      value: null,
      on: [{ events: "pointerdown", update: "invert(cloned, xy())" }],
    },
    {
      name: "drag",
      value: null,
      on: [{ events: "[pointerdown, window:pointerup] > window:pointermove", update: "invert(cloned, xy())" }],
    },
    {
      name: "delta",
      value: null,
      on: [{ events: { signal: "drag" }, update: "[drag[0] - start[0], start[1] - drag[1]]" }],
    },
    {
      name: "rotateX",
      value: 0,
      on: [{ events: { signal: "delta" }, update: "angles[0] + delta[0]" }],
    },
    {
      name: "centerY",
      value: 50,
      on: [{ events: { signal: "delta" }, update: "clamp(angles[1] + delta[1], -60, 60)" }],
    },
  ],
  projections: [
    {
      name: "projection",
      // size: { signal: "[width, height]" },
      // fit: { signal: "data('world')" },
      type: "mercator",
      scale: { signal: "scale" },
      rotate: [{ signal: "rotateX" }, 0, 0],
      center: [0, { signal: "centerY" }],
      translate: [{ signal: "tx" }, { signal: "ty" }],
    },
  ],
  marks: [
    {
      name: "marks",
      type: "shape",
      style: ["geoshape"],
      from: { data: "world" },
      encode: {
        update: {
          stroke: { value: "#706545" },
          strokeWidth: { value: 0.25 },
          fill: { scale: "color", field: "count" },
          tooltip: { signal: 'format(datum["count"], "")' },
          ariaRoleDescription: { value: "geoshape" },
          description: {
            signal: '"count: " + (format(datum["count"], "d"))',
          },
        },
      },
      transform: [{ type: "geoshape", projection: "projection" }],
    },
  ],
  scales: [
    {
      name: "color",
      type: "linear",
      domain: { data: "world", field: "count" },
      range: "heatmap",
      interpolate: "hcl",
      zero: false,
    },
  ],
  legends: [
    {
      type: "gradient",
      direction: "horizontal",
      orient: "bottom",
      format: "d",
      fill: "color",
      // gradientLength: { signal: "clamp(height, 64, 200)" },
      title: "count",
    },
  ],
  config: { style: { cell: { stroke: null } } },
} as VegaSpec;

interface PlacesSchema extends TypeMap {
  idx: DataType<Type.Uint32>;
  // country: DataType<Type.Utf8>;
  country_num: DataType<Type.Uint16>;
}

const mapElement = ref<HTMLDivElement | null>(null);
const uniq = crypto.randomUUID();
let vegaContainer: Result;

onMounted(async () => {
  if (mapElement.value) {
    const req = await request({ method: "GET", path: `${DATA_BASE}/policymap/geocodes.minimal.arrow`, keepPath: true });
    const places = await tableFromIPC<PlacesSchema>(req.arrayBuffer());
    // const idxs = places.getChild("idx")!;
    const countries = places.getChild("country_num")!;
    const { numRows } = places;
    const counts: Record<number, number> = {};
    let _country: number;
    for (let i = 0; i < numRows; i++) {
      _country = countries.get(i);
      if (!(_country in counts)) counts[_country] = 1;
      else counts[_country] += 1;
    }

    try {
      vegaContainer = await embed(mapElement.value, spec, { actions: false });

      vegaContainer.view.data(
        "counts",
        Object.entries(counts).map((entry) => ({
          id: entry[0],
          count: entry[1],
        })),
      );
      vegaContainer.view.runAsync();
      setTimeout(() => vegaContainer.view.runAsync(), 500);
    } catch (e) {
      console.error(e);
    }
    // updateData();

    const containerObserver = new ResizeObserver((r) => {
      // vega-view/src/watchPixelRatio.js
      vegaContainer.view.width(r[0].contentRect.width);
      console.log(r)
      vegaContainer.view.resize().runAsync();
    });
    containerObserver.observe(mapElement.value!);

    // vegaContainer.view.addSignalListener("brush", delayedPropagateSelection);
  }
});

// watch()
</script>

<template>
  <div ref="mapElement" style="height: 0" />
</template>

<style scoped></style>
