<script setup lang="ts">
import { ref, watch } from "vue";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import SidebarLabelFilter from "@/components/SidebarLabelFilter.vue";
import SidebarSearchFilter from "@/components/SidebarSearchFilter.vue";
import InclusiveIcon from "@/components/InclusiveIcon.vue";
import { useResults } from "@/util/dataset.ts";
import DocumentCard from "@/components/DocumentCard.vue";
import PaginationNav from "@/components/PaginationNav.vue";
import HistogramFilter from "@/components/HistogramFilter.vue";
import ScatterLandscape from "@/components/ScatterLandscape.vue";

const dataStore = useDatasetStore();
const results = useResults();

const {
  arrow,
  counts: globalCounts,
  inclusive,
  bitmask: globalMask,
  labelMaskGroups,
  pyMask,
  searchMask,
  indexMask
} = dataStore.dataset!;
const { documents } = results;

const pickedColour = ref("ins");
</script>

<template>
  <div class="explorer-container">
    <div class="filter-sidebar">
      <div class="column-head">Filters</div>
      <div class="filter-sidebar-container">
        <div class="filter-top">
          <div>
            Number of documents:
            {{ globalCounts.countFiltered.toLocaleString() }} /
            {{ globalCounts.countTotal.toLocaleString() }}
          </div>
          <InclusiveIcon v-model:inclusive="inclusive" class="ms-auto" />
        </div>
        <HistogramFilter v-model:mask="pyMask" />
        <SidebarLabelFilter v-model:group-mask="labelMaskGroups['ins']" v-model:picked-colour="pickedColour" />
        <SidebarLabelFilter v-model:group-mask="labelMaskGroups['gov']" v-model:picked-colour="pickedColour" />
        <SidebarLabelFilter v-model:group-mask="labelMaskGroups['sec']" v-model:picked-colour="pickedColour" />
        <SidebarSearchFilter v-model:mask="searchMask" />

        <!--        <ul>-->
        <!--          <template v-for="(mask, key) in labelMaskGroups" :key="key">-->
        <!--            <li v-for="(lmask, lkey) in mask.masks" :key="lkey">-->
        <!--              {{ key }}={{ lkey }}: {{ lmask.counts }} ({{ lmask.active }} / {{ lmask.version }})-->
        <!--            </li>-->
        <!--          </template>-->
        <!--        </ul>-->
      </div>
    </div>

    <div class="scatter-column">
      <div class="column-head">Scatterplot</div>
      <ScatterLandscape :arrow="arrow" v-model:global-mask="globalMask" v-model:mask="indexMask" />
    </div>

    <div class="results-column">
      <div class="column-head">Results</div>
      <div class="results-column-results">
        <DocumentCard v-for="doc in documents" :key="doc.idx" :doc="doc" class="m-2" />
      </div>
      <div class="results-column-pagination">
        <PaginationNav v-model:results="results" />
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

.scatter-column {
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
}
</style>
