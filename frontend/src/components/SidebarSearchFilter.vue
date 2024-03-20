<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useDatasetStore } from "@/stores/datasetstore.ts";

const uniq = crypto.randomUUID();
const pickedColour = defineModel("pickedColour");

const dataStore = useDatasetStore();
const mask = dataStore.dataset!.searchMask;
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>Full-text search</div>
      <div>
        <input type="radio" :id="`colour-fts-${uniq}`" value="fts" v-model="pickedColour" name="colour-picker" />
        <label :for="`colour-fts-${uniq}`" class="icon">
          <font-awesome-icon icon="palette" />
        </label>

        <input type="checkbox" :id="`active-fts-${uniq}`" v-model="mask.active" />
        <label :for="`active-fts-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </div>
    </div>
    <div class="d-flex flex-row mb-1">
      <div>{{ mask.counts.countFiltered.toLocaleString() }} / {{ mask.counts.countTotal.toLocaleString() }}</div>
      <div class="ms-auto">
        <span class="icon-toggle">
          <input type="checkbox" :id="`field-title-${uniq}`" value="title" v-model="mask.fields" />
          <label :for="`field-title-${uniq}`" class="icon">
            <font-awesome-icon icon="heading" />
          </label>
        </span>
        <span class="icon-toggle">
          <input type="checkbox" :id="`field-abs-${uniq}`" value="abstract" v-model="mask.fields" />
          <label :for="`field-abs-${uniq}`" class="icon">
            <font-awesome-icon icon="align-left" />
          </label>
        </span>
        <span class="icon-toggle">
          <input type="checkbox" :id="`field-author-${uniq}`" value="authors" v-model="mask.fields" />
          <label :for="`field-author-${uniq}`" class="icon">
            <font-awesome-icon icon="user-pen" />
          </label>
        </span>
      </div>
    </div>
    <div class="input-group input-group-sm">
      <input type="text" class="form-control" placeholder="Search..." v-model="mask.search" />
      <button class="btn btn-outline-secondary" type="button" @click="mask.trigger()">
        <font-awesome-icon icon="search" />
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter {
  .filter-masks {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25em 0.5em;

    input[type="checkbox"] {
      display: none;
    }

    > label {
      text-wrap: nowrap;
      border-width: 2px;
      border-style: solid;
      border-radius: 0.25em;
      padding: 0 0.25em;

      box-sizing: content-box;
      display: flex;
      flex-direction: column;

      .counts {
        display: flex;
        flex-direction: row;
        justify-content: right;
        align-items: center;
        font-size: 0.75em;
        margin-bottom: -0.5em;
        margin-top: 0.5em;
      }
    }
  }
}
</style>
