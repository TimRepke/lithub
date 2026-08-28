<script setup lang="ts">
import { nextTick, PropType, ref, watchEffect } from "vue";
import type { AnnotatedDocument, SchemeLabel, SchemeGroup } from "@/util/types";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { POST } from "@/util/api.ts";
import { is } from "@/util";

type LabelFeedback = SchemeGroup & { isWrong: boolean; values: (SchemeLabel & { selected: boolean })[] };

const emits = defineEmits<{ (e: "close"): void }>();

const {
  document: doc,
  schemeLabels,
  schemeGroups,
  dataset,
} = defineProps({
  schemeLabels: { type: Object as PropType<Record<string, SchemeLabel>>, required: true },
  schemeGroups: { type: Object as PropType<Record<string, SchemeGroup>>, required: true },
  document: { type: Object as PropType<AnnotatedDocument>, required: true },
  dataset: { type: String, required: true },
});

const details = ref(false);
const name = ref<string>("");
const email = ref<string>("");
const comment = ref<string>(`I discovered inconsistencies for "${doc.title}"`);
const relevant = ref(true);

const feedback = ref(
  Object.values(schemeGroups)
    .map((group) => {
      if (group.labels && group.labels.length > 0) {
        return {
          ...group,
          isWrong: false,
          values: group.labels.map((key) => ({
            ...schemeLabels[key],
            selected: doc?.labels[key] > 0.5,
          })),
        } as LabelFeedback;
      }
      return undefined;
    })
    .filter(is<LabelFeedback>),
);

async function submitFeedback() {
  try {
    await POST({
      path: "/basic/report",
      params: { dataset, document: doc?.idx, kind: "ERROR" },
      payload: {
        name: name.value,
        email: email.value,
        comment: comment.value,
        relevant: relevant.value,
        feedback: feedback.value.map((label) => ({
          key: label.key,
          is_wrong: label.isWrong,
          values: label.values.map((value) => ({ key: value.key, selected: value.selected })),
        })),
      },
    });
  } catch (e) {
    console.error(e);
  }
  emits("close");
}

watchEffect(async () => {
  if (doc) {
    await nextTick();
    const firstInput: HTMLElement | null | undefined = document
      .getElementById("reporting-modal")
      ?.querySelector("input, select, textarea, button, object, a, area[href], [tabindex]");
    firstInput?.focus();
  }
});
</script>

<template>
  <template v-if="doc">
    <div class="modal modal-lg fade show d-block">
      <div class="modal-dialog modal-dialog-centered">
        <div
          id="reporting-modal"
          class="modal-content"
          role="dialog"
          aria-labelledby="exampleModalCenteredScrollableTitle"
          aria-modal="true"
          tabindex="-1">
          <div class="modal-header">
            <h1 class="modal-title fs-5" id="exampleModalCenteredScrollableTitle">Report data issue</h1>
            <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <p>
              You discovered an error in our data? Thank you for bringing this to our attention, we will make sure to
              fix our dataset and make this available to everyone as soon as possible.
            </p>
            <div class="mb-3 row">
              <div class="col">
                <label for="report-name" class="form-label">
                  Name <span class="text-body-secondary small">(optional)</span>
                </label>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  id="report-name"
                  placeholder="Name"
                  v-model="name" />
              </div>
              <div class="col">
                <label for="report-email" class="form-label">
                  Email address <span class="text-body-secondary small">(optional)</span>
                </label>
                <input
                  type="email"
                  class="form-control form-control-sm"
                  id="report-email"
                  placeholder="name@example.com"
                  v-model="email" />
              </div>
            </div>
            <div class="mb-3">
              <label for="report-comment" class="form-label">Comment</label>
              <textarea class="form-control form-control-sm" id="report-comment" rows="4" v-model="comment"></textarea>
            </div>
            <button
              type="button"
              class="btn btn-link p-0 text-start text-body-secondary small"
              @click="details = !details"
              :aria-expanded="details">
              <font-awesome-icon :icon="details ? 'minus' : 'plus'" class="me-2" />
              <span class="me-2">Additional details</span>
            </button>
            <div class="mb-3" v-if="details">
              <div class="form-check form-switch">
                <input class="form-check-input" type="checkbox" role="switch" id="report-relevant" v-model="relevant" />
                <label class="form-check-label" for="report-relevant">This article should be included</label>
              </div>
              <div v-for="label in feedback" :key="label.key">
                <div class="form-check form-switch">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    role="switch"
                    :id="`report-mistake-${label.key}`"
                    v-model="label.isWrong" />
                  <label class="form-check-label" :for="`report-mistake-${label.key}`">
                    <strong>{{ label.name }}</strong> has a mistake!
                  </label>
                </div>
                <template v-if="label.isWrong">
                  Correct categories should be:
                  <div class="labels">
                    <template v-for="value in label.values" :key="+value.value">
                      <input type="checkbox" v-model="value.selected" :id="`report-mistake-${value.key}`" />
                      <label
                        :for="`report-mistake-${value.key}`"
                        tabindex="0"
                        @keydown.space.prevent="value.selected = !value.selected"
                        @keydown.enter.prevent="value.selected = !value.selected"
                        >{{ value.name }}</label
                      >
                    </template>
                  </div>
                </template>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Close</button>
            <button type="button" class="btn btn-primary" @click="submitFeedback">Send report</button>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show" @click="$emit('close')"></div>
  </template>
</template>

<style scoped>
.labels {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 1em;

  & > input[type="checkbox"] {
    display: none;
  }

  & > label {
    --bs-border-opacity: 1;
    border-width: 1px;
    border-style: solid;
    border-color: rgba(var(--bs-info-rgb), var(--bs-border-opacity)) !important;
    border-radius: 0.25em;
    margin: 0.2em;
    padding: 0.1em 0.2em;
  }

  input:checked + label {
    background-color: rgba(var(--bs-info-rgb), 0.5) !important;
  }
}
</style>
