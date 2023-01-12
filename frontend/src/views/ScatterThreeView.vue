<script setup lang="ts">
import * as d3 from 'd3';
import {onMounted} from "vue";

import {ScatterPlot} from "@/plugins/scatter";


onMounted(async () => {
  const canvasContainer = d3.select('#chart') as unknown as d3.Selection<HTMLDivElement, never, HTMLDivElement, never>;
  const canvasContainerNode = canvasContainer.node();

  if (canvasContainerNode) {
    const plot = new ScatterPlot('http://127.0.0.1:8082/tiles/test1/data.arrows',
        canvasContainerNode,
        null,
        null,
    );
    await plot.render2();

    // const handleResize = () => {
    //   const [height, width] = [700, (canvasContainerNode.parentElement?.clientWidth || 1000) - 30];
    //   plt.handleCanvasResize(height, width);
    // }
    // window.addEventListener('resize', handleResize, false);
    // handleResize();

    // d3.select(plt.canvas)
    //     .transition()
    //     .duration(750)
    //     // .call(plt.zoomHandler.transform, d3.zoomIdentity.translate(0, 1.25 * plt.height).scale(1));
    //     .call(plt.zoomHandler.transform, d3.zoomIdentity.translate(1, plt.height).scale(8));

  }
});

</script>

<template>
  <div class="row g-2">
    <div class="col-8">
      <div id="chart" style="height: 500px; width: 800px;background-color: black">
<!--        <d3fc-canvas use-device-pixel-ratio set-webgl-viewport style="height: 500px; width: 800px;"></d3fc-canvas>-->
      </div>
    </div>
    <div class="col-4">
      <div class="row">
        <div class="col">
          Number of points:  {{ loadedPoints }} / {{ totalPoints }}
        </div>
        <div class="col">
          blank
        </div>
      </div>
      <div class="row">
        <div class="col">
          <div>
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

.selectBox {
  border: 1px solid #55aaff;
  background-color: rgba(75, 160, 255, 0.3);
  position: fixed;
}
</style>