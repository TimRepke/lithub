<script setup lang="ts">
import { scaleOrdinal } from "d3-scale";
import { create as d3create } from "d3-selection";
import { interpolate, quantize } from "d3-interpolate";
import { interpolateRainbow } from "d3-scale-chromatic";
import { arc as d3arc } from "d3-shape";
import { format as d3format } from "d3-format";
import { hierarchy as d3Hierarchy, partition as d3partition, type HierarchyRectangularNode } from "d3-hierarchy";
import { onMounted, PropType, ref } from "vue";
import type { SchemeGroup, SchemeLabel } from "@/util/types";
import { type LabelMaskGroup, LabelValueMask } from "@/util/dataset/masks/labels.ts";

type Coords = { x0: number; x1: number; y0: number; y1: number };
type Node = { name: string; children: Node[] | Leaf[] };
type Leaf = { name: string; mask: LabelValueMask; value: number };
type AnyNode = { name: string; current?: Coords; target?: Coords } & Partial<Node> & Partial<Leaf>;
type HierarchyNode = HierarchyRectangularNode<AnyNode>;

// heavily inspired by
// https://observablehq.com/@d3/zoomable-sunburst

const groupMasks = defineModel<Record<string, LabelMaskGroup>>("groupMasks", { required: true });
const { rootKey, schemeLabels, schemeGroups } = defineProps({
  schemeLabels: { type: Object as PropType<Record<string, SchemeLabel>>, required: true },
  schemeGroups: { type: Object as PropType<Record<string, SchemeGroup>>, required: true },
  rootKey: { type: String, required: true },
});

const selection = ref(["Meta-topic"]);

function buildTree(key: string): Node {
  const { labels, subgroups } = schemeGroups[key];
  if (subgroups) {
    return { name: schemeGroups[key].name, children: subgroups.map((group) => buildTree(group)) };
  } else if (labels) {
    return {
      name: schemeGroups[key].name,
      children: labels.map(
        (label) =>
          ({
            name: schemeLabels[label].name,
            mask: groupMasks.value[key].masks[schemeLabels[label].value],
            value: groupMasks.value[key].masks[schemeLabels[label].value].counts.value.countFiltered,
          }) as Leaf,
      ),
    };
  }
  throw new Error("Inconsistent data.");
}

const tree = buildTree(rootKey);

// Specify the chart’s dimensions.
const width = 500;
const height = 500;
const radius = 500 / 6;

// Create the color scale.
const color = scaleOrdinal(quantize(interpolateRainbow, tree.children.length + 1));

// Compute the layout.
const hierarchy = d3Hierarchy<AnyNode>(tree)
  .sum((d: AnyNode) => d.value as number)
  .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
const root = d3partition<AnyNode>().size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
root.each<AnyNode>((d) => (d.data.current = d));

// Create the arc generator.
const arc = d3arc<Coords>()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(radius * 1.5)
  .innerRadius((d) => d.y0 * radius)
  .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

// Create the SVG container.
const svg = d3create<SVGSVGElement>("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, width])
  .style("font", "10px sans-serif");

// Append the arcs.
const path = svg
  .append("g")
  .selectAll("path")
  .data(root.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    while (d.depth > 1 && d.parent) d = d.parent;
    return color(d.data.name);
  })
  .attr("fill-opacity", (d) => (arcVisible(d.data.current!) ? (d.children ? 0.6 : 0.4) : 0))
  .attr("pointer-events", (d) => (arcVisible(d.data.current!) ? "auto" : "none"))

  .attr("d", (d) => arc(d.data.current as HierarchyNode) as string);

// Make them clickable if they have children.
path
  .filter((d) => !!d.children)
  .style("cursor", "pointer")
  .on("click", clicked);

const format = d3format(",d");
path.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .map((d) => d.data.name)
      .reverse()
      .join("/")}\n${format(d.value as number)}`,
);

const label = svg
  .append("g")
  .attr("pointer-events", "none")
  .attr("text-anchor", "middle")
  .style("user-select", "none")
  .selectAll("text")
  .data(root.descendants().slice(1))
  .join("text")
  .attr("dy", "0.35em")
  .attr("fill-opacity", (d) => +labelVisible(d.data.current!))
  .attr("transform", (d) => labelTransform(d.data.current!))
  .text((d) => d.data.name);

const parent = svg
  .append("circle")
  .datum(root)
  .attr("r", radius)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("click", clicked);

function getPath(n: HierarchyNode): string[] {
  if (n.parent) return getPath(n.parent).concat([n.data.name]);
  return [n.data.name];
}

// Handle zoom on click.
function clicked(_event: MouseEvent, p: HierarchyNode) {
  selection.value = getPath(p);
  parent.datum(p.parent || root);

  root.each(
    (d) =>
      (d.data.target = {
        x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
        y0: Math.max(0, d.y0 - p.depth),
        y1: Math.max(0, d.y1 - p.depth),
      }),
  );

  const t = svg.transition().duration(750);

  // Transition the data on all arcs, even the ones that aren’t visible,
  // so that if this transition is interrupted, entering arcs will start
  // the next transition from the desired position.
  path
    .transition(t)
    .tween("data", (d) => {
      const i = interpolate(d.data.current as HierarchyNode, d.data.target as Coords);
      return (t) => (d.data.current = i(t));
    })
    .filter((d: Coords) => {
      return +this.getAttribute("fill-opacity") || arcVisible(d.data.target!);
    })
    .attr("fill-opacity", (d) => (arcVisible(d.data.target!) ? (d.children ? 0.6 : 0.4) : 0))
    .attr("pointer-events", (d) => (arcVisible(d.data.target!) ? "auto" : "none"))
    .attrTween("d", (d) => () => arc(d.data.current!) as string);

  label
    .filter(function (d) {
      return +((this as SVGTextElement).getAttribute("fill-opacity") ?? 0) > 0 || labelVisible(d.data.target!);
    })
    .transition(t)
    .attr("fill-opacity", (d) => +labelVisible(d.data.target!))
    .attrTween("transform", (d) => () => labelTransform(d.data.current!));
}

function arcVisible(d: Coords) {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d: Coords) {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d: Coords) {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

// function redraw() {
//   // pass
// }

const sunburstElement = ref<HTMLDivElement | null>(null);
// const containerObserver = new ResizeObserver((r) => {
//   // redraw(r[0].contentRect.height, r[0].contentRect.width);
// });

onMounted(async () => {
  if (sunburstElement.value) {
    // containerObserver.observe(sunburstElement.value);
    sunburstElement.value.appendChild(svg.node() as SVGSVGElement);
  }
});
// return svg.node();
</script>

<template>
  <div class="scatter-container">
    <div class="ms-auto">{{ selection.join(" ‣ ") }}</div>
    <div ref="sunburstElement" class="sunburst-wrapper" />
  </div>
</template>

<style scoped>
.sunburst-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  font-size: 0.85em;
  margin: 1em;

  .scatter-wrapper {
    display: flex;
    flex-grow: 1;
    position: relative;
    overflow: hidden;
    height: 0;
  }
}
</style>
