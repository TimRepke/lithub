<script setup lang="ts">
const props = defineProps({
  routeName: { type: String, required: true },
  isNew: { type: Boolean, required: false, default: false },
  title: { type: String, required: true },
  teaserFigure: { type: String, required: false, default: null },
});
</script>

<template>
  <div class="row flex-grow-1 g-0">
    <div class="col-md-4" v-if="props.teaserFigure">
      <router-link :to="{ name: props.routeName }" style="color: inherit; text-decoration: none">
        <img :src="props.teaserFigure" class="img-fluid rounded-start" style="object-fit: cover; height: 100%" alt="" />
      </router-link>
    </div>
    <div :class="props.teaserFigure ? 'col-md-8' : 'col'">
      <div class="card-body">
        <h5 class="card-title">
          <router-link :to="{ name: props.routeName }" style="color: inherit; text-decoration: none">
            {{ props.title }}
          </router-link>
          <span v-if="props.isNew" class="ribbon">NEW</span>
        </h5>
        <p class="card-text">
          <slot />
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
