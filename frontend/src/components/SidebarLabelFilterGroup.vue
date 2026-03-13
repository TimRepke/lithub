<script setup lang="ts">
import { computed, ref } from "vue";
import { type LabelMaskGroup } from "@/util/dataset/masks/labels.ts";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import InclusiveIcon from "@/components/InclusiveIcon.vue";
import ToolTip from "@/components/ToolTip.vue";

const uniq = crypto.randomUUID();
const { headline } = defineProps({
  headline: { type: String, required: true },
});
const groupMasks = defineModel<Array<LabelMaskGroup>>("groupMasks", { required: true });
const pickedColour = defineModel("pickedColour");

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
      <div>
        <InclusiveIcon v-model:inclusive="selectedGroup.inclusive" />

        <ToolTip text="Use in map colour" position="left">
          <input
            type="radio"
            :id="`colour-${selectedGroup.key}-${uniq}`"
            :value="selectedGroup.key"
            v-model="pickedColour"
            name="colour-picker" />
          <label :for="`colour-${selectedGroup.key}-${uniq}`" class="icon">
            <font-awesome-icon icon="palette" />
          </label>
        </ToolTip>

        <ToolTip :text="`Toggle '${selectedGroup.name}' filter`" position="left">
          <input type="checkbox" :id="`active-${selectedGroup.key}-${uniq}`" v-model="selectedGroup.active" />
          <label :for="`active-${selectedGroup.key}-${uniq}`" class="icon">
            <font-awesome-icon icon="filter" />
          </label>
        </ToolTip>
      </div>
    </div>
    <div>
      <select v-model="group" class="form-select form-select-sm mb-3">
        <option v-for="(grp, gi) in groupMasks" :value="gi">{{ grp.name }}</option>
      </select>
    </div>

    <div class="filter-masks">
      <template v-for="(mask, mKey) in selectedGroup.masks" :key="mKey">
        <input type="checkbox" :id="`active-${selectedGroup.key}-${mKey}-${uniq}`" v-model="mask.active" />
        <label :for="`active-${selectedGroup.key}-${mKey}-${uniq}`" :style="styleColours[mKey]">
          <span class="counts">
            <span>
              {{
                // @ts-ignore
                mask.counts.countFiltered.toLocaleString()
              }}
              /
              {{
                // @ts-ignore
                mask.counts.countTotal.toLocaleString()
              }}
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
