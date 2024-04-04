<script setup lang="ts">
import { datasetStore } from "@/stores";
import SidebarLabelFilter from "@/components/SidebarLabelFilter.vue";
import SidebarSearchFilter from "@/components/SidebarSearchFilter.vue";
import InclusiveIcon from "@/components/InclusiveIcon.vue";
import { Dataset, useResults } from "@/util/dataset";
import DocumentCard from "@/components/DocumentCard.vue";
import PaginationNav from "@/components/PaginationNav.vue";
import HistogramFilter from "@/components/HistogramFilter.vue";
import ScatterLandscape from "@/components/ScatterLandscape.vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { ref } from "vue";
import GeoMap from "@/components/GeoMap.vue";
import ToggleIcon from "@/components/ToggleIcon.vue";
import ScatterIcon from "@/components/icons/ScatterIcon.vue";

type IndexKeys = "scatter" | "geo";
const dataset = datasetStore.dataset as Dataset<IndexKeys>;
const results = useResults(dataset);

const {
  arrow,
  counts: globalCounts,
  inclusive,
  bitmask: globalMask,
  labelMaskGroups,
  indexMasks,
  pyMask,
  searchMask,
  keywords,
  pickedColour,
} = dataset;

// indexMasks.registerMask("geo");
// indexMasks.masks.value.geo.selectIds([1, 2, 3]);

const { scatter: scatterMask, geo: geoMask } = indexMasks.masks;
const { documents } = results;
const labels = ref(["sec", "ins", "gov", "econ"]);

type MiddleColumns = "Scatterplot" | "World Map" | "Evidence Gaps";
const middleColumn = ref<MiddleColumns>("Scatterplot");
</script>

<template>
  <div class="explorer-container">
    <div class="filter-sidebar">
      <div class="column-head">Filters</div>
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
        <template v-for="label in labels" :key="label">
          <SidebarLabelFilter v-model:group-mask="labelMaskGroups[label]" v-model:picked-colour="pickedColour" />
        </template>
        <SidebarSearchFilter v-model:mask="searchMask" />
      </div>
    </div>

    <div class="middle-column">
      <div class="column-head d-flex flex-row">
        <div>{{ middleColumn }}</div>
        <div class="d-flex flex-row ms-auto p-1" style="height: 1em; font-size: 0.75em">
          <ToggleIcon name="mid-col-tab" v-model:model="middleColumn" value="Scatterplot">
            <template #iconTrue>
              <ScatterIcon />
            </template>
          </ToggleIcon>
          <ToggleIcon name="mid-col-tab" v-model:model="middleColumn" icon="earth-africa" value="World Map" />
          <ToggleIcon name="mid-col-tab" v-model:model="middleColumn" icon="chart-gantt" value="Evidence Gaps" />
        </div>
      </div>

      <template v-if="middleColumn === 'Scatterplot'">
        <ScatterLandscape
          v-model:mask="scatterMask"
          v-model:global-mask="globalMask"
          v-model:group-masks="labelMaskGroups"
          :arrow="arrow"
          v-model:keywords="keywords"
          v-model:picked-colour="pickedColour"
        />
      </template>

      <template v-if="middleColumn === 'World Map'">
        <GeoMap class="flex-grow-1" v-model:mask="geoMask" v-model:global-mask="globalMask" />
      </template>

      <template v-if="middleColumn === 'Evidence Gaps'">Coming soon.</template>
    </div>

    <div class="results-column">
      <div class="column-head">Results</div>
      <template v-if="documents.length > 0">
        <div class="results-column-results">
          <DocumentCard v-for="doc in documents" :key="doc.idx" :doc="doc" class="m-2" />
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.explorer-container {
  display: grid;
  grid-template-areas: "col1 col2 col3";
  /*grid-template-columns: 1fr 1fr 20fr;*/
  grid-template-columns: minmax(150px, auto) minmax(150px, auto) minmax(150px, 1fr);
  gap: 0.25rem;

  flex-grow: 1;

  & > div {
    overflow-x: hidden;
    overflow-y: auto;

    border: {
      left: 1px solid var(--socdr-grey);
      right: 1px solid var(--socdr-grey);
    }
  }
}

.column-head {
  background-color: var(--socdr-grey);
  font-variant-caps: small-caps;
  font-weight: bold;
  padding-left: 0.25rem;
}

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
