<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { PropType } from "vue";
import { AnnotatedDocument } from "@/util/types";

defineProps({
  doc: { type: Object as PropType<AnnotatedDocument>, required: true },
});
</script>

<template>
  <div class="card">
    <!--          <div class="card-header">-->
    <!--            {{doc.title}}-->
    <!--          </div>-->
    <div class="card-body">
      <strong>{{ doc.title }}</strong>
      <br />
      <span class="fst-italic">{{ doc.publication_year }} | {{ doc.authors }}</span>
      <p class="card-text">{{ doc.abstract }}</p>
    </div>
    <div class="card-footer" style="font-size: 0.8em">
      <font-awesome-icon icon="location-crosshairs" class="me-2" />
      <a v-if="doc.doi" :href="doc.doi" class="me-2" target="_blank">DOI</a>
      <a
        v-if="doc.openalex_id"
        :href="`https://api.openalex.org/works/${doc.openalex_id}`"
        class="me-2"
        target="_blank"
      >
        <img src="@/assets/openalex.png" style="height: 1em" alt="OpenAlex" />OpenAlex
      </a>

      <span v-for="(v, k) in doc.labels" :key="k">{{ k }}: {{ v }} </span>
    </div>
  </div>
</template>

<style scoped></style>
