<script setup lang="ts">
import { default as PolicyInfoCard } from "@/projects/policymap/InfoCard.vue";
import { default as CarbonPricingInfoCard } from "@/projects/carbonpricing/InfoCard.vue";
</script>

<template>
  <div class="container mt-5">
    <h1>Literature Hub</h1>
    <p class="teaser">On this page, we share the data used in different research synthesis projects.</p>
    <h3>Explore datasets</h3>

    <div class="infocards">
      <div class="card">
        <PolicyInfoCard class="g-0" />
      </div>
      <div class="card">
        <CarbonPricingInfoCard class="row g-0" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.infocards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  grid-gap: 1rem;
}
</style>
