import { datasetStore } from "@/stores";
import type { SchemeLabelValue } from "@/util/types";
import type { LabelMaskGroup, LabelValueMask } from "@/util/dataset/masks/labels.ts";

export type Leaf = { name: string; mask: LabelValueMask };
export type Node = { name: string; children: Node[] | Leaf[] };
type N = { value: SchemeLabelValue; children: N[] };

export function constructTopicTree(rootKey: string): Node {
  const scheme = datasetStore.dataset?.info.scheme;
  const maskLabels = datasetStore.dataset?.labelMaskGroups;

  if (scheme && maskLabels) {
    const values = Object.fromEntries(
      Object.values(scheme).flatMap((entry) => {
        return entry.values.map((value) => [value.key, { value, children: [] } as N]);
      }),
    );

    Object.values(values).forEach((value) => {
      const container = scheme[value.value.label];
      if (container.parent) {
        values[container.parent].children.push(value);
      }
    });

    function rec(child: N): Node | Leaf {
      if (child.children && child.children.length > 0) {
        return {
          name: child.value.name,
          children: child.children.map((value) => rec(values[value.value.key])),
        } as Node;
      } else {
        return {
          name: child.value.name,
          mask: (maskLabels as Record<string, LabelMaskGroup>)[child.value.label].masks[+child.value.value],
        } as Leaf;
      }
    }

    return {
      name: "Meta-topic",
      children: scheme[rootKey].values.map((value) => rec(values[value.key])) as Node[] | Leaf[],
    };
  }
  throw new Error("Inconsistent input data.");
}
