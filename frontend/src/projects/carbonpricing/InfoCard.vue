<script setup lang="ts">
import route from "./route.ts";
import { default as InfoCardTemplate } from "@/components/InfoCard.vue";
import teaserFigure from "./assets/teaser.jpg";
</script>

<template>
  <InfoCardTemplate
    title="Carbon pricing map"
    :is-new="true"
    :route-name="route.children![0].name"
    :teaser-figure="teaserFigure"
  >
    Comprehensive map of carbon pricing evaluations by <i>Döbbeling-Hildebrandt et al, 2024</i>
  </InfoCardTemplate>
</template>

<style scoped></style>
