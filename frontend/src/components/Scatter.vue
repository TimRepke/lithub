<script setup lang="ts">
import {onMounted, Ref, ref, ShallowRef, triggerRef, watch} from 'vue'

import {scaleLinear, scaleLog} from 'd3-scale';

import createScatterplot from 'regl-scatterplot';
import {tableFromIPC, type Table} from "apache-arrow";
import {uint16ToFloat64} from "apache-arrow/util/math";

import {FalconVis, ArrowDB} from "falcon-vis";
import type {View0D, View1D, View0DState, View1DState} from "falcon-vis";
import type {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import embed from "vega-embed";
import {vega} from "vega-embed";
import {BitSet, union} from "falcon-vis/build/bitset";
import {Row, RowIterator} from "falcon-vis/build/iterator";

defineProps<{ msg: string }>()

const includeUnlabelled = ref(true);

const histogram = ref(Object.fromEntries([...Array(35)].map((v, i) => [i + 1990, 0])))
histogram.value.rest = 0
// const counts = ref({})

let table: Table;
let points: [number, number, number, number][];
let scatterplot;

let pyhist;
let falcon: FalconVis;
let countView: View0D;
let countState: Ref<View0DState> = ref({
  total: null,
  filter: null,
});
let pyView: View1D;
let pyState: View1DState;

let scatterView: View1D;
let scatterState: View1DState;

// let distanceView: View1D;
// let depDelayView: View1D;
// let flightDateView: View1D;
// let originView: View1D;
// let arrDelayState: View1DState;
// let depDelayState: View1DState;
// let flightDateState: View1DState;
// let originState: View1DState;

watch(includeUnlabelled, (newValue: boolean) => {
  if (scatterplot) {
    if (newValue) {
      scatterplot.unfilter();
    } else {
      scatterplot.filter(table.data.flatMap((batch) => {
        return [...Array(batch.length)].map((v, i) => {
          return (batch.children[5].values[i] !== undefined) ? i : null;
        })
      }).filter((idx) => idx !== null));
    }

  }
});

function fetchFilter() {
  // https://stackoverflow.com/questions/21797299/convert-base64-string-to-arraybuffer
  const binary_string = atob(b64);
  var len = binary_string.length;
  var bytes = new Uint32Array(len);
  for (var i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  verify(bytes, "2");
}


const spec = {
  $schema: "https://vega.github.io/schema/vega-lite/v5.json",
  description: "A simple bar chart with embedded data.",
  data: {
    name: "table",
  },
  background: "transparent",
  width: 'container',
  padding: 5,
  autosize: {
    type: "fit-x",
    resize: true,
    contains: "padding",
  },
  height: 100,
  config: {
    numberFormat: 'd',
  },
  layer: [
    {
      params: [
        {
          name: "brush",
          select: {type: "interval", encodings: ["x"]}
        }
      ],
      mark: {type: "bar", cursor: "col-resize"},

      encoding: {
        tooltip: [
          {"field": "binStart", "type": "quantitative", "title": "Publication year"},
          {"field": "totalCount", "type": "quantitative", "title": "# papers"},
          {"field": "filteredCount", "type": "quantitative", "title": "# papers (filtered)"}
        ],
        size: {
          legend: null
        },
        x: {
          type: "quantitative",
          field: "binStart",
          bin: {binned: true},
          title: "",
          axis: {
            // title: "dimTitle",
            labelColor: "rgba(0, 0, 0, 0.6)"
          }
        },
        x2: {field: "binEnd"},
        y: {
          field: "totalCount",
          type: "quantitative",
          title: "",
          axis: {
            // title: "countTitle",
            tickCount: 2,
            labelColor: "rgba(0, 0, 0, 0.6)"
          }
        },
        color: {value: "hsl(171,0%,80%)"}
      }
    },
    {
      mark: {
        type: "bar",
      },
      encoding: {
        size: {
          legend: null,
        },
        x: {
          type: "quantitative",
          field: "binStart",
          bin: {binned: true},
          title: "",
        },
        x2: {field: "binEnd"},
        y: {
          field: "filteredCount",
          type: "quantitative",
        },
        color: {value: "hsl(171,69%,47%)"}
      },
    },
  ],
} as VegaLiteSpec;
setTimeout(() => console.log(scatterplot), 2000)

function updatephist() {
  pyhist.view.data('table', pyState.bin?.map((binEdges, i) => {
    return {
      ...binEdges,
      filteredCount: pyState.filter[i],
      totalCount: pyState.total[i]
    }
  }))
}

onMounted(async () => {
  const canvas = document.querySelector<HTMLCanvasElement>('#canvas');
  const canvasWrapper = document.querySelector('#canvas-wrapper');

  if (canvas && canvasWrapper) {

    table = await tableFromIPC(fetch('http://localhost:5173/policies.min.arrow'));
    console.table(table)

    console.time('falcon-arrow')
    const db = new ArrowDB(table);
    console.timeEnd('falcon-arrow')

    falcon = new FalconVis(db);
    countView = await falcon.view0D(async (updated) => {
      countState.value = updated;
      triggerRef(countState)
      // console.log(falcon)
    });

    pyView = await falcon.view1D({
      type: "continuous",
      name: "publication_year",
      resolution: 150,
      bins: 35,
      range: [1990, 2024],
    });
    pyView.onChange((updated) => {
      pyState = updated;
      console.log('updcont', updated);
    });

    scatterView = await falcon.view1D({
      type: "categorical",
      name: "idx",
    });
    scatterView.onChange((updated) => {
      scatterState = updated;
      console.log('updcat', updated);
    });

    await falcon.link();

    // https://github.com/vega/vega-embed?tab=readme-ov-file#api-reference
    pyhist = await embed("#pyhist", spec, {
      actions: false,
    });
    //pyhist.view.
    //
    // const changeset = pyhist.view
    //     .changeset()
    //     .remove(() => true)
    //     .insert(pyState.bin?.map((binEdges, i) => ({
    //       ...binEdges,
    //       filteredCount: pyState.filter[i],
    //       totalCount: pyState.total[i]
    //     })));
    // pyhist.view.change("table", changeset);
    updatephist()

    pyhist.view.addEventListener("mouseenter", async () => {
      // prefetches the falcon data index
      await pyView.activate();
    });
    pyhist.view.addSignalListener("brush", async (...s) => {
      const brush = s[1]["binStart"] ?? null;
      if (brush !== null) {
        await pyView.select(brush);
        const entries: Iterable<Row | null> = await db.entries(0, Infinity, falcon.filters)
        scatterplot.filter([...entries].map((row: Row | null) => row['idx']));
      } else {
        scatterplot.unfilter()
        await pyView.select();
      }
    });

    console.time('points')
    points = [...await db.entries()].map((row: Row | null) => [row['x'], row['y'], 1, 1]);
    console.timeEnd('points')


    const textOverlayEl: HTMLCanvasElement = document.createElement('canvas');
    textOverlayEl.id = '#text-overlay';
    textOverlayEl.style.position = 'absolute';
    textOverlayEl.style.top = '0';
    textOverlayEl.style.right = '0';
    textOverlayEl.style.bottom = '0';
    textOverlayEl.style.left = '0';
    textOverlayEl.style.pointerEvents = 'none';

    canvasWrapper.appendChild(textOverlayEl);

    const resizeTextOverlay = () => {
      const {width, height} = canvasWrapper.getBoundingClientRect();
      textOverlayEl.width = width * window.devicePixelRatio;
      textOverlayEl.height = height * window.devicePixelRatio;
      textOverlayEl.style.width = `${width}px`;
      textOverlayEl.style.height = `${height}px`;
    };
    resizeTextOverlay();

    window.addEventListener('resize', resizeTextOverlay);

    const overlayFontSize = 12;
    const textOverlayCtx = textOverlayEl.getContext('2d');
    if (!textOverlayCtx) return;

    textOverlayCtx.font = `${
        overlayFontSize * window.devicePixelRatio
    }px sans-serif`;
    textOverlayCtx.textAlign = 'center';


    let pointSize = 1;
    let selection = [];

    const maxPointLabels = 200;
    const lassoMinDelay = 10;
    const lassoMinDist = 2;

    scatterplot = createScatterplot({
      canvas,
      lassoMinDelay,
      lassoMinDist,
      pointSize,
      showReticle: true,
      reticleColor: [1, 1, 0.878431373, 0.0],
      xScale: scaleLinear().domain([-1, 1]),
      yScale: scaleLinear().domain([-1, 1]),
      pointColor: '#fff',
      // opacityBy: 'valueA',
      // opacity: 1,
      opacityBy: 'density',
      lassoInitiator: true,
    });
    console.time('draw')
    scatterplot.draw(points);
    console.timeEnd('draw')

    scatterplot.subscribe('select', async ({points: selectedPoints}) => {
      console.log('Selected:', selectedPoints);
      selection = selectedPoints;
      if (selection.length === 1) {
        const point = points[selection[0]];
        console.log(
            `X: ${point[0]}\nY: ${point[1]}\nCategory: ${point[2]}\nValue: ${point[3]}`
        );
      }
      await scatterView.activate();
      await scatterView.select(selectedPoints)
      // await falcon.entries();
      console.log(scatterView)
      updatephist()
    });

    scatterplot.subscribe('deselect', async () => {
      selection = [];
      await scatterView.select()
      updatephist()
    });

    const showPointLabels = (pointsInView, xScale, yScale) => {
      textOverlayCtx.clearRect(0, 0, canvas.width, canvas.height);
      textOverlayCtx.fillStyle = 'rgb(255, 255, 255)';

      for (let i = 0; i < pointsInView.length; i++) {
        textOverlayCtx.fillText(
            pointsInView[i],
            xScale(points[pointsInView[i]][0]) * window.devicePixelRatio,
            yScale(points[pointsInView[i]][1]) * window.devicePixelRatio -
            overlayFontSize * 1.2 * window.devicePixelRatio
        );
      }
    };

    const hidePointLabels = () => {
      textOverlayCtx.clearRect(0, 0, canvas.width, canvas.height);
    };

    scatterplot.subscribe('view', ({xScale, yScale}) => {
      const pointsInView = scatterplot.get('pointsInView');
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
      scatterplot.set({pointSize: getPointSizeRange(pointSize)});
    };


    setPointSize(pointSize);

  } else {
    console.log('Mising element')
  }
});

// const asArray = value.getChild('filter').toArray();
</script>

<template>
  <div class="d-flex flex-row">
    <div id="topbar" tabindex="0" class="col-2">
      <div id="title-wrapper" class="flex flex-jc-sb">
        <h1 id="title">Regl Scatterplot</h1>
        <span class="no-select">Menu</span>
        <div class="form-check form-switch">
          <input class="form-check-input" type="checkbox" role="switch" id="includeUnlabelled"
                 v-model="includeUnlabelled">
          <label class="form-check-label" for="includeUnlabelled">Show unlabelled</label>
        </div>
        <div v-if="countState">{{ Number(countState.filter).toLocaleString() }} /
          {{ Number(countState.total).toLocaleString() }}
        </div>
        <div id="pyhist" class="w-100"></div>
      </div>
    </div>
    <div id="parent-wrapper" class="flex-grow-1 bg-dark position-relative">
      <div id="canvas-wrapper" class="position-relative">
        <canvas id="canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
