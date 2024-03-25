<script setup lang="ts">
import { IndexMask } from "@/util/dataset/masks/ids.ts";
import { onMounted, type PropType, ref, watch } from "vue";
import type { Table } from "apache-arrow";
import type { ArrowSchema } from "@/util/types";
import { type None, useDelay } from "@/util";
import type { Bitmask } from "@/util/dataset/masks/bitmask.ts";
import { scaleLinear, scaleLog } from "d3-scale";
import createScatterplot from "regl-scatterplot";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

type Point = [number, number, number, number];
const globalMask = defineModel<Bitmask | None>("globalMask", { required: true });
const mask = defineModel<IndexMask>("mask", { required: true });
const props = defineProps({
  arrow: { type: Object as PropType<Table<ArrowSchema>>, required: true },
});

const { selectIds, clear: clearSelection, active, counts } = mask.value;

const canvasContainerElement = ref<HTMLDivElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);

let points: Point[];
let scatterplot;
const maxPointLabels = 200;
const lassoMinDelay = 10;
const lassoMinDist = 2;

let pointSize = 1;
let selection = [];
onMounted(async () => {
  console.time("loading points");
  console.log(props.arrow);
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
    if (!textOverlayCtx) return;

    textOverlayCtx.font = `${overlayFontSize * window.devicePixelRatio}px sans-serif`;
    textOverlayCtx.textAlign = "center";

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
    await scatterplot.zoomToLocation([0.5, 0.5], 0.5);

    scatterplot.subscribe("select", async ({ points: selectedPoints }) => {
      console.log("Selected:", selectedPoints);
      selection = selectedPoints;
      if (selection.length === 1) {
        const point = points[selection[0]];
        console.log(`X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${point[3]}`);
      }
      selectIds(selectedPoints);
    });

    scatterplot.subscribe("deselect", async () => {
      console.log("Unselected!");
      clearSelection();
      // TODO: propagate information
    });

    const showPointLabels = (pointsInView, xScale, yScale) => {
      textOverlayCtx.clearRect(0, 0, canvas.width, canvas.height);
      textOverlayCtx.fillStyle = "rgb(255, 255, 255)";

      for (let i = 0; i < pointsInView.length; i++) {
        textOverlayCtx.fillText(
          pointsInView[i],
          xScale(points[pointsInView[i]][0]) * window.devicePixelRatio,
          yScale(points[pointsInView[i]][1]) * window.devicePixelRatio -
          overlayFontSize * 1.2 * window.devicePixelRatio,
        );
      }
    };

    const hidePointLabels = () => {
      textOverlayCtx.clearRect(0, 0, canvas.width, canvas.height);
    };

    scatterplot.subscribe("view", ({ xScale, yScale }) => {
      const pointsInView = scatterplot.get("pointsInView");
      if (pointsInView.length <= maxPointLabels) {
        showPointLabels(pointsInView, xScale, yScale);
      } else {
        hidePointLabels();
      }
    });

    const getPointSizeRange = (basePointSize) => {
      const pointSizeScale = scaleLog()
        .domain([1, 10])
        .range([basePointSize, basePointSize * 10]);

      return Array(100)
        .fill()
        .map((x, i) => pointSizeScale(1 + (i / 99) * 9));
    };

    const setPointSize = (newPointSize) => {
      pointSize = newPointSize;
      scatterplot.set({ pointSize: getPointSizeRange(pointSize) });
    };

    setPointSize(pointSize);

    console.log(scatterplot)
    console.log(canvasElement.value)
    const { delayedCall: delayedRedraw } = useDelay(() => {
      //
    }, 100);
    watch(globalMask, delayedRedraw);

    const containerObserver = new ResizeObserver((r) => {
      console.log(r[0].contentRect.width, r[0].contentRect.height);
    });
    containerObserver.observe(canvasContainer);
  }
});
const uniq = crypto.randomUUID();
</script>

<template>
  <div class="scatter-container">
    <div class="ms-auto">
      <span>{{ counts.countFiltered.toLocaleString() }} / {{ counts.countTotal.toLocaleString() }}</span>
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
