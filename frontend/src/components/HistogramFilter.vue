<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { useDelay } from "@/util";
import { HistogramMask } from "@/util/dataset/masks/histogram.ts";
import { scaleBand, scaleLinear } from "d3-scale";
import { brushX, D3BrushEvent } from "d3-brush";
import { zoom as d3zoom, D3ZoomEvent } from "d3-zoom";
import { axisBottom } from "d3-axis";
import { create as d3create } from "d3-selection";

const mask = defineModel<HistogramMask>("mask", { required: true });
const { masks, active, years, clear, selectRange, extent } = mask.value;
const middle = years[Math.ceil(years.length / 2)];
const margin = { top: 5, bottom: 15, left: 10, right: 10 };
const width = ref(400);
const height = ref(150 - margin.top - margin.bottom); // computed(() => Math.min(width.value / 1.618, 175) - margin.top - margin.bottom);

const colours = {
  handle: "#a6761d",
  barTotal: "#dadacd",
  barFiltered: "#e6ab02",
};
type Stack = { year: number; count: number; colour: string };
type Year = { year: number; stack: Stack[] };
const data = computed(() =>
  years.map((yr) => ({
    year: yr,
    stack: [
      {
        year: yr,
        count: extent.value.total[1],
        colour: "white",
      },
      {
        year: yr,
        count: masks[yr].counts.value.countTotal,
        colour: colours.barTotal,
      } as Stack,
      {
        year: yr,
        count: masks[yr].counts.value.countFiltered,
        colour: colours.barFiltered,
      } as Stack,
    ],
  })),
);

//  + margin.left + margin.right, size.h + margin.top + margin.bottom
const svg = d3create("svg");
// .attr("viewBox", [0, 0, width.value, height.value]);
// .on("click", resetZoom);

const yScale = scaleLinear().domain(extent.value.total);
const xScale = scaleBand<number>() //
  .domain(years)
  .padding(0.2);
const xAxis = axisBottom<number>(xScale);

const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
const groupAxis = g.append("g").attr("transform", `translate(0, ${height.value - 5})`);
const groupBars = g.append("g").attr("transform", `translate(0, -6)`);
const groupBrush = g.append("g").attr("class", "brush");

const tooltip = d3create("div").attr("class", "hist-tooltip hidden");

svg.call(
  d3zoom<SVGSVGElement, undefined>()
    .scaleExtent([1, 100])
    .translateExtent([
      [0, 0],
      [width.value, height.value],
    ])
    .extent([
      [0, 0],
      [width.value, height.value],
    ])
    .on("zoom", (event: D3ZoomEvent<SVGSVGElement, undefined>) => {
      groupBars.attr(
        "transform",
        // -6 to account for margin + axis; the rest term adjusts weird offset side effects
        `translate(0, ${-height.value * (event.transform.k - 1) - 6 + 6 * (event.transform.k / 10)})
               scale(1, ${event.transform.k})`,
      );
    }),
);
const brush = brushX<undefined>()
  // .handleSize(8)
  .extent([
    [0, 0],
    [width.value, height.value],
  ])
  .on("start brush end", (event: D3BrushEvent<undefined>) => {
    if (event.type === "end") {
      if (!event.selection) {
        clear();
      } else {
        const [x0, x1] = event.selection as [number, number];
        const domain = xScale
          .domain()
          .slice(
            Math.ceil(Math.max(0, x0 - xScale.step() / 2) / xScale.step()),
            Math.floor(Math.min(width.value, x1 + xScale.step() / 2) / xScale.step()),
          );

        if (domain.length === 0) {
          clear();
        } else if (domain.length === 1) {
          selectRange(domain[0], domain[0]);
        } else {
          selectRange(domain[0], domain[domain.length - 1]);
        }
      }
    }
  });

const { call: delayedRedraw } = useDelay(() => {
  // Update container sizes (height/width)
  svg //
    .attr("width", width.value + margin.left + margin.right)
    .attr("height", height.value + margin.top + margin.bottom);
  yScale.range([0, height.value]);
  xScale.range([0, width.value]);
  brush.extent([
    [0, 0],
    [width.value, height.value],
  ]);

  const numTicks = Math.floor(Math.max(16 - width.value / 50, 2));
  //@ts-ignore
  xAxis.scale(xScale).tickValues(xScale.domain().filter((y, i) => !(i % numTicks)));

  // Bars
  groupBars
    .selectAll("g")
    .data(data.value)
    .join("g")
    .attr("class", "barstack")
    .on("mouseover", showTooltip)
    //.on("mousemove", mousemove)
    .on("mouseleave", hideTooltip)
    .selectAll("rect")
    .data((d) => d.stack)
    .join("rect")
    .attr("class", "bar")
    .attr("x", (d) => xScale(d.year) ?? 0)
    .attr("y", (d) => yScale(extent.value.total[1] - d.count))
    .attr("width", xScale.bandwidth())
    .attr("height", (d) => Math.max(0, yScale(d.count)))
    .attr("fill", (d) => d.colour)
    .attr("opacity", 1);

  groupAxis.call(xAxis);
  groupBrush.call(brush);
}, 50);

const histogramElement = ref<HTMLDivElement | null>(null);
const uniq = crypto.randomUUID();

onMounted(async () => {
  if (histogramElement.value) {
    const containerObserver = new ResizeObserver((r) => {
      width.value = r[0].contentRect.width - margin.left - margin.right;
      // vegaContainer.view.width(r[0].contentRect.width);
      // vegaContainer.view.resize().runAsync();
    });
    containerObserver.observe(histogramElement.value);
    delayedRedraw();
    histogramElement.value.appendChild(svg.node() as SVGSVGElement);
    histogramElement.value.appendChild(tooltip.node() as HTMLDivElement);
  }
});

function showTooltip(event: MouseEvent, d: Year) {
  const offset = d.year > middle ? -100 : 15;
  tooltip
    .html(`<strong>${d.year}</strong><br />Total: ${d.stack[1].count}<br />Filtered: ${d.stack[2].count}`)
    .classed("hidden", false)
    .style("top", "10px")
    .style("left", `${(xScale(d.year) ?? 0) + offset}px`);
  groupBars.selectAll("rect.bar").classed("hist-hl", false);
  (event.target as SVGRectElement).parentElement?.children[0].classList.add("hist-hl");
  event.stopPropagation();
  clearTooltipDelay();
}

const { delayedCall: hideTooltip, clear: clearTooltipDelay } = useDelay((event: MouseEvent) => {
  event.stopPropagation();
  groupBars.selectAll("rect.bar").classed("hist-hl", false);
  tooltip.classed("hidden", true);
}, 300);

watch([data, width], delayedRedraw);
</script>

<template>
  <div class="filter">
    <div class="filter-head">
      <div>Publication years</div>
      <div>
        <input type="checkbox" :id="`active-pyhist-${uniq}`" v-model="active" />
        <label :for="`active-pyhist-${uniq}`" class="icon">
          <font-awesome-icon icon="filter" />
        </label>
      </div>
    </div>
    <div ref="histogramElement" class="hist" />
  </div>
</template>

<style scoped>
.filter {
  display: flex;
  flex-direction: column;
}

.hist {
  position: relative;
}
</style>
<style>
.hist-tooltip {
  position: absolute;
  display: block;
  background-color: white;
  border: 1px solid black;
  border-radius: 5px;
  padding: 10px;
  color: black;
  margin: 10px;
  opacity: 1;
  font-size: 0.8em;
}

.hist-tooltip.hidden {
  display: none;
}

.hist-hl {
  fill: #f8ede2;
}
</style>
