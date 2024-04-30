<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { DATA_BASE, GET } from "@/util/api.ts";
import { DatasetInfo } from "@/util/types";

const datasets = ref<DatasetInfo[]>([]);
onMounted(async () => {
  datasets.value = await GET<DatasetInfo[]>({ path: "/basic/infos" });
});

const sortedDatasets = computed(() =>
  datasets.value.toSorted((a: DatasetInfo, b: DatasetInfo) => {
    if (a.last_update < b.last_update) return 1;
    if (a.last_update > b.last_update) return -1;
    return 0;
  }),
);
</script>

<template>
  <div class="container mt-5">
    <h1>Literature Hub</h1>
    <p class="teaser">On this page, we share the data used in different research synthesis projects.</p>
    <h3>Explore datasets</h3>

    <div class="infocards">
      <div class="card g-0" v-for="dataset in sortedDatasets" :key="dataset.key">
        <div class="row flex-grow-1 g-0">
          <div class="col-md-4" v-if="dataset.figure">
            <router-link :to="`/project/${dataset.key}`" style="color: inherit; text-decoration: none">
              <img
                :src="`${DATA_BASE}/${dataset.key}/${dataset.figure}`"
                class="img-fluid rounded-start"
                style="object-fit: cover; height: 100%"
                :alt="dataset.name" />
            </router-link>
          </div>
          <div :class="dataset.figure ? 'col-md-8' : 'col'">
            <div class="card-body">
              <h5 class="card-title">
                <router-link :to="`/project/${dataset.key}`" style="color: inherit; text-decoration: none">
                  {{ dataset.name }}
                </router-link>
                <!-- <span v-if="props.isNew" class="ribbon">NEW</span>-->
              </h5>
              <p class="card-text" v-html="dataset.teaser" />
              <p class="update-note">
                First released: {{ dataset.created_date }}&nbsp;&#x2B1D;&nbsp; Last update: {{ dataset.last_update }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.infocards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(40%, 1fr));
  grid-gap: 1rem;

  .update-note {
    font-style: italic;
    font-size: 0.875em;
    color: var(--bs-secondary-color) !important;
    text-align: right;
  }
}
</style>
