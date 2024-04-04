<script setup lang="ts">
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { computed } from "vue";
import { isNone } from "@/util";

const uniq = crypto.randomUUID();
const { prefix, name, icon, iconFalse, value } = defineProps({
  prefix: { type: String },
  name: { type: String }, // if set, switches to radio
  value: { type: [String, Number, Boolean] },
  icon: { type: String },
  iconFalse: { type: String },
});
const slots = defineSlots<{
  iconTrue: string;
  iconFalse: string;
}>();
const type = computed(() => (name ? "radio" : "checkbox"));

const model = defineModel<string | boolean | number, string>("model", { required: true });
const active = computed(() => (isNone(value) ? !!model.value : value === model.value));

const hasPropIcon = computed(() => icon);
const faIcon = computed(() => (iconFalse && !model.value ? iconFalse : icon));

const hasFalseSlot = computed(() => !!slots.iconFalse);
</script>

<template>
  <div class="icon-toggle">
    <input :type="type" :id="`${prefix}-${uniq}`" v-model="model" :name="name" :value="value" />
    <label :for="`${prefix}-${uniq}`" class="icon">
      <template v-if="hasPropIcon && faIcon">
        <font-awesome-icon :icon="faIcon" />
      </template>
      <template v-else>
        <slot name="iconTrue" v-if="active || (!active && !hasFalseSlot)"></slot>
        <slot name="iconFalse" v-else></slot>
      </template>
    </label>
  </div>
</template>

<style scoped></style>
