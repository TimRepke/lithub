<script setup lang="ts">
import { IndexMask } from "@/util/dataset/masks/ids.ts";
import { onMounted, type PropType, ref, watch } from "vue";
import type { Table } from "apache-arrow";
import type { ArrowSchema, Keyword, ReglScatterplot } from "@/util/types";
import { type None } from "@/util";
import type { Bitmask } from "@/util/dataset/masks/bitmask.ts";
import { scaleLinear, type ScaleContinuousNumeric } from "d3-scale";
import createScatterplot from "regl-scatterplot";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { LabelMaskGroup } from "@/util/dataset/masks/labels.ts";

type Scale = ScaleContinuousNumeric<number, number>;
// type ViewPayload = Pick<Properties, "camera" | "xScale" | "yScale"> & { view: Properties["cameraView"] };
type ViewBounds = { topRight: [number, number]; bottomLeft: [number, number] };
type Point = [number, number, number, number];

const uniq = crypto.randomUUID();
const mask = defineModel<IndexMask>("mask", { required: true });
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const globalVersion = defineModel<number>("globalVersion", { required: true });
const pickedColour = defineModel<string>("pickedColour", { required: true });
const groupMasks = defineModel<Record<string, LabelMaskGroup>>("groupMasks", { required: true });
const keywords = defineModel<Keyword[]>("keywords", { required: true });
const { arrow, maxKeywordsInView } = defineProps({
  arrow: { type: Object as PropType<Table<ArrowSchema>>, required: true },
  maxKeywordsInView: { type: Number, required: false, default: 20 },
});

const { selectIds, clear: clearSelection, active, counts } = mask.value;

const canvasContainerElement = ref<HTMLDivElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const keywordsVisible = ref(true);

let points: Point[];
let scatterplot: ReglScatterplot;

const OPACITY_DEFAULT = 1;
const OPACITY_HIDDEN = 0.2;
const POINT_SIZE_DEFAULT = 1.5;
const POINT_SIZE_HIDDEN = 0.8;

const lassoMinDelay = 10;
const lassoMinDist = 2;

onMounted(async () => {
  console.time("loading points");
  const x = arrow.getChild("x")!;
  const y = arrow.getChild("y")!;
  const { numRows } = arrow;
  points = new Array(numRows);
  for (let i = 0; i < numRows; i++) {
    points[i] = [x.get(i), y.get(i), 1, 1];
  }
  console.timeEnd("loading points");

  const canvas = canvasElement.value;
  const canvasContainer = canvasContainerElement.value;
  if (canvas && canvasContainer) {
    const textOverlayEl: HTMLCanvasElement = document.createElement("canvas");
    textOverlayEl.id = "#text-overlay";
    textOverlayEl.style.position = "absolute";
    textOverlayEl.style.top = "0";
    textOverlayEl.style.right = "0";
    textOverlayEl.style.bottom = "0";
    textOverlayEl.style.left = "0";
    textOverlayEl.style.pointerEvents = "none";

    canvasContainer.appendChild(textOverlayEl);

    const resizeTextOverlay = () => {
      const { width, height } = canvasContainer.getBoundingClientRect();
      textOverlayEl.width = width * window.devicePixelRatio;
      textOverlayEl.height = height * window.devicePixelRatio;
      textOverlayEl.style.width = `${width}px`;
      textOverlayEl.style.height = `${height}px`;
    };
    resizeTextOverlay();

    window.addEventListener("resize", resizeTextOverlay);

    const overlayFontSize = 12;
    const textOverlayCtx = textOverlayEl.getContext("2d");

    //@ts-ignore
    scatterplot = createScatterplot({
      canvas: canvas,
      lassoMinDelay,
      lassoMinDist,
      showReticle: true,
      reticleColor: [1, 1, 0.878431373, 0.0],
      xScale: scaleLinear().domain([0, 1]),
      yScale: scaleLinear().domain([0, 1]),
      opacity: [OPACITY_HIDDEN, OPACITY_DEFAULT],
      pointSize: [POINT_SIZE_HIDDEN, POINT_SIZE_DEFAULT],
      lassoInitiator: true,
      // opacityBy: "density",
      // backgroundColor: "#333333",
    });
    scatterplot.set({
      colorBy: "valueA",
      opacityBy: "valueB",
      sizeBy: "valueB",
    });
    console.time("first draw");
    await scatterplot.draw(points);
    console.timeEnd("first draw");

    // await scatterplot.zoomToLocation([0.5, 0.5], 0.5);

    function getViewBounds(xScale: Scale, yScale: Scale): ViewBounds {
      const rect = canvas!.getBoundingClientRect();
      const topRight: [number, number] = [xScale.invert(rect.width / window.devicePixelRatio), yScale.invert(0)];
      const bottomLeft: [number, number] = [xScale.invert(0), yScale.invert(rect.height / window.devicePixelRatio)];
      return { topRight, bottomLeft };
    }

    function inBounds(bounds: ViewBounds, x: number, y: number): boolean {
      const { topRight, bottomLeft } = bounds;
      return x > bottomLeft[0] && x < topRight[0] && y < topRight[1] && y > bottomLeft[1];
    }

    function redrawKeywords() {
      if (textOverlayCtx && canvas && scatterplot) {
        textOverlayCtx.clearRect(0, 0, canvas.width, canvas.height);

        const xScale: Scale | null = scatterplot.get("xScale");
        const yScale: Scale | null = scatterplot.get("yScale");

        if (keywordsVisible.value && xScale && yScale) {
          xScale.domain();
          textOverlayCtx.font = "1.2em bold, sans-serif";
          textOverlayCtx.textAlign = "center";
          textOverlayCtx.lineWidth = 4;
          textOverlayCtx.miterLimit = 2;

          const viewBounds = getViewBounds(xScale, yScale);

          let cnt = 0;
          let x;
          let y;
          const scaling = window.devicePixelRatio;

          for (const keyword of keywords.value) {
            if (inBounds(viewBounds, keyword.x, keyword.y)) {
              cnt += 1;
              x = xScale(keyword.x) * scaling;
              y = yScale(keyword.y) * scaling - overlayFontSize * 1.2 * scaling;

              textOverlayCtx.strokeStyle = "white";
              textOverlayCtx.strokeText(keyword.keyword, x, y);
              textOverlayCtx.fillStyle = "black";
              textOverlayCtx.fillText(keyword.keyword, x, y);
            }
            if (cnt > maxKeywordsInView) break;
          }
        }
      }
    }

    scatterplot.subscribe("view", redrawKeywords);
    scatterplot.subscribe("select", async ({ points: selectedPoints }) => selectIds(selectedPoints));
    scatterplot.subscribe("deselect", clearSelection);

    async function redrawColour() {
      const colours = groupMasks.value[pickedColour.value].colours.value;
      for (let i = 0; i < points.length; i++) {
        points[i][2] = colours[i];
      }
      scatterplot.set({
        pointColor: groupMasks.value[pickedColour.value].hexColours.value,
      });
      await scatterplot.draw(points);
    }

    async function redrawMask() {
      for (let i = 0; i < points.length; i++) {
        points[i][3] = (globalMask.value?.get(i) ?? true) ? 1 : 0;
      }
      await scatterplot.draw(points);
    }

    // initial drawing of keywords (possible redundant to the watch, but make exta sure...)
    redrawKeywords();
    await redrawColour();

    watch(keywords, redrawKeywords);
    watch(keywordsVisible, redrawKeywords);
    watch(pickedColour, redrawColour);
    watch(globalVersion, redrawMask);

    // In case resizing becomes an issue again:
    // https://github.com/flekschas/regl-scatterplot?tab=readme-ov-file#resizing-the-scatterplot
    // const containerObserver = new ResizeObserver((r) => {
    //   console.log(r[0].contentRect.width, r[0].contentRect.height);
    // });
    // containerObserver.observe(canvasContainer);
  }
});
</script>

<template>
  <div class="scatter-container">
    <div class="ms-auto">
      <span>{{ counts.countFiltered.toLocaleString() }} / {{ counts.countTotal.toLocaleString() }}</span>
      <span class="icon-toggle">
        <input type="checkbox" :id="`kws-scatter-${uniq}`" v-model="keywordsVisible" />
        <label :for="`kws-scatter-${uniq}`" class="icon">
          <font-awesome-icon icon="closed-captioning" />
        </label>
      </span>
      <span class="icon-toggle">
        <input type="checkbox" :id="`active-scatter-${uniq}`" v-model="active" />
        <label :for="`active-scatter-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </span>
    </div>
    <div ref="canvasContainerElement" class="scatter-wrapper">
      <canvas ref="canvasElement" />
    </div>
  </div>
</template>

<style scoped>
.scatter-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  font-size: 0.85em;

  .scatter-wrapper {
    display: flex;
    flex-grow: 1;
    position: relative;
    overflow: hidden;
    height: 0;
    /*
        canvas {
          background-color: #0a58ca;
        }
    */
  }
}
</style>
