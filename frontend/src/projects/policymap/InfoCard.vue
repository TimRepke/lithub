<script setup lang="ts">
import route from "./route.ts";
</script>

<template>
  <div>
    <div class="col-md-4">
      <router-link :to="{ name: route.children![0].name }" style="color: inherit; text-decoration: none">
        <img src="./assets/teaser.jpg" class="img-fluid rounded-start" style="object-fit: cover; height: 100%" alt="" />
      </router-link>
    </div>
    <div class="col-md-8">
      <div class="card-body">
        <h5 class="card-title">
          <router-link :to="{ name: route.children![0].name }" style="color: inherit; text-decoration: none">
            Climate Policy Instruments
          </router-link>
        </h5>
        <p class="card-text">Literature on climate policy instruments based on paper by <i>Callaghan et al, 2024</i></p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
