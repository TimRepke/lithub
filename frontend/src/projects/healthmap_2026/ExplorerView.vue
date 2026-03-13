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

import GeoMap from "@/components/GeoMap.vue";
import HeatMap from "@/components/HeatMap.vue";
import ScatterLandscape from "@/components/ScatterLandscape.vue";
import { DATA_BASE } from "@/util/api.ts";
import FluidContainerGrid from "@/components/FluidContainerGrid.vue";
import FluidContainer from "@/components/FluidContainer.vue";
import ReportingModal from "@/components/ReportingModal.vue";
import type { AnnotatedDocument } from "@/util/types";
import HistogramFilter from "@/components/HistogramFilter.vue";
import DownloadControl from "@/components/DownloadControl.vue";
import SidebarLabelFilterGroup from "@/components/SidebarLabelFilterGroup.vue";
import { LabelMaskGroup } from "@/util/dataset/masks/labels.ts";
// import SunburstDiagram from "@/components/SunburstDiagram.vue";

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
  info,
} = dataset;

const { scatter: scatterMask, geo: geoMask } = indexMasks.masks;
const { documents } = results;

// console.log(constructTopicTree('t3'));
const reportDoc = ref<AnnotatedDocument | null>(null);

function startPauseResultFetching(active: boolean) {
  results.paused.value = !active;
}
const labelGroups = ref<Record<string, Array<LabelMaskGroup>>>({
  location: [
    labelMaskGroups["Location_Group (Lancet 2026)"],
    labelMaskGroups["Location_Region (WorldBank 2026)"],
    labelMaskGroups["Location_Group (WHO 2026)"],
    labelMaskGroups["Location_Group (HDI 2026)"],
    labelMaskGroups["Location_Income group (WorldBank 2026)"],
    labelMaskGroups["Location_Lending category (WorldBank 2026)"],
    labelMaskGroups["Location_Continent (Name)"],
  ],
  affiliation: [
    labelMaskGroups["Affiliation_Group (Lancet 2026)"],
    labelMaskGroups["Affiliation_Region (WorldBank 2026)"],
    labelMaskGroups["Affiliation_Group (WHO 2026)"],
    labelMaskGroups["Affiliation_Group (HDI 2026)"],
    labelMaskGroups["Affiliation_Income group (WorldBank 2026)"],
    labelMaskGroups["Affiliation_Lending category (WorldBank 2026)"],
    labelMaskGroups["Affiliation_Continent (Name)"],
  ],
});

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

            <span v-if="globalCounts.countFiltered !== globalCounts.countTotal" class="text-muted">
              ({{ Math.round((globalCounts.countFiltered / globalCounts.countTotal) * 100) }}%)
            </span>
          </div>
          <div class="text-muted fst-italic ms-auto">Last updated: {{ info.last_update }}</div>
          <InclusiveIcon v-model:inclusive="inclusive" class="ms-3" />
        </div>

        <div class="filter-sidebar-container">
          <HistogramFilter v-model:mask="pyMask" />

          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.cat" v-model:picked-colour="pickedColour" />
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.keywords" v-model:picked-colour="pickedColour" />-->
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.attr" v-model:picked-colour="pickedColour" />-->
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.expose" v-model:picked-colour="pickedColour" />-->
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.event" v-model:picked-colour="pickedColour" />-->
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.driver" v-model:picked-colour="pickedColour" />-->
          <!--SidebarLabelFilter v-model:group-mask="labelMaskGroups.type" v-model:picked-colour="pickedColour" /-->
          <!--          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.rel_impacts" v-model:picked-colour="pickedColour" />-->

          <!-- Aggregated meta-topic -->
          <!--          <SidebarLabelFilter-->
          <!--            v-model:group-mask="labelMaskGroups['topic-agg-agg']"-->
          <!--            v-model:picked-colour="pickedColour" />-->
          <!-- Exposure -->
          <!--          <SidebarLabelFilter-->
          <!--            v-model:group-mask="labelMaskGroups['topic-agg-agg|0']"-->
          <!--            v-model:picked-colour="pickedColour" />-->
          <!-- Health impact -->
          <!--          <SidebarLabelFilter-->
          <!--            v-model:group-mask="labelMaskGroups['topic-agg-agg|1']"-->
          <!--            v-model:picked-colour="pickedColour" />-->

          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.health" v-model:picked-colour="pickedColour" />

          <!-- Intervention option -->
          <SidebarLabelFilter
            v-model:group-mask="labelMaskGroups['topic-agg-agg|2']"
            v-model:picked-colour="pickedColour" />

          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.sector" v-model:picked-colour="pickedColour" />
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups.driver" v-model:picked-colour="pickedColour" />

          <!-- Mediating pathways -->
          <SidebarLabelFilter
            v-model:group-mask="labelMaskGroups['topic-agg-agg|3']"
            v-model:picked-colour="pickedColour" />
          <!-- Methods -->
          <SidebarLabelFilter
            v-model:group-mask="labelMaskGroups['topic-agg-4|0']"
            v-model:picked-colour="pickedColour" />

          <SidebarLabelFilterGroup
            headline="Study location"
            v-model:group-masks="labelGroups.location"
            v-model:picked-colour="pickedColour" />
          <SidebarLabelFilterGroup
            headline="Author affiliation"
            v-model:group-masks="labelGroups.affiliation"
            v-model:picked-colour="pickedColour" />

          <SidebarSearchFilter v-model:mask="searchMask" />
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
          :max-keywords-in-view="30"
          v-model:keywords="keywords"
          v-model:picked-colour="pickedColour" />
      </FluidContainer>
    </template>

    <template #cont3>
      <FluidContainer title="Geographic map" :initial-state="false">
        <GeoMap
          class="flex-grow-1"
          v-model:mask="geoMask"
          v-model:global-mask="globalMask"
          :slim-url="`${DATA_BASE}/healthmap_2026/${info.slim_geo_filename}`"
          :full-url="`${DATA_BASE}/healthmap_2026/${info.full_geo_filename}`" />
      </FluidContainer>
    </template>
    <template #cont4>
      <FluidContainer title="Label correlation" :initial-state="true">
        <HeatMap
          class="flex-grow-1"
          v-model:global-mask="globalMask"
          v-model:group-masks="labelMaskGroups"
          :selectable-groups="[
            'cat',
            'health',
            'sector',
            'driver',
            'topic-agg-agg',
            'topic-agg-agg|2',
            'topic-agg-agg|3',
            'topic-agg-4|0',
            'Location_Group (Lancet 2026)',
            'Location_Region (WorldBank 2026)',
            'Location_Group (WHO 2026)',
            'Location_Group (HDI 2026)',
            'Location_Income group (WorldBank 2026)',
            'Location_Lending category (WorldBank 2026)',
            'Location_Continent (Name)',
            'Affiliation_Group (Lancet 2026)',
            'Affiliation_Region (WorldBank 2026)',
            'Affiliation_Group (WHO 2026)',
            'Affiliation_Group (HDI 2026)',
            'Affiliation_Income group (WorldBank 2026)',
            'Affiliation_Lending category (WorldBank 2026)',
            'Affiliation_Continent (Name)',
          ]"
          :year-masks="pyMask"
          init-hori="cat"
          init-vert="topic-agg-agg" />
      </FluidContainer>
    </template>

    <template #cont5>
      <FluidContainer title="Results" @visibility-updated="startPauseResultFetching">
        <DownloadControl class="me-auto" />
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
