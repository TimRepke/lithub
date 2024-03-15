<script setup lang="ts">
import type {Document, Dataset} from "@/plugins/api/api-backend";
import {API} from "@/plugins/api";
import {ref} from "vue";

const props = defineProps<{
  doc: Document;
  dataset: Dataset;
}>();

const abstract = ref<string | null>(null);

function loadAbstract() {
  API.data.getAbstractApiDataDatasetAbstractDocIdGet({
    dataset: props.dataset.key,
    secret: props.dataset.secret,
    docId: props.doc.doc_id})
    .then((response) => {
      abstract.value = response.data;
    })
}

</script>

<template>
  <div class="card m-2 p-0">
    <div class="card-header">
      {{ doc.title }}
    </div>
    <div class="card-body">
      <p>
        <small class="text-muted">
          <span v-if="doc.year"><i class="bi-calendar4-event me-2"></i>{{ doc.year }}</span>
          <span v-if="doc.authors" class="ms-4"><i class="bi-person-lines-fill me-2"></i>{{ doc.authors.join(', ') }}</span>

        </small>
        <a class="float-end" :href="`https://dx.doi.org/${doc.doi||''}`" target="_blank"><i
          class="bi-box-arrow-up-right"></i></a>
      </p>
      <p class="card-text">
        {{ doc.abstract }}
      </p>
    </div>
    <div class="card-footer d-flex justify-content-between">
      <!--      <small class="text-muted">-->
      <!--        <i class="bi-share"></i> {{ tweet.retweets }} &nbsp;-->
      <!--        <i class="bi-heart"></i> {{ tweet.likes }} &nbsp;-->
      <!--        <i class="bi-reply"></i> {{ tweet.replies }}-->
      <!--      </small>-->
      <!--      <small class="text-muted">-->
      <!--        <i class="bi-blockquote-left"></i> {{ tweet.meta_topic }} &nbsp;-->
      <!--        <i class="bi-body-text"></i> {{ tweet.topic }}-->
      <!--      </small>-->
    </div>
  </div>
</template>

<style scoped>

</style>
