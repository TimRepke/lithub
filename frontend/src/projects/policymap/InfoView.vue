<script setup lang="ts">
import * as d3 from "d3";
import { default as d3lasso } from "@/util/lasso.ts";
import { onMounted } from "vue";

onMounted(() => {
  const data = new Array(100).fill(null).map(() => [Math.random(), Math.random()]);
  const w = 960;
  const h = 500;
  const r = 3.5;

  const svg = d3.select("#tmp").append("svg").attr("width", w).attr("height", h);

  const circles = svg
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => d[0] * w)
    .attr("cy", (d) => d[1] * h)
    .attr("r", r);

  const lasso_start = function () {
    lasso
      .items()
      .attr("r", 3.5) // reset size
      .classed("not_possible", true)
      .classed("selected", false);
  };

  const lasso_draw = function () {
    // Style the possible dots
    lasso.possibleItems().classed("not_possible", false).classed("possible", true);

    // Style the not possible dot
    lasso.notPossibleItems().classed("not_possible", true).classed("possible", false);
  };

  const lasso_end = function () {
    // Reset the color of all dots
    lasso.items().classed("not_possible", false).classed("possible", false);

    // Style the selected dots
    lasso.selectedItems().classed("selected", true).attr("r", 7);

    // Reset the style of the not selected dots
    lasso.notSelectedItems().attr("r", 3.5);
  };

  const lasso = d3lasso()
    .closePathSelect(true)
    .closePathDistance(1000)
    .items(circles)
    .targetArea(svg)
    .on("start", lasso_start)
    .on("draw", lasso_draw)
    .on("end", lasso_end);

  svg.call(lasso);
});
</script>

<template>
  <div id="tmp"></div>
  <h3>Climate policy map</h3>
  <p class="fst-italic">
    <strong>Authors:</strong>
    Max Callaghan, Lucy Banisch, Niklas Doebbeling-Hildebrandt, Duncan Edmondson, Christian Flachsland, William Lamb,
    Sebastian Levi, Finn Müller-Hansen, Eduardo Posada, Shraddha Vasudevan, Jan Minx
  </p>
  <p>
    This interactive website accompanies the paper [1], which uses machine learning to identify and classify the
    literature on climate policy instruments. You can explore this literature in the map below, where each paper is
    represented by a dot, and papers which are linguistically similar are placed close together on the plot. Hovering
    over the map will show the titles of the papers.
  </p>
  <p>
    You can select papers by clicking and dragging on the map to zoom in on an area. Or you can choose a different type
    of selection method using the icons in the top left. Once you have selected documents, a sample of these will be
    shown in the box below. You will also have the opportunity to download the complete selection of documents,
    including the machine-learning generated labels.
  </p>
  <p class="text-muted">
    <a href="https://www.researchsquare.com/article/rs-3817176/v1" target="_blank">
      [1] https://www.researchsquare.com/article/rs-3817176/v1
    </a>
  </p>
</template>

<style scoped></style>
