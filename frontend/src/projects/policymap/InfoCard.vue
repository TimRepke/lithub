<script setup lang="ts">
import route from "./route.ts";
import { default as InfoCardTemplate } from "@/components/InfoCard.vue";
import teaserFigure from "./assets/teaser.jpg";
</script>

<template>
  <InfoCardTemplate
    title=" Climate Policy Instruments"
    :route-name="route.children![0].name"
    :teaser-figure="teaserFigure"
  >
    Literature on climate policy instruments based on paper by <i>Callaghan et al, 2024</i>
  </InfoCardTemplate>
</template>

<style scoped></style>
