<script setup lang="ts">
import {ref} from "vue";
import {API} from "@/plugins/api";
import {useRouteQuery} from "@vueuse/router";
import type {Dataset} from "@/plugins/api/api-backend";

const queryDataset = useRouteQuery('dataset', 'test1');

const dataset = ref<Dataset | undefined>(undefined);

API.datasets.getDatasetApiDatasetsDatasetGet({dataset: queryDataset.value})
  .then((result) => {
    dataset.value = result.data;
  })
</script>

<template>
  <div v-if="dataset">
    <h1>{{ dataset.info.name }}</h1>
    <p>{{ dataset.info.description }}</p>
  </div>
  <div v-else>
    Loading information...
  </div>
</template>
