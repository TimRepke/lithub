<script setup lang="ts">
import route from "./route.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { onMounted } from "vue";
import { GET } from "@/util/api.ts";
import { DatasetInfo } from "@/util/types";
import { useDatasetStore } from "@/stores/datasetstore.ts";

const dataStore = useDatasetStore();

onMounted(async () => {
  const info = await GET<DatasetInfo>({ path: "/basic/info/policymap" });
  await dataStore.load(info);
});
</script>

<template>
  <div class="d-flex flex-row">
    <h1>Climate policy instruments</h1>
    <ul class="nav nav-underline ms-auto me-4">
      <li class="nav-item">
        <router-link :to="{ name: route.children![0].name }" class="nav-link" exact-active-class="active">
          <font-awesome-icon :icon="['far', 'map']" />
          Explorer
        </router-link>
      </li>
      <li class="nav-item">
        <router-link :to="{ name: route.children![1].name }" class="nav-link" exact-active-class="active">
          <font-awesome-icon icon="info-circle" />
          Info
        </router-link>
      </li>
    </ul>
  </div>

  <div v-if="!dataStore.isLoaded" id="loading">
    <div class="card p-4">
      <h4>Loading data & initialising...</h4>
      <div class="d-flex flex-row gap-3">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div>
          {{ dataStore.loadingProgress?.progressCols }} filters loaded<br />
          {{ ((dataStore.loadingProgress?.progressArrow ?? 0) / 1024 / 1024).toLocaleString() }}MB loaded
        </div>
      </div>
    </div>
  </div>
  <template v-else>
    <router-view></router-view>
  </template>
</template>

<style scoped>
#loading {
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
