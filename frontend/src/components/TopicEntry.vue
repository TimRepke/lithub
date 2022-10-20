<script setup lang="ts">
import type {TopicInfo} from "@/plugins/api/api-backend";

defineProps<{
  topic: TopicInfo;
}>();

</script>

<template>
  <li class="list-group-item d-flex justify-content-between align-items-start list-group-item-action">
    <div class="ms-2 me-auto">
      <div class="fw-bold">Topic {{ topic.id }}</div>
      {{ topic.terms_tfidf.slice(0, 100) }}
    </div>
    <span class="badge bg-primary rounded-pill">{{ topic.cnt.toLocaleString('en') }}</span>
  </li>
</template>

<style scoped>

</style>
