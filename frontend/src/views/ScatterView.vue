<script setup lang="ts">

import {onMounted, ref, watch} from "vue";
import * as d3 from "d3";
import type * as THREE from 'three';
import {Scatterplot} from "@/plugins/scatter/scatterplot";
import {cmap20} from "@/plugins/scatter/cmaps";
import {MaterialType} from "@/plugins/scatter/types";
import {API} from "@/plugins/api";
import {useRouteQuery} from "@vueuse/router";
import type {AnnotatedDocument} from "@/plugins/api/api-backend";
import AnnotatedDocItem from "@/components/AnnotatedDocItem.vue";

const queryDataset = useRouteQuery('dataset', 'test1');
const querySecret = useRouteQuery('secret', undefined);

const focus = ref(':-)');
const loading = ref<boolean>(false);
const document = ref<AnnotatedDocument | undefined>(undefined);

const scale = ref(.5);
const fogNear = ref(2000);
const fogFar = ref(2012);
const fogDensity = ref(0.0014);

let plt: Scatterplot;

watch(scale, (newS) => {
  if ('uniforms' in plt.tileManager.material) {
    plt.tileManager.material.uniforms.zoomFactor.value = newS;
    plt.redraw()
  }
})

watch(fogNear, (newFN) => {
  (plt.scene.fog as THREE.Fog).near = newFN;
  plt.redraw()
})
watch(fogFar, (newFF) => {
  (plt.scene.fog as THREE.Fog).far = newFF;
  plt.redraw()
})
watch(fogDensity, (newD) => {
  (plt.scene.fog as THREE.FogExp2).density = newD;
  plt.redraw()
})

function fetchDocumentInfo(key: string, ix: number) {
  const doc_id = plt.tileManager.tiles[key].tile?.get(ix)?.ix;
  if (doc_id !== undefined) {
    loading.value = true;
    API.data.getInfoApiDataDatasetInfoDocIdGet({
      dataset: queryDataset.value,
      secret: querySecret.value,
      docId: doc_id as unknown as number, // parseInt(doc_id.toString(10), 10),
    })
      .then((result) => {
        document.value = result.data;
        loading.value = false;
      })
      .catch((reason) => {
        console.error(reason);
        loading.value = false;
      })
  }
}

onMounted(async () => {
  const canvas = d3.select('#scatter>canvas') as unknown as d3.Selection<HTMLCanvasElement, never, HTMLDivElement, never>;
  const canvasNode = canvas.node();
  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  if (canvasNode) {
    plt = new Scatterplot({
      canvas: canvasNode,
      tileBaseUrl: 'http://127.0.0.1:8082/tiles/test1/tiles',
      mouseInCallback: (key, ix) => {
        focus.value = `${key} -> ${ix}`;
        timeout = setTimeout(() => fetchDocumentInfo(key, ix), 100);
        // title.value = plt.tileManager.tiles[key].tile.get(ix).title;
        // console.log('in', key, ix)
      },
      mouseOutCallback: () => {
        focus.value = '--';
        clearTimeout(timeout);
        // console.log('out', key, ix)
      },
      colorField: 'label_0',
      pointMaterial: MaterialType.SHADER,
      pointColorHover: 0x00FF00,
      pointSizeHover: 10,
      pointSizeBuffer: 3,
      textureSize: 33,
      raycasterThreshold: 0.1,
      colorScheme: cmap20,
    });
    // window.plt = plt;
    plt.redraw();

    // setTimeout(() => {
    //   plt.renderer.compile(plt.scene, plt.camera);
    //   const c = plt.renderer.getContext()
    //   console.log(c.getShaderSource(plt.renderer.info.programs[0].fragmentShader))
    //   console.log(c.getShaderSource(plt.renderer.info.programs[0].vertexShader))
    // }, 2000)

    const handleResize = () => {
      const [height, width] = [700, (canvasNode.parentElement?.clientWidth || 1000) - 30];
      plt.handleCanvasResize(height, width);
    }
    window.addEventListener('resize', handleResize, false);
    handleResize();

    d3.select(plt.canvas)
      .transition()
      .duration(750)
      // .call(plt.zoomHandler.transform, d3.zoomIdentity.translate(0, 1.25 * plt.height).scale(1));
      .call(plt.zoomHandler.transform, d3.zoomIdentity.translate(1, plt.height).scale(8));

  }
});

</script>

<template>
  <div class="row g-2">
    <div id="scatter" class="col-8">
      <canvas width="10" height="10" style="background: #0f5132"></canvas>
    </div>
    <div class="col-4">
      <div class="row">
        <div class="col">
          <div v-if="document || loading">
            {{ focus }}
            <AnnotatedDocItem :doc="document" :is-loading="loading"/>
          </div>
          <div v-else>
            Hover a point or use box-selection tool to see the associated document(s).
          </div>
        </div>
      </div>
      <div class="row">
        <input type="range" min="0.01" max="10" step="0.01" v-model="scale"/> {{ scale }}
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

.selectBox {
  border: 1px solid #55aaff;
  background-color: rgba(75, 160, 255, 0.3);
  position: fixed;
}
</style>