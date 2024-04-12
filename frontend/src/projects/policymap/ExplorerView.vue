<script setup lang="ts">
import { ref } from "vue";
import { datasetStore } from "@/stores";

import { Dataset, useResults } from "@/util/dataset";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import DocumentCard from "@/components/DocumentCard.vue";
import PaginationNav from "@/components/PaginationNav.vue";

import InclusiveIcon from "@/components/InclusiveIcon.vue";

import SidebarLabelFilter from "@/components/SidebarLabelFilter.vue";
import SidebarSearchFilter from "@/components/SidebarSearchFilter.vue";

import GeoMap from "@/components/GeoMap.vue";
import HeatMap from "@/components/HeatMap.vue";
import ScatterLandscape from "@/components/ScatterLandscape.vue";
import { DATA_BASE } from "@/util/api.ts";
import FluidContainerGrid from "@/components/FluidContainerGrid.vue";
import FluidContainer from "@/components/FluidContainer.vue";

type IndexKeys = "scatter" | "geo";
const dataset = datasetStore.dataset as Dataset<IndexKeys>;
const results = useResults(dataset);

const {
  arrow,
  counts: globalCounts,
  inclusive,
  bitmask: globalMask,
  version: globalVersion,
  labelMaskGroups,
  indexMasks,
  pyMask,
  searchMask,
  keywords,
  pickedColour,
  scheme,
  info,
} = dataset;

const { scatter: scatterMask, geo: geoMask } = indexMasks.masks;
const { documents } = results;
const labels = ref(["sec", "ins", "gov", "econ"]);

function startPauseResultFetching(active: boolean) {
  results.paused.value = !active;
}
</script>

<template>
  <FluidContainerGrid>
    <template #cont1>
      <FluidContainer title="Filters" style="">
        <div class="filter-top">
          <div>
            Number of documents:
            {{ globalCounts.countFiltered.toLocaleString() }} /
            {{ globalCounts.countTotal.toLocaleString() }}
          </div>
          <InclusiveIcon v-model:inclusive="inclusive" class="ms-auto" />
        </div>

        <div class="filter-sidebar-container">
          <!--          <HistogramFilter v-model:mask="pyMask" />-->
          <template v-for="label in labels" :key="label">
            <SidebarLabelFilter v-model:group-mask="labelMaskGroups[label]" v-model:picked-colour="pickedColour" />
          </template>
          <SidebarSearchFilter v-model:mask="searchMask" />
        </div>
      </FluidContainer>
    </template>

    <template #cont2>
      <FluidContainer title="Scatterplot">
        <ScatterLandscape
          v-model:mask="scatterMask"
          v-model:global-mask="globalMask"
          v-model:global-version="globalVersion"
          v-model:group-masks="labelMaskGroups"
          :arrow="arrow"
          v-model:keywords="keywords"
          v-model:picked-colour="pickedColour"
        />
      </FluidContainer>
    </template>

    <template #cont3>
      <FluidContainer title="Geographic map">
        <GeoMap
          class="flex-grow-1"
          v-model:mask="geoMask"
          v-model:global-mask="globalMask"
          :slim-url="`${DATA_BASE}/policymap/${info.slim_geo_filename}`"
          :full-url="`${DATA_BASE}/policymap/${info.full_geo_filename}`"
        />
      </FluidContainer>
    </template>
    <template #cont4>
      <FluidContainer title="Label correlation" :initial-state="false">
        <HeatMap
          class="flex-grow-1"
          v-model:global-mask="globalMask"
          v-model:group-masks="labelMaskGroups"
          :scheme="scheme"
          :year-masks="pyMask"
        />
      </FluidContainer>
    </template>
    <template #cont5>
      <FluidContainer title="Results" :initial-state="false" @visibility-updated="startPauseResultFetching">
        <template v-if="documents.length > 0">
          <div class="results-column-results">
            <DocumentCard v-for="doc in documents" :key="doc.idx" :doc="doc" class="m-2" :scheme="scheme" />
          </div>
          <div class="results-column-pagination">
            <PaginationNav v-model:results="results" />
          </div>
        </template>
        <div v-else>
          <div class="m-2 d-flex flex-row">
            <div class="d-flex align-items-center me-2 fs-2">
              <font-awesome-icon icon="file-lines" class="text-muted" />
            </div>
            <div>
              No results, yet. <br />
              Start applying filters to discover relevant documents.
            </div>
          </div>
        </div>
      </FluidContainer>
    </template>
  </FluidContainerGrid>
</template>

<style scoped lang="scss">
.filter-sidebar {
  grid-area: col1;
  resize: horizontal;
  min-width: 150px;
  max-width: 50vw;
  width: 20vw;

  display: flex;
  flex-direction: column !important;

  .filter:first-child {
    border-top: 0;
  }

  &-container {
    display: flex;
    flex-direction: column !important;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1 1 auto;
    height: 0;
    font-size: 0.85em;
  }

  &.closed {
    .column-head {
      transform: rotate(-90deg);
      transform-origin: 100% 100%;
    }
  }
}

.middle-column {
  grid-area: col2;
  resize: horizontal;
  min-width: 150px;
  max-width: 80vw;
  border-right: 1px solid var(--socdr-grey);
  width: 35vw;
  display: flex;
  flex-direction: column;
}

.results-column {
  grid-area: col3;
  min-width: 150px;
  max-width: 80vw;

  display: flex;
  flex-direction: column !important;

  &-results {
    display: flex;
    flex-direction: column !important;
    overflow-x: hidden;
    overflow-y: auto;
    flex: 1 1 auto;
    height: 0;
    font-size: 0.85em;
  }

  &-pagination {
    display: flex;
    flex-direction: row;
    /*height: 1.5rem;*/
    justify-content: center;
    padding: 0.25em 2ch;
  }
}

.filter-top {
  display: flex;
  flex-direction: row;
  padding: 0.5em 1ch 0 1ch;
  border-bottom: 1px solid var(--socdr-grey);
}
</style>
