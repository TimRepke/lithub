<script setup lang="ts">
import { Results } from "@/util/dataset";

const results = defineModel<Results>("results", { required: true });
const { page: currentPage, pages, hasPrev, hasNext, prev, next } = results.value;
</script>

<template>
  <nav>
    <ul class="pagination m-0">
      <li class="page-item">
        <button
          class="page-link"
          aria-label="Previous"
          :disabled="!hasPrev"
          :class="{ disabled: !hasPrev }"
          @click="prev">
          &laquo;
        </button>
      </li>
      <li class="page-item" v-for="page in pages" :key="page">
        <button class="page-link" :class="{ active: currentPage == page }" @click="currentPage = page">
          {{ page + 1 }}
        </button>
      </li>
      <li class="page-item">
        <button class="page-link" aria-label="Next" :disabled="!hasNext" :class="{ disabled: !hasNext }" @click="next">
          &raquo;
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped></style>
