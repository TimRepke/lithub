<script setup lang="ts">
import route from "./route.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { onMounted, ref } from "vue";
import { GET, RequestWithProgress } from "@/util/api.ts";
import { DatasetInfo } from "@/util/types";
import { datasetStore } from "@/stores";

const isReady = ref(false);
const downloadSecondary = ref(false);
const downloadProgress = ref<number | null>(null);
onMounted(async () => {
  const info = await GET<DatasetInfo>({ path: "/basic/info", params: { dataset: "cdrmap" } });
  await datasetStore.load(info);
  isReady.value = true;
});

async function downloadAll() {
  await download();
}

async function downloadSelection() {
  if (datasetStore.dataset) {
    const { hasActiveMask, bitmask } = datasetStore.dataset;
    const mask = hasActiveMask() ? bitmask.value?.toBase64() : undefined;
    await download(mask);
  }
}

async function download(mask?: string) {
  downloadProgress.value = 0;
  const rslt = await RequestWithProgress({
    method: "POST",
    path: "/basic/download",
    params: { dataset: "cdrmap" },
    payload: mask ? { bitmask: mask } : undefined,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
    progressCallback: (loaded) => {
      downloadProgress.value = loaded;
    },
  });

  const blob = new Blob([await rslt.blob()], { type: "application/csv" });
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = "export.csv";
  link.click();

  downloadSecondary.value = false;
  downloadProgress.value = null;
}
</script>

<template>
  <div class="d-flex flex-row small">
    <!--    <h2 class="m-0 ms-1 mt-1">Climate policy instruments</h2>-->
    <!--  ms-auto -->
    <ul class="nav nav-underline me-4 ms-1">
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

    <div class="ms-auto">
      <button class="btn btn-sm text-muted" @click="downloadSecondary = !downloadSecondary">
        <font-awesome-icon icon="download" />
        Download
      </button>
      <template v-if="downloadProgress !== null">
        Preparing download... ({{ (downloadProgress / 1024 / 1024).toFixed(2) }}MB loaded)
      </template>
      <template v-if="downloadSecondary">
        <button class="btn btn-sm" @click="downloadAll">all</button>
        <button class="btn btn-sm" @click="downloadSelection">selected</button>
      </template>
    </div>
  </div>

  <div v-if="!datasetStore.isLoaded || !datasetStore.dataset || !isReady" id="loading">
    <div class="card p-4">
      <h4>Loading data & initialising...</h4>
      <div class="d-flex flex-row gap-3">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div v-if="datasetStore">
          {{ datasetStore.loadingProgress?.progressCols }} filters loaded<br />
          {{ ((datasetStore.loadingProgress?.progressArrow ?? 0) / 1024 / 1024).toLocaleString() }}MB loaded
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

.nav-link {
  padding-top: 0.25em;
  padding-bottom: 0.25em;
}
</style>
