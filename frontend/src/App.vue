<script setup lang="ts">
import { useApiStore } from "@/stores/apistore.ts";

const apiStore = useApiStore();
</script>

<template>
  <nav class="lh-nav">
    <div class="d-flex">
      <span class="fw-bold">Literature Hub</span>

      <span v-if="apiStore.isLoading" class="ms-2">
        <span class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Loading...</span>
        </span>
        <span class="text-muted small ms-1">Loading...</span>
      </span>

      <a class="navbar-brand ms-auto" href="#">Home</a>
      <a class="navbar-brand" href="#">About</a>
    </div>
  </nav>

  <router-view></router-view>
</template>

<style scoped>
.lh-nav {
  background-color: hsl(var(--accent-hsl));
  width: 100%;
  padding: 0.25em;
}

.lh-nav a {
  margin-right: 1ch;
}
</style>
