<script setup lang="ts">
import {onMounted, ref, Ref, toRef} from "vue";
import {Dataset, loadDataset} from "@/util/dataset.ts";
import {GET} from "@/util/api.ts";
import {DatasetInfo} from "@/util/types";
import {or} from "@/util/dataset/bitmask.ts";

type LoadInfo = { progressCols: number, progressArrow: number };
const loading = ref<LoadInfo | null>({
  progressCols: 0,
  progressArrow: 0,
})
let dataset: Dataset;

onMounted(async () => {
  const info = await GET<DatasetInfo>({path: "/basic/info/policymap"});

  dataset = await loadDataset(
    "policymap",
    info.scheme,
    info.arrow_filename,
    (colsLoaded) => {
      (loading.value as LoadInfo).progressCols = colsLoaded;
    },
    bytesLoaded => (loading.value as LoadInfo).progressArrow = bytesLoaded
  );
  loading.value = null;

  dataset.labelMaskGroups['reg'].toggleActive();
  dataset.labelMaskGroups['edu'].toggleActive();
  dataset.labelMaskGroups['gov'].toggleActive();

  console.log([...dataset.activeMasks()].length)
  // console.log(dataset.labelMaskGroups['sec'].masks[1].mask.count)
  // console.log(dataset.labelMaskGroups['sec'].masks[1].mask.count)
  // console.log(dataset.labelMaskGroups['sec'].masks[1].mask.count)
  // console.log(
  //   dataset.labelMaskGroups['sec'].masks[1].key,
  //   dataset.labelMaskGroups['sec'].masks[1].value,
  //   dataset.labelMaskGroups['sec'].masks[1].counts.value,
  //   dataset.labelMaskGroups['sec'].masks[1].mask.count)
  // console.log(
  //   dataset.labelMaskGroups['sec'].masks[2].key,
  //   dataset.labelMaskGroups['sec'].masks[2].value,
  //   dataset.labelMaskGroups['sec'].masks[2].counts.value,
  //   dataset.labelMaskGroups['sec'].masks[2].mask.count)
  //
  // console.log(or(
  //   dataset.labelMaskGroups['sec'].masks[1].mask,
  //   dataset.labelMaskGroups['sec'].masks[2].mask).count)

  setTimeout(() => dataset.labelMaskGroups['sec'].masks[0].toggleActive(), 1000)
  setTimeout(() => dataset.labelMaskGroups['sec'].setActive(true), 2000)
  setTimeout(() => dataset.labelMaskGroups['sec'].masks[1].toggleActive(), 3000)
  setTimeout(() => dataset.labelMaskGroups['sec'].masks[0].toggleActive(), 4000)
  setTimeout(() => dataset.labelMaskGroups['sec'].masks[1].toggleActive(), 5000)
})
</script>

<template>
  explorer
  <div v-if="loading">
    {{ loading.progressCols }} filters loaded<br/>
    {{ (loading.progressArrow / 1024 / 1024).toLocaleString() }}MB loaded
  </div>
  <div v-if="dataset">
    {{ dataset.counts.value.countFiltered }} / {{ dataset.counts.value.countTotal }}
    <ul>
      <template v-for="(mask, key) in dataset.labelMaskGroups">
        <li v-for="(lmask, lkey) in mask.masks">{{ key }}={{ lkey }}: {{ lmask.counts }} ({{ lmask.active }} /
          {{ lmask.version }})
        </li>
      </template>
    </ul>
  </div>
</template>

<style scoped>

</style>