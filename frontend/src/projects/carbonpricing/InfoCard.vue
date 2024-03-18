<script setup lang="ts">
import route from "./route.ts"
</script>

<template>
  <div>
    <div class="col-md-4">
      <router-link :to="{name: route.children![0].name }" style="color:inherit; text-decoration: none">
        <img src="./assets/teaser.jpg" class="img-fluid rounded-start" style="object-fit: cover; height:100%"/>
      </router-link>
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">
          <router-link :to="{name: route.children![0].name}" style="color:inherit; text-decoration: none">
            Carbon pricing map
          </router-link>
          <span class="ribbon">NEW</span>
        </h5>
        <p class="card-text">
          Comprehensive map of carbon pricing evaluations by <i>Döbbeling-Hildebrandt et al, 2024</i>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>