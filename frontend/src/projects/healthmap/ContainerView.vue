<script setup lang="ts">
import route from "./route.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

import { onMounted, ref } from "vue";
import { GET } from "@/util/api.ts";
import { DatasetInfo } from "@/util/types";
import { datasetStore } from "@/stores";

const isReady = ref(false);
onMounted(async () => {
  const info = await GET<DatasetInfo>({ path: "/basic/info", params: { dataset: "healthmap" } });
  await datasetStore.load(info);
  isReady.value = true;
});
</script>

<template>
  <div class="d-flex flex-row" id="pfhead">
    <!--    <h2 class="m-0 ms-1 mt-1">Climate policy instruments</h2>-->
    <!--  ms-auto -->
    <ul class="nav nav-underline me-4 ms-2">
      <li class="nav-item">
        <router-link :to="{ name: route.children![0].name }" class="nav-link" exact-active-class="active" style="margin-top: 1em">
          <font-awesome-icon :icon="['far', 'map']" />
          Explorer
        </router-link>
      </li>
      <li class="nav-item">
        <router-link :to="{ name: route.children![1].name }" class="nav-link" exact-active-class="active" style="margin-top: 1em">
          <font-awesome-icon icon="info-circle" />
          Info
        </router-link>
      </li>
    </ul>
    <div class="ms-auto m-2" >
        <a href="https://climatehealthevidence.org/" target="_blank" class="me-2"
          ><img src="./assets/pathfinder.svg" alt="Part of the Pathfinder Initiative" style="height: 3rem"
        /></a>
        <a href="https://wellcome.org" class="me-1"><img src="./assets/wellcome.svg" alt="Funded by the WellcomeTrust" style="height: 3em;" /></a>
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
<style></style>
<style scoped lang="scss">
#pfhead {
  background-image: url("@/projects/healthmap/assets/pfgeader.jpg");
  background-position: center;
}
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
