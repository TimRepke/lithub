<script setup lang="ts">
import { scaleOrdinal } from "d3-scale";
import { create as d3create } from "d3-selection";
import { interpolate, quantize } from "d3-interpolate";
import { interpolateRainbow } from "d3-scale-chromatic";
import { hierarchy as d3Hierarchy, partition as d3partition } from "d3-hierarchy";
import { arc as d3arc } from "d3-shape";
import { format as d3format } from "d3-format";
import { computed, onMounted, ref } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import {type Leaf, type Node, constructTopicTree } from "@/projects/healthmap/TopicHierarchy.ts";
// heavily inspired by
// https://observablehq.com/@d3/zoomable-sunburst

// Specify the chart’s dimensions.
const width = 400;
const height = width;
const radius = width / 6;

// Create the color scale.
const color = scaleOrdinal(quantize(interpolateRainbow, data.children.length + 1));

// Compute the layout.
const hierarchy = d3Hierarchy(data)
  .sum((d: BurstLeaf) => d.value)
  .sort((a, b) => b.value - a.value);
const root = d3partition().size([2 * Math.PI, hierarchy.height + 1])(hierarchy);
root.each((d) => (d.current = d));

// Create the arc generator.
const arc = d3arc()
  .startAngle((d) => d.x0)
  .endAngle((d) => d.x1)
  .padAngle((d) => Math.min((d.x1 - d.x0) / 2, 0.005))
  .padRadius(radius * 1.5)
  .innerRadius((d) => d.y0 * radius)
  .outerRadius((d) => Math.max(d.y0 * radius, d.y1 * radius - 1));

// Create the SVG container.
const svg = d3create("svg")
  .attr("viewBox", [-width / 2, -height / 2, width, width])
  .style("font", "10px sans-serif");

// Append the arcs.
const path = svg
  .append("g")
  .selectAll("path")
  .data(root.descendants().slice(1))
  .join("path")
  .attr("fill", (d) => {
    while (d.depth > 1) d = d.parent;
    return color(d.data.name);
  })
  .attr("fill-opacity", (d) => (arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0))
  .attr("pointer-events", (d) => (arcVisible(d.current) ? "auto" : "none"))

  .attr("d", (d) => arc(d.current));

// Make them clickable if they have children.
path
  .filter((d) => d.children)
  .style("cursor", "pointer")
  .on("click", clicked);

const format = d3format(",d");
path.append("title").text(
  (d) =>
    `${d
      .ancestors()
      .map((d) => d.data.name)
      .reverse()
      .join("/")}\n${format(d.value)}`,
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
  .attr("fill-opacity", (d) => +labelVisible(d.current))
  .attr("transform", (d) => labelTransform(d.current))
  .text((d) => d.data.name);

const parent = svg
  .append("circle")
  .datum(root)
  .attr("r", radius)
  .attr("fill", "none")
  .attr("pointer-events", "all")
  .on("click", clicked);

// Handle zoom on click.
function clicked(event, p) {
  parent.datum(p.parent || root);

  root.each(
    (d) =>
      (d.target = {
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
      const i = interpolate(d.current, d.target);
      return (t) => (d.current = i(t));
    })
    .filter(function (d) {
      return +this.getAttribute("fill-opacity") || arcVisible(d.target);
    })
    .attr("fill-opacity", (d) => (arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0))
    .attr("pointer-events", (d) => (arcVisible(d.target) ? "auto" : "none"))

    .attrTween("d", (d) => () => arc(d.current));

  label
    .filter(function (d) {
      return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    })
    .transition(t)
    .attr("fill-opacity", (d) => +labelVisible(d.target))
    .attrTween("transform", (d) => () => labelTransform(d.current));
}

function arcVisible(d) {
  return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
}

function labelVisible(d) {
  return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
}

function labelTransform(d) {
  const x = (((d.x0 + d.x1) / 2) * 180) / Math.PI;
  const y = ((d.y0 + d.y1) / 2) * radius;
  return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
}

function redraw(height: number, width: number) {
 // pass
}

const sunburstElement = ref<HTMLDivElement | null>(null);
const containerObserver = new ResizeObserver((r) => {
  redraw(r[0].contentRect.height, r[0].contentRect.width);
});

onMounted(async () => {
  if (sunburstElement.value) {
    containerObserver.observe(sunburstElement.value);
    sunburstElement.value.appendChild(svg.node() as SVGSVGElement);
  }
});
// return svg.node();
</script>

<template>
  <div class="scatter-container">
    <div class="ms-auto">Some very smart informatory text</div>
    <div ref="sunburstElement" class="sunburst-wrapper" />
  </div>
</template>

<style scoped>
.sunburst-wrapper {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  font-size: 0.85em;

  .scatter-wrapper {
    display: flex;
    flex-grow: 1;
    position: relative;
    overflow: hidden;
    height: 0;
  }
}
</style>
