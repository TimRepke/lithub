<script setup lang="ts">
import { useApiStore } from "@/stores/apistore.ts";

const apiStore = useApiStore();
</script>

<template>
  <nav class="lh-nav">
    <span class="fw-bold">Literature Hub</span>

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
