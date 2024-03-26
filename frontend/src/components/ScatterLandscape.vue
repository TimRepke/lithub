<script setup lang="ts">
import { IndexMask } from "@/util/dataset/masks/ids.ts";
import { onMounted, type PropType, ref, watch } from "vue";
import type { Table } from "apache-arrow";
import type { ArrowSchema, Keyword, ReglScatterplot } from "@/util/types";
import { type None, useDelay } from "@/util";
import type { Bitmask } from "@/util/dataset/masks/bitmask.ts";
import { scaleLinear } from "d3-scale";
import createScatterplot from "regl-scatterplot";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { Scale } from "regl-scatterplot/dist/types";

// type ViewPayload = Pick<Properties, "camera" | "xScale" | "yScale"> & { view: Properties["cameraView"] };
type ViewBounds = { topRight: [number, number]; bottomLeft: [number, number] };
type Point = [number, number, number, number];

const uniq = crypto.randomUUID();
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const mask = defineModel<IndexMask>("mask", { required: true });
const keywords = defineModel<Keyword[]>("keywords", { required: true });
const props = defineProps({
  arrow: { type: Object as PropType<Table<ArrowSchema>>, required: true },
});

const { selectIds, clear: clearSelection, active, counts } = mask.value;

const canvasContainerElement = ref<HTMLDivElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const keywordsVisible = ref(true);

let points: Point[];
let scatterplot: ReglScatterplot;

const MAX_KEYWORDS_IN_VIEW = 20;
const lassoMinDelay = 10;
const lassoMinDist = 2;
const pointSize = 1;

onMounted(async () => {
  console.time("loading points");
  const x = props.arrow!.getChild("x")!;
  const y = props.arrow!.getChild("y")!;
  const { numRows } = props.arrow!;
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

    scatterplot = createScatterplot({
      // backgroundColor: "#333333",
      canvas: canvas,
      lassoMinDelay,
      lassoMinDist,
      pointSize,
      showReticle: true,
      reticleColor: [1, 1, 0.878431373, 0.0],
      xScale: scaleLinear().domain([0, 1]),
      yScale: scaleLinear().domain([0, 1]),
      pointColor: "#6a4480",
      // opacityBy: 'valueA',
      opacity: 1,
      //opacityBy: "density",
      lassoInitiator: true,
    });
    console.time("first draw");
    await scatterplot.draw(points);
    console.timeEnd("first draw");

    // await scatterplot.zoomToLocation([0.5, 0.5], 0.5);

    function getViewBounds(xScale: Scale, yScale: Scale): ViewBounds {
      const rect = canvas!.getBoundingClientRect();
      const topRight: [number, number] = [xScale!.invert(rect.width / window.devicePixelRatio), yScale!.invert(0)];
      const bottomLeft: [number, number] = [xScale!.invert(0), yScale!.invert(rect.height / window.devicePixelRatio)];
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
          textOverlayCtx.font = "1.2em bold, sans-serif";
          textOverlayCtx.textAlign = "center";
          textOverlayCtx.lineWidth = 4;
          textOverlayCtx.miterLimit = 2;

          const viewBounds = getViewBounds(xScale, yScale);

          let cnt = 0;
          let x;
          let y;
          for (const keyword of keywords.value) {
            if (inBounds(viewBounds, keyword.x, keyword.y)) {
              cnt += 1;
              x = xScale(keyword.x) * window.devicePixelRatio;
              y = yScale(keyword.y) * window.devicePixelRatio - overlayFontSize * 1.2 * window.devicePixelRatio;

              textOverlayCtx.strokeStyle = "white";
              textOverlayCtx.strokeText(keyword.keyword, x, y);
              textOverlayCtx.fillStyle = "black";
              textOverlayCtx.fillText(keyword.keyword, x, y);
            }
            if (cnt > MAX_KEYWORDS_IN_VIEW) break;
          }
        }
      }
    }

    // initial drawing of keywords
    redrawKeywords();

    scatterplot.subscribe("view", redrawKeywords);
    scatterplot.subscribe("select", async ({ points: selectedPoints }) => selectIds(selectedPoints));
    scatterplot.subscribe("deselect", clearSelection);

    const { delayedCall: delayedRedraw } = useDelay(() => {
      //
    }, 100);

    watch(globalMask, delayedRedraw);
    watch(keywordsVisible, redrawKeywords);

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

    canvas {
      /*background-color: #0a58ca;*/
    }
  }
}
</style>
