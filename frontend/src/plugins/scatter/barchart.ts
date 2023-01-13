import * as d3 from "d3";


export type Margins = { top: number, right: number, left: number, bottom: number }

export default (container: d3.Selection<HTMLDivElement, never, HTMLDivElement, never>,
                counts: Map<string, number>,
                mouseOverCallback: (category: string) => void,
                mouseOutCallback: (category: string) => void,
                clickCallback: (category: string) => void,
                unClickCallback: (category: string) => void,
                width: number, height: number, color: (x: number) => d3.RGBColor, margin: Margins | undefined) => {
  if (!margin) margin = {top: 30, right: 30, bottom: 70, left: 60};

  width = 460 - margin.left - margin.right;
  height = 400 - margin.top - margin.bottom;

  const maxY = Math.max(...counts.values());

  // append the svg object to the body of the page
  const svg = container
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform",
      `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand()
    .domain(counts.keys())
    .range([0, width])
    .padding(0.2);

  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    // @ts-ignore
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .style("text-anchor", "end");

  // Add Y axis
  const y = d3.scaleLinear()
    .domain([0, maxY + (maxY * 0.1)])
    .range([height, 0]);
  svg.append("g")
    // @ts-ignore
    .call(d3.axisLeft(y));

  const currentHidden: Record<string, SVGRectElement> = {};

  // Bars
  svg.selectAll("mybar")
    .data(counts.entries())
    .enter()
    .append("rect")
    // @ts-ignore
    .attr("x", d => x(d[0]))
    .attr("y", d => y(d[1]))
    .attr("width", x.bandwidth())
    .attr("height", d => height - y(d[1]))
    // @ts-ignore
    .attr("fill", d => color(d[0]))
    .on('mouseover', (event, data) => {
      event.target.classList.add('hover');
      mouseOverCallback(data[0]);
    })
    .on('mouseout', (event, data) => {
      event.target.classList.remove('hover');
      mouseOutCallback(data[0]);
    })
    .on('click', (event, data) => {
      if (data[0] in currentHidden) {
        unClickCallback(data[0]);
        currentHidden[data[0]].classList.remove('hidden');
        delete currentHidden[data[0]];
      } else {
        event.target.classList.add('hidden');
        currentHidden[data[0]] = event.target;
        clickCallback(data[0]);
      }
    })
}