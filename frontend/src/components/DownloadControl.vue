<script setup lang="ts">
import { ref } from "vue";
import { datasetStore } from "@/stores";
import { RequestWithProgress } from "@/util/api.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

const downloadSecondary = ref(false);
const downloadProgress = ref<number | null>(null);

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
    params: { dataset: datasetStore.dataset?.info.key as string },
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
</template>

<style scoped></style>
