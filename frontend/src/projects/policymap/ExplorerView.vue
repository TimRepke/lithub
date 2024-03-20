<script setup lang="ts">
import { ref } from "vue";
import { useDatasetStore } from "@/stores/datasetstore.ts";
import SidebarLabelFilter from "@/components/SidebarLabelFilter.vue";
import SidebarSearchFilter from "@/components/SidebarSearchFilter.vue";
import InclusiveIcon from "@/components/InclusiveIcon.vue";
import { useResults } from "@/util/dataset.ts";
import DocumentCard from "@/components/DocumentCard.vue";
import PaginationNav from "@/components/PaginationNav.vue";

const dataStore = useDatasetStore();
console.log(dataStore.dataset);
const documents = ref(useResults());

const pickedColour = ref("ins");

// props.dataset.labelMaskGroups["reg"].toggleActive();
// props.dataset.labelMaskGroups["edu"].toggleActive();
// props.dataset.labelMaskGroups["gov"].toggleActive();
//
// setTimeout(() => props.dataset.labelMaskGroups["sec"].setActive(true), 1000);
// setTimeout(() => props.dataset.labelMaskGroups["sec"].masks[0].toggleActive(), 2000);
// setTimeout(() => props.dataset.labelMaskGroups["sec"].masks[1].toggleActive(), 3000);
// setTimeout(() => props.dataset.labelMaskGroups["sec"].masks[0].toggleActive(), 4000);
// setTimeout(() => props.dataset.labelMaskGroups["sec"].masks[1].toggleActive(), 5000);

// props.dataset.labelMaskGroups['gov'].active.value = true;
// props.dataset.labelMaskGroups['gov'].active.value = false;
// props.dataset.labelMaskGroups["sec"].setActive(true)
// props.dataset.labelMaskGroups["gov"].toggleActive()
// props.dataset.labelMaskGroups["sec"].toggleActive()
// props.dataset.labelMaskGroups["sec"].active.value=true;
// props.dataset.labelMaskGroups["sec"].active.value=false;
</script>

<template>
  <div class="explorer-container">
    <div class="filter-sidebar">
      <div class="column-head">
        Filters
      </div>
      <div class="filter-sidebar-container">
        <div class="filter-top">
          <div>
            Number of documents: {{ dataStore.dataset!.counts.countFiltered.toLocaleString() }} /
            {{ dataStore.dataset!.counts.countTotal.toLocaleString() }}
          </div>
          <InclusiveIcon v-model:inclusive="dataStore.dataset!.inclusive" class="ms-auto" />
        </div>

        <SidebarLabelFilter mask-key="ins" v-model:picked-colour="pickedColour" />
        <SidebarLabelFilter mask-key="gov" v-model:picked-colour="pickedColour" />
        <SidebarLabelFilter mask-key="sec" v-model:picked-colour="pickedColour" />
        <SidebarSearchFilter />

        <ul>
          <template v-for="(mask, key) in dataStore.dataset!.labelMaskGroups" :key="key">
            <li v-for="(lmask, lkey) in mask.masks" :key="lkey">
              {{ key }}={{ lkey }}: {{ lmask.counts }} ({{ lmask.active }} / {{ lmask.version }})
            </li>
          </template>
        </ul>
      </div>
    </div>

    <div class="scatter-column">
      <div class="column-head">
        Scatterplot
      </div>
    </div>

    <div class="results-column">
      <div class="column-head">
        Results
      </div>
      <div class="results-column-results">
        <DocumentCard v-for="doc in documents.documents" :key="doc.idx" :doc="doc" class="m-2" />
      </div>
      <div class="results-column-pagination">
        <PaginationNav :results="documents" />
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
