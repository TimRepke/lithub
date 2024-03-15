<script setup lang="ts">
import {default as PolicyInfoCard} from "@/projects/policymap/InfoCard.vue";
import {default as CarbonPricingInfoCard} from "@/projects/carbonpricing/InfoCard.vue";

</script>

<template>
  <div class="container">
    <h1>Literature Hub</h1>
    <p class="teaser">
      On this page, we share the data used in different research synthesis projects.
    </p>
    <h3>Explore datasets</h3>

    <div class="row row-cols-1 row-cols-md-2 g-4">
      <div class="col">
        <div class="card">
          <PolicyInfoCard class="row g-0"/>
        </div>
      </div>
      <div class="col">
        <div class="card">
          <CarbonPricingInfoCard class="row g-0"/>
        </div>
      </div>
    </div>
  </div>


</template>

<style scoped>

</style>