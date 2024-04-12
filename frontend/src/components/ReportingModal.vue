<script setup lang="ts">
import { PropType, ref } from "vue";
import type { AnnotatedDocument, Scheme } from "@/util/types";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { POST } from "@/util/api.ts";

const emits = defineEmits<{ (e: "close"): void }>();

const {
  doc: document,
  scheme,
  dataset,
} = defineProps({
  scheme: { type: Object as PropType<Scheme>, required: true },
  doc: { type: Object as PropType<AnnotatedDocument>, required: true },
  dataset: { type: String, required: true },
});

const details = ref(false);
const name = ref<string>("");
const email = ref<string>("");
const comment = ref<string>(`I discovered inconsistencies for "${document.title}"`);
const relevant = ref(true);

const feedback = ref(
  Object.values(scheme).map((label) => ({
    ...label,
    isWrong: false,
    values: label.values.map((value) => ({
      ...value,
      key: `${label.key}|${+value.value}`,
      selected: document?.labels[value.key] > 0.5,
    })),
  })),
);

async function submitFeedback() {
  try {
    await POST({
      path: "/basic/report",
      params: { dataset, document: document?.idx, kind: "ERROR" },
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
</script>

<template>
  <template v-if="doc">
    <div class="modal modal-lg fade show d-block">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
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
                  Name <span class="text-muted small">(optional)</span>
                </label>
                <input
                  type="text"
                  class="form-control form-control-sm"
                  id="report-name"
                  placeholder="Name"
                  v-model="name"
                />
              </div>
              <div class="col">
                <label for="report-email" class="form-label">
                  Email address <span class="text-muted small">(optional)</span>
                </label>
                <input
                  type="email"
                  class="form-control form-control-sm"
                  id="report-email"
                  placeholder="name@example.com"
                  v-model="email"
                />
              </div>
            </div>
            <div class="mb-3">
              <label for="report-comment" class="form-label">Comment</label>
              <textarea class="form-control form-control-sm" id="report-comment" rows="4" v-model="comment"></textarea>
            </div>
            <label class="d-flex text-muted small align-items-center" role="button">
              <font-awesome-icon :icon="details ? 'minus' : 'plus'" class="me-2" />
              <span class="me-2">Additional details</span>
              <hr class="flex-grow-1" />
              <input type="checkbox" v-model="details" id="report-details" class="d-none" />
            </label>
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
                    v-model="label.isWrong"
                  />
                  <label class="form-check-label" :for="`report-mistake-${label.key}`">
                    <strong>{{ label.name }}</strong> has a mistake!
                  </label>
                </div>
                <template v-if="label.isWrong">
                  Correct categories should be:
                  <div class="labels">
                    <template v-for="value in label.values" :key="+value.value">
                      <input type="checkbox" v-model="value.selected" :id="`report-mistake-${value.key}`" />
                      <label :for="`report-mistake-${value.key}`">{{ value.name }}</label>
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
