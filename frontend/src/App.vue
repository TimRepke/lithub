<script setup lang="ts">
import { apiStore, datasetStore } from "@/stores";
import { version as storeVersion } from "@/stores/datasetstore.ts";
import { computed, ref, watch } from "vue";
import { DatasetInfo } from "@/util/types";
import { useRoute } from "vue-router";

const info = ref<DatasetInfo | null>(null);
watch(storeVersion, () => (info.value = datasetStore.dataset?.info ?? null));

const route = useRoute();
const isProjectRoute = computed(() => {
  const isProjectRoute_ = route.matched.some((r) => r.name === "project");
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  if (!isProjectRoute_) info.value = null;
  return isProjectRoute_;
});
</script>

<template>
  <nav class="lh-nav">
    <span class="fw-bold">Literature Hub</span>
    <span v-if="info && isProjectRoute">—{{ info.name }}</span>

    <span v-if="apiStore.isLoading" class="ms-2">
      <span class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">Loading...</span>
      </span>
      <span class="text-muted small ms-1">Loading...</span>
    </span>

    <router-link class="navbar-brand ms-auto" :to="{ name: 'landing' }">Home</router-link>
    <router-link class="navbar-brand" :to="{ name: 'about' }">About</router-link>
    <router-link class="navbar-brand" :to="{ name: 'privacy' }">Privacy</router-link>
  </nav>

  <router-view></router-view>
</template>

<style scoped>
.lh-nav {
  background-color: hsl(var(--accent-hsl));
  width: 100%;
  padding: 0 0.35em;
  height: var(--top-bar-height);
  display: flex;
  align-items: center;
}

.lh-nav a {
  margin-right: 1ch;
}
</style>
