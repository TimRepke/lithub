<script setup lang="ts">
import * as d3 from 'd3';
import {onMounted, ref} from "vue";
import {ScatterPlot, cat20} from "@/plugins/scatter";
import Barchart from "@/plugins/scatter/barchart";
import type {MetaData, RowSchema} from "@/plugins/scatter";
import {API} from "@/plugins/api";
import AnnotatedDocItem from "@/components/AnnotatedDocItem.vue";
import type {AnnotatedDocument} from "@/plugins/api/api-backend";
import {useRouteQuery} from "@vueuse/router";
import type {CancelablePromise} from "@/plugins/api/core/CancelablePromise";
import Filters from "@/plugins/scatter/filters";

const loadingPoints = ref<boolean>(false);
const loadingDocument = ref<boolean>(false);
const loadedPoints = ref<number>(0);
const totalPoints = ref<number>(0);
const metadata = ref<MetaData | undefined>(undefined);
const highlight = ref<RowSchema | undefined>(undefined);
const highlightDocument = ref<AnnotatedDocument | undefined>(undefined);
const neighbourDocuments = ref<Array<AnnotatedDocument> | undefined>(undefined);

const queryDataset = useRouteQuery('dataset', 'test1');
const querySecret = useRouteQuery('secret', undefined);

let histContainer: d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;
let histYrContainer: d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;

let documentRequest: CancelablePromise<AnnotatedDocument> | undefined;
let neighbourRequests: Array<CancelablePromise<AnnotatedDocument>> | undefined;

const onSchemaReceived = (numTotalRows: number) => {
  totalPoints.value = numTotalRows;
  metadata.value = plot.metadata;
}

const onBatchReceived = (currentBatchSize: number, currentNumLoadedRows: number, numTotalRows: number) => {
  loadedPoints.value = currentNumLoadedRows;
}

const filters = Filters();

function updateOpacity(d: RowSchema) {
  d.opacity = filters.isHidden(d) ? 0.3 : 1.0;
}

function initLabelBarchart(data: Array<RowSchema>) {

  // const counts = d3.group(data, d => d.label_0);
  const counts = d3.rollup(data, v => v.length, d => d.label_0);

  const category = d3.scaleOrdinal<number, string, never>()
      .range(plot.metadata!.schemes[0].choices)
      .domain(plot.metadata!.schemes[0].choices.map((v, i) => i));
  const categoryInverse = d3.scaleOrdinal<string, number, never>()
      .domain(plot.metadata!.schemes[0].choices)
      .range(plot.metadata!.schemes[0].choices.map((v, i) => i));

  const plotData = new Map();
  for (const [key, value] of counts.entries()) {
    plotData.set(category(key), value)
  }

  Barchart(histContainer, plotData,
      (cat) => {
        // pass
      },
      (cat) => {
        // pass
      },
      (cat) => {
        filters.hideCategory(categoryInverse(cat));
        plot.data.forEach(updateOpacity);
        plot.redraw();
      },
      (cat) => {
        filters.unHideCategory(categoryInverse(cat));
        plot.data.forEach(updateOpacity);
        plot.redraw();
      }, 500, 400,
      // @ts-ignore
      (x) => cat20[categoryInverse(x)],
      {top: 0, right: 0, bottom: 135, left: 110},
  )
}


function initYearBarchart(data: Array<RowSchema>) {

  // const counts = d3.group(data, d => d.label_0);
  const counts = d3.rollup(data, v => v.length, d => d.year);

  const plotData = new Map([...counts.entries()].sort());

  Barchart(histYrContainer, plotData,
      () => {
        // pass
      },
      () => {
        // pass
      },
      (yr: string) => {
        filters.hideYear(parseInt(yr));
        plot.data.forEach(updateOpacity);
        plot.redraw();
      },
      (yr:string) => {
        filters.unHideYear(parseInt(yr));
        plot.data.forEach(updateOpacity);
        plot.redraw();
      }, 500, 400,
      // @ts-ignore
      (x) => [0,0,0,1],
      {top: 0, right: 0, bottom: 135, left: 110},
  )
}

const onDataComplete = (data: Array<RowSchema>) => {
  initLabelBarchart(data);
  initYearBarchart(data);

};

const onHover = (d: RowSchema, neighbours: Array<RowSchema>) => {
  highlight.value = d;
  loadingDocument.value = true;
  cancelAllRequests()

  documentRequest = API.data.getInfoApiDataDatasetInfoDocIdGet({
    dataset: queryDataset.value,
    secret: querySecret.value,
    docId: d.dbid,
  });
  documentRequest.then((result) => {
    highlightDocument.value = result.data;
    fetchNeighbours();
  })
      .catch((reason) => {
        // console.error(reason);
      })
      .finally(() => {
        loadingDocument.value = false;
        documentRequest = undefined;
      })

  function fetchNeighbours() {
    neighbours.forEach((neighbour) => {
      API.data.getInfoApiDataDatasetInfoDocIdGet({
        dataset: queryDataset.value,
        secret: querySecret.value,
        docId: neighbour.dbid,
      })
          .then((result) => {
            if (neighbourDocuments.value === undefined) {
              neighbourDocuments.value = [result.data]
            } else {
              neighbourDocuments.value.push(result.data);
            }
          })
    });
  }
}

function cancelAllRequests() {
  if (documentRequest) {
    try {
      documentRequest.cancel();
      documentRequest = undefined;
    } catch (TypeError) {
      // pass
    }
  }
  if (neighbourRequests) {
    neighbourRequests.forEach(req => {
      try {
        req.cancel()
      } catch (TypeError) {
        // pass
      }
    });
    neighbourRequests = undefined;
  }
}

const unHover = () => {
  highlight.value = undefined;
  // highlightDocument.value = undefined;
  cancelAllRequests();
}


let plot: ScatterPlot;
onMounted(async () => {
  histContainer = d3.select('#histContainer') as unknown as d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;
  histYrContainer = d3.select('#histYrContainer') as unknown as d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;
  const canvasContainer = d3.select('#chart') as unknown as d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;
  const canvasContainerNode = canvasContainer.node();
  loadingPoints.value = true;
  if (canvasContainerNode) {
    `${import.meta.env.VITE_LANDSCAPE_API}`
    plot = new ScatterPlot(`${import.meta.env.VITE_LANDSCAPE_API}/tiles/${queryDataset.value}/data.arrows`,//'http://127.0.0.1:8082/tiles/test1/data.arrows',
        canvasContainerNode,
        onSchemaReceived,
        onBatchReceived,
        onDataComplete,
        onHover,
        unHover,
    );

    plot.load().then(() => {
      loadingPoints.value = false;
    });
  }
});
</script>

<template>
  <div class="d-flex flex-row p-0">
    <div class="col-5 me-2">
      <div id="chart" class="h-100 w-100" style="background-color: antiquewhite"/>
    </div>
    <div class="flex-fill overflow-auto p-4" style="max-height: calc(100vh - 50px);">
      <div class="row">
        <div class="col">
          <div class="mt-4">
            <div id="histContainer"></div>
          </div>
          <div class="mt-4">
            <div id="histYrContainer"></div>
          </div>
        </div>
        <div class="col-lg-6 col-12 docscroll p-0 m-0">
          <div class="text-end">
            Number of documents:
            <template v-if="loadingPoints">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              {{ loadedPoints }} / {{ totalPoints }}
            </template>
            <template v-else>
              {{ totalPoints }}
            </template>
          </div>
          <div v-if="highlightDocument||loadingDocument">
            <AnnotatedDocItem :doc="highlightDocument" :is-loading="loadingDocument"/>

            <template v-if="neighbourDocuments">
              <hr/>
              <h5 class="ps-2">Similar documents</h5>
              <AnnotatedDocItem v-for="doc in neighbourDocuments" :key="doc.doc_id" :doc="doc" :is-loading="false"/>
            </template>

          </div>
          <div v-else>
            Hover a point or use box-selection tool to see the associated document(s).
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
dt {
  float: left;
  clear: left;
  width: 90px;
  font-weight: bold;
  color: rgb(128, 19, 0);
}

dt::after {
  content: ":";
}

dd {
  margin: 0 0 0 80px;
  padding: 0 0 0.5em 0;
  width: 180px;
}

#chart g.tick > text {
  display: none;
}

#histContainer rect.hover {
  stroke-width: 1;
  stroke: black;
}

#histContainer rect.hidden {
  /*stroke-width: 2;
  stroke: red;*/
  stroke-width: 1;
  stroke: darkslategrey;
  stroke-dasharray: 5;
  fill-opacity: 0.5;
}

@media (min-width: 992px) {
  .docscroll {
    height: calc(100vh - 100px);
    overflow-y: auto;
  }
}

.selectBox {
  border: 1px solid #55aaff;
  background-color: rgba(75, 160, 255, 0.3);
  position: fixed;
}
</style>