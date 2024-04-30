<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed, type PropType, ref } from "vue";
import type { AnnotatedDocument, SchemeLabel } from "@/util/types";
import { hslToCSS } from "@/util";
import ToggleIcon from "@/components/ToggleIcon.vue";

const { schemeLabels, doc: document } = defineProps({
  doc: { type: Object as PropType<AnnotatedDocument>, required: true },
  schemeLabels: { type: Object as PropType<Record<string, SchemeLabel>>, required: true },
});
defineEmits<{ (e: "report", document: AnnotatedDocument): void }>();
const showAllLabels = ref(false);

const labels = computed(() =>
  Object.entries(document?.labels).map(([key, score]) => {
    const label = schemeLabels[key];
    return {
      key,
      name: label.name,
      col: label.colour,
      value: score,
    };
  }),
);
</script>

<template>
  <div class="card mb-2">
    <div class="card-body">
      <strong>{{ doc.title }}</strong>
      <br />
      <span class="fst-italic">{{ doc.publication_year }} | {{ doc.authors }}</span>
      <p class="card-text">{{ doc.abstract }}</p>
    </div>
    <div class="card-footer">
      <font-awesome-icon icon="location-crosshairs" class="me-2" />
      <a v-if="doc.doi" :href="`https:/doi.org/${doc.doi}`" class="me-2" target="_blank">DOI</a>
      <a
        v-if="doc.openalex_id"
        :href="`https://api.openalex.org/works/${doc.openalex_id}`"
        class="me-2"
        target="_blank">
        <img src="@/assets/openalex.png" style="height: 1em" alt="OpenAlex" />OpenAlex
      </a>

      <template v-for="label in labels" :key="label.key">
        <span v-if="showAllLabels || label.value > 0.5" class="pill">
          <span class="head" :style="{ backgroundColor: hslToCSS(...label.col) }">{{ label.name }}</span>
          <span class="value">{{ label.value }}</span>
        </span>
      </template>

      <ToggleIcon
        icon-false="plus"
        icon="minus"
        v-model:model="showAllLabels"
        class="no-border"
        style="display: inline" />

      <button class="btn ms-2" @click="$emit('report', doc)">
        <font-awesome-icon icon="flag" />
        Report error
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.card-footer {
  label.icon {
    border: 0 !important;
  }

  .btn {
    --bs-btn-padding-x: 0;
    --bs-btn-padding-y: 0;
    --bs-btn-line-height: 0;
    --bs-btn-font-size: 1em;
  }

  font-size: 0.8em;

  .pill {
    --border-colour: grey;
    --sep-gap: 0.2em;
    --side-margin: 0.1em;

    border: 1px solid var(--border-colour);
    border-radius: 0.25em;
    text-wrap: none;
    margin-right: 0.25em;

    .head {
      border-right: 1px solid var(--border-colour);
      margin-right: var(--sep-gap);
      padding-right: var(--sep-gap);
      padding-left: var(--side-margin);
      text-wrap: nowrap;
    }

    .value {
      padding-right: var(--side-margin);
    }
  }
}
</style>
