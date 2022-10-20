<script setup lang="ts">
import type {AnnotatedDocument} from "@/plugins/api/api-backend";

defineProps<{
  doc: AnnotatedDocument|undefined,
  isLoading: boolean,
}>();

</script>

<template>
  <div class="card m-2 p-0">
    <div class="card-header">
      <template v-if="isLoading||!doc">
        <div class="ms-2 me-auto placeholder-wave">
          <span class="placeholder col-8 placeholder-xs"></span>
        </div>
      </template>
      <template v-else>
        {{ doc.title }}
      </template>
    </div>
    <div class="card-body">
      <template v-if="isLoading||!doc">
        <div class="ms-2 me-auto placeholder-wave">
          <span class="placeholder col-7 placeholder-xs"></span>
          <span class="placeholder col-8 placeholder-xs"></span>
        </div>
      </template>
      <template v-else>
        <p>
          <small class="text-muted">
            <span v-if="doc.year"><i class="bi-calendar4-event me-2"></i>{{ doc.year }}</span>
            <span v-if="doc.authors" class="ms-4"><i class="bi-person-lines-fill me-2"></i>{{
                doc.authors.join(', ')
              }}</span>
          </small>
          <a class="float-end" :href="`https://dx.doi.org/${doc.doi||''}`" target="_blank"><i
            class="bi-box-arrow-up-right"></i></a>
        </p>
        <p class="card-text text-muted small">
          {{ (doc.abstract || '[ABSTRACT MISSING]').replaceAll('\n', '<br />') }}
        </p>
      </template>
    </div>
    <div class="card-footer d-flex justify-content-between">
      <small class="text-muted" v-if="!isLoading && doc">
        <i class="bi-tags-fill"></i>&nbsp;
        <span v-for="(choices, label) in doc.annotations" :key="label">
          <strong>{{ label }}:</strong> {{ choices.join(', ') }}
        </span>
      </small>
    </div>
  </div>
</template>

<style scoped>

</style>
