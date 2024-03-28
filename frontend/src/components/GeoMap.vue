<script setup lang="ts">
import { onMounted, ref } from "vue";
import embed, { Result } from "vega-embed";
import { Spec as VegaSpec } from "vega";

const spec = {
  $schema: "https://vega.github.io/schema/vega/v5.json",
  description: "A configurable map of countries of the world.",
  width: 600,
  height: 400,
  autosize: "none",
  // width: "container",
  // height: "container",
  // autosize: {
  //   type: "fit",
  //   resize: true,
  //   contains: "padding",
  // },
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
      value: 0,
      on: [{ events: { signal: "delta" }, update: "clamp(angles[1] + delta[1], -60, 60)" }],
    },
  ],

  projections: [
    {
      name: "projection",
      type: "mercator",
      scale: { signal: "scale" },
      rotate: [{ signal: "rotateX" }, 0, 0],
      center: [0, { signal: "centerY" }],
      translate: [{ signal: "tx" }, { signal: "ty" }],
    },
  ],

  data: [
    {
      name: "world",
      url: "world110.json",
      format: {
        type: "topojson",
        feature: "countries",
      },
    },
  ],

  marks: [
    {
      type: "shape",
      from: { data: "world" },
      encode: {
        update: {
          strokeWidth: { value: 1 },
          stroke: { value: "#777" }, // { signal: "invert ? '#777' : '#bbb'" },
          fill: { value: "#fff" }, // { signal: "invert ? '#fff' : '#000'" },
          zindex: { value: 0 },
        },
        hover: {
          strokeWidth: { value: 2 },
          stroke: { value: "firebrick" },
          zindex: { value: 1 },
        },
      },
      transform: [{ type: "geoshape", projection: "projection" }],
    },
  ],
} as VegaSpec;

const mapElement = ref<HTMLDivElement | null>(null);
const uniq = crypto.randomUUID();
let vegaContainer: Result;

onMounted(async () => {
  if (mapElement.value) {
    try {
      vegaContainer = await embed(mapElement.value, spec, { actions: false });

      // setTimeout(() => vegaContainer.view.runAsync(), 100)
    } catch (e) {
      console.error(e);
    }
    // updateData();

    // const containerObserver = new ResizeObserver((r) => {
    //   // vega-view/src/watchPixelRatio.js
    //   vegaContainer.view.width(r[0].contentRect.width);
    //   vegaContainer.view.resize().runAsync();
    // });
    // containerObserver.observe(histogramElement.value!);
    //
    // vegaContainer.view.addSignalListener("brush", delayedPropagateSelection);
  }
});
</script>

<template>
  <div ref="mapElement" style="height: 0" />
</template>

<style scoped></style>
