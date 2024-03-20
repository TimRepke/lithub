<script setup lang="ts">
import { PropType } from "vue";
import { Results } from "@/util/dataset.ts";

defineProps({
  results: { type: Object as PropType<Results>, required: true },
});
</script>

<template>
  <nav>
    <ul class="pagination m-0">
      <li class="page-item">
        <button
          class="page-link"
          aria-label="Previous"
          :disabled="!results.hasPrev"
          :class="{ disabled: !results.hasPrev }"
          @click="results.prev"
        >
          &laquo;
        </button>
      </li>
      <li class="page-item" v-for="page in results.pages" :key="page">
        <button class="page-link" :class="{ active: page == results.page }" @click="results.page = page">
          {{ page + 1 }}
        </button>
      </li>
      <li class="page-item">
        <button
          class="page-link"
          aria-label="Next"
          :disabled="!results.hasNext"
          :class="{ disabled: !results.hasNext }"
          @click="results.next"
        >
          &raquo;
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped></style>
