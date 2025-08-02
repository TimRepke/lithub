<script setup lang="ts"></script>

<template>
  <div class="m-4">
    <h1>About the literature hub</h1>
    <p>
      The literature hub was developed by Tim Repke at
      <a href="https://mcc-berlin.net" target="_blank">MCC Berlin</a> and is now continued at
      <a href="https://pik-potsdam.de" target="_blank">PIK Potsdam</a>.
    </p>

    <div class="card border-dark mb-3 w-50">
      <div class="card-header">Citation</div>
      <div class="card-body">
        <h5 class="card-title">Cite as</h5>
        <div class="card-text">
          Tim Repke. 2025.
          <a href="https://aclanthology.org/2025.climatenlp-1.18/"
            >Interactive platform for the exploration of large-scale ‘living’ systematic maps</a
          >. In
          <i>Proceedings of the 2nd Workshop on Natural Language Processing Meets Climate Change (ClimateNLP 2025)</i>,
          pages 260–265, Vienna, Austria. Association for Computational Linguistics.
        </div>
      </div>
    </div>
    <p>
      This project is fully open source and is hosted at:
      <a href="https://gitlab.pik-potsdam.de/mcc-apsis/living-evidence-maps/literature-hub" target="_blank">
        PIK GitLab
      </a>
    </p>
    <p>
      Some honourable mentions about libraries used in this interface:
      <a href="https://github.com/flekschas/regl-scatterplot" target="_blank">regl-scatterplot</a>,
      <a href="https://d3js.org/" target="_blank">D3.js</a>, <a href="https://vuejs.org/" target="_blank">Vue.js</a>.
    </p>
  </div>
</template>

<style scoped></style>
