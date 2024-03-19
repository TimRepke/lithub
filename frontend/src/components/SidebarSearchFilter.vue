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
    <div>{{ mask.counts.countFiltered.toLocaleString() }} / {{ mask.counts.countTotal.toLocaleString() }}</div>
    <div>
      <input type="text" v-model="mask.search" />
      <font-awesome-icon icon="search" @click="mask.trigger()" />
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
