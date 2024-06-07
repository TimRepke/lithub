<script setup lang="ts">
import { onMounted, ref } from "vue";
import { datasetStore } from "@/stores";

import { type Dataset, useResults } from "@/util/dataset";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import DocumentCard from "@/components/DocumentCard.vue";
import PaginationNav from "@/components/PaginationNav.vue";

import InclusiveIcon from "@/components/InclusiveIcon.vue";

import SidebarLabelFilter from "@/components/SidebarLabelFilter.vue";
import SidebarSearchFilter from "@/components/SidebarSearchFilter.vue";

import HeatMap from "@/components/HeatMap.vue";
import ScatterLandscape from "@/components/ScatterLandscape.vue";
import FluidContainerGrid from "@/components/FluidContainerGrid.vue";
import FluidContainer from "@/components/FluidContainer.vue";
import ReportingModal from "@/components/ReportingModal.vue";
import type { AnnotatedDocument } from "@/util/types";
import HistogramFilter from "@/components/HistogramFilter.vue";

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
  labels: schemeLabels,
  groups: schemeGroups,
} = dataset;

const { scatter: scatterMask } = indexMasks.masks;
const { documents } = results;

const reportDoc = ref<AnnotatedDocument | null>(null);

function startPauseResultFetching(active: boolean) {
  results.paused.value = !active;
}

onMounted(() => {
  results.delayedUpdate();
});
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
          <HistogramFilter v-model:mask="pyMask" />
          <SidebarSearchFilter v-model:mask="searchMask" />
          <!-- <SidebarLabelFilter v-model:group-mask="labelMaskGroups['imp']" v-model:picked-colour="pickedColour" />-->
          <!-- <SidebarLabelFilter v-model:group-mask="labelMaskGroups['exp']" v-model:picked-colour="pickedColour" />-->
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups['outc']" v-model:picked-colour="pickedColour" />
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups['sect']" v-model:picked-colour="pickedColour" />
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups['meth']" v-model:picked-colour="pickedColour" />
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups['polname']" v-model:picked-colour="pickedColour" />
        </div>
      </FluidContainer>
    </template>

    <template #cont2>
      <FluidContainer title="Scatterplot" :initial-state="false">
        <ScatterLandscape
          v-model:mask="scatterMask"
          v-model:global-mask="globalMask"
          v-model:global-version="globalVersion"
          v-model:group-masks="labelMaskGroups"
          :arrow="arrow"
          v-model:keywords="keywords"
          v-model:picked-colour="pickedColour" />
      </FluidContainer>
    </template>

    <template #cont4>
      <FluidContainer title="Label correlation">
        <HeatMap
          class="flex-grow-1"
          v-model:global-mask="globalMask"
          v-model:group-masks="labelMaskGroups"
          :selectable-groups="Object.keys(labelMaskGroups)"
          :year-masks="pyMask"
          init-vert="polname"
          init-hori="outc" />
      </FluidContainer>
    </template>

    <template #cont5>
      <FluidContainer title="Results" @visibility-updated="startPauseResultFetching">
        <template v-if="documents.length > 0">
          <div class="results-column-results">
            <DocumentCard
              v-for="doc in documents"
              :key="doc.idx"
              :doc="doc"
              :scheme-labels="schemeLabels"
              @report="(doc) => (reportDoc = doc)" />
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
  <ReportingModal
    v-if="reportDoc"
    :doc="reportDoc"
    :scheme-labels="schemeLabels"
    :scheme-groups="schemeGroups"
    @close="reportDoc = null"
    :dataset="dataset.name" />
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
