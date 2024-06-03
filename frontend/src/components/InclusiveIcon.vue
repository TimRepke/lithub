<script setup lang="ts">
import { computed } from "vue";
import SetUnionIcon from "@/components/icons/UnionIcon.vue";
import SetIntersectIcon from "@/components/icons/IntersectIcon.vue";
import ToolTip from "@/components/ToolTip.vue";

const uniq = crypto.randomUUID();
const inclusive = defineModel("inclusive");
const InclusiveIconSVG = computed(() => (inclusive.value ? SetUnionIcon : SetIntersectIcon));
</script>

<template>
  <span class="icon-toggle">
    <ToolTip text="Toggle filter intersection/union (AND/OR)" position="left">
      <input type="checkbox" :id="`inclusive-${uniq}`" v-model="inclusive" />
      <label :for="`inclusive-${uniq}`" class="icon border-0">
        <InclusiveIconSVG />
      </label>
    </ToolTip>
  </span>
</template>
