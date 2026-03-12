<script setup lang="ts">
import { computed, ref } from "vue";
import { type LabelMaskGroup } from "@/util/dataset/masks/labels.ts";

const uniq = crypto.randomUUID();
const { headline } = defineProps({
  headline: { type: String, required: true },
});
const groupMasks = defineModel<Array<LabelMaskGroup>>("groupMasks", { required: true });

const group = ref(0);
const selectedGroup = computed(() => groupMasks.value[group.value]);
// const { masks, key: maskKey } = selectedGroup.value;

const styleColours = computed(() =>
  Object.fromEntries(
    Object.values(selectedGroup.value.masks).map((mask) => [
      mask.value,
      mask.active ? { backgroundColor: mask.colourHex, borderColor: mask.colourHex } : { borderColor: mask.colourHex },
    ]),
  ),
);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>{{ headline }}</div>
    </div>
    <div>
      <select v-model="group">
        <option v-for="(grp, gi) in groupMasks" :value="gi">{{ grp.name }}</option>
      </select>
    </div>

    <div class="filter-masks">
      <template v-for="(mask, mKey) in selectedGroup.masks" :key="mKey">
        <input type="checkbox" :id="`active-${selectedGroup.key}-${mKey}-${uniq}`" v-model="mask.active" />
        <label :for="`active-${selectedGroup.key}-${mKey}-${uniq}`" :style="styleColours[mKey]">
          <span class="counts">
            <span>
              {{ mask.counts.countFiltered.toLocaleString() }} /
              {{ mask.counts.countTotal.toLocaleString() }}
            </span>
          </span>
          <span>
            {{ mask.name }}
          </span>
        </label>
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.filter {
  .filter-masks {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25em 0.5em;

    input[type="checkbox"] {
      display: none;
    }

    > label {
      text-wrap: nowrap;
      border-width: 2px;
      border-style: solid;
      border-radius: 0.25em;
      padding: 0 0.25em;

      box-sizing: content-box;
      display: flex;
      flex-direction: column;

      .counts {
        display: flex;
        flex-direction: row;
        justify-content: right;
        align-items: center;
        font-size: 0.75em;
        margin-bottom: -0.5em;
        margin-top: 0.5em;
      }
    }
  }
}
</style>
