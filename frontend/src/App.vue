<script setup lang="ts">
import {RouterLink, RouterView} from "vue-router";
import {ref} from "vue";
import {API} from "@/plugins/api";
import {useRouteQuery} from "@vueuse/router";
import type {Dataset} from "@/plugins/api/api-backend";

const queryDataset = useRouteQuery('dataset', 'test1');

const dataset = ref<Dataset | undefined>(undefined);

API.datasets.getDatasetApiDatasetsDatasetGet({dataset: queryDataset.value})
  .then((result) => {
    dataset.value = result.data;
  })

</script>

<template>
  <header class="navbar navbar-dark sticky-top bg-dark flex-md-nowrap p-0 shadow">
    <a class="navbar-brand col-md-3 col-lg-2 me-0 px-3 fs-6" href="#">{{ dataset?.info?.name || 'Dataset Viewer' }}</a>
    <button class="navbar-toggler position-absolute d-md-none collapsed" type="button" data-bs-toggle="collapse"
            data-bs-target="#sidebarMenu" aria-controls="sidebarMenu" aria-expanded="false"
            aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <!--    <input class="form-control form-control-dark w-100 rounded-0 border-0" type="text" placeholder="Search" aria-label="Search">-->
    <div class="w-100"></div>
    <div class="navbar-nav">
      <div class="nav-item text-nowrap">
        <RouterLink class="nav-link px-3" to="/">Home</RouterLink>
      </div>
    </div>
    <div class="navbar-nav">
      <div class="nav-item text-nowrap">
        <RouterLink class="nav-link px-3" to="/data">Dataset</RouterLink>
      </div>
    </div>
    <div class="navbar-nav">
      <div class="nav-item text-nowrap">
        <RouterLink class="nav-link px-3" to="/scatter">Scatter</RouterLink>
      </div>
    </div>
    <div class="navbar-nav">
      <div class="nav-item text-nowrap">
        <RouterLink class="nav-link px-3" to="/about">About</RouterLink>
      </div>
    </div>
  </header>
  <div class="container-fluid">
    <div class="row">
      <RouterView/>
    </div>
  </div>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
