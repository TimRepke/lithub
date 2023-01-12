import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as Arrow from 'apache-arrow';
import type {ScaleLinear, ScaleSequential} from "d3";
import {webglScaleMapper, webglSeriesPoint} from "d3fc";
//@ts-ignore
import webglConstantAttribute from '@d3fc/d3fc-webgl/src/buffer/constantAttribute';
//@ts-ignore
import circlePointShader from '@d3fc/d3fc-webgl/src/shaders/point/circle/baseShader';


export const LoadingState = {
  EMPTY: 'EMPTY',
  LOADING: 'LOADING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;
export type LoadingStateT = typeof LoadingState[keyof typeof LoadingState];

export type SchemaReceivedCallback = (numTotalRows: number) => void;
export type BatchReceivedCallback = (currentBatchSize: number, currentNumLoadedRows: number, numTotalRows: number) => void;

export type DataRow = {
  dbid: number;
  note: { label: string, bgPadding: number, title: string };
  data: { x: number, y: number };
  dx: number;
  dy: number;
};

export type MetaData = {
  extent: { x: [number, number], y: [number, number] };
  total_points: number;
  schemes: Record<number, { scheme_id: number, column: string, label: number, choices: Array<string>, description: string }>;
}

export class ScatterPlot {
  state: LoadingStateT;
  url: string;
  container: HTMLDivElement;
  table: Arrow.Table;
  metadata?: MetaData;

  private xScale: ScaleLinear<number, number, never>;
  private yScale: ScaleLinear<number, number, never>;

  schemaReceivedCallback: SchemaReceivedCallback;
  batchReceivedCallback: BatchReceivedCallback;

  constructor(url: string, node: HTMLDivElement,
              schemaReceivedCallback: SchemaReceivedCallback,
              batchReceivedCallback: BatchReceivedCallback) {
    this.url = url;
    this.container = node;
    this.state = LoadingState.EMPTY;
    this.table = new Arrow.Table();

    this.xScale = d3.scaleLinear();
    this.yScale = d3.scaleLinear();

    this.schemaReceivedCallback = schemaReceivedCallback;
    this.batchReceivedCallback = batchReceivedCallback;
  }


  async render3() {
    const randomNormal = d3.randomNormal(0, 1);

    const data = Array.from({length: 1e4}, () => ({
      x: randomNormal(),
      y: randomNormal()
    }));

    const xArray = new Float32Array(data.map((d) => d.x));
    const yArray = new Float32Array(data.map((d) => d.y));

    const x = d3.scaleLinear().domain([-5, 5]);
    const y = d3.scaleLinear().domain([-5, 5]);

    const zoom = fc.zoom().on('zoom', () => render());

    const fillColor = fc
      .webglFillColor()
      .value([1, 0.7784313725490196, 0.5, 0.49767416666666675])
      .data(data);


    const starChart = fc
      .seriesWebglPoint()
      .type(d3.symbolCircle)
      .xScale(x)
      .yScale(y)
      .crossValue(xArray)
      .mainValue(yArray)
      .size(d => 10)
      .defined(() => true)
      .equals((previousData, data) => previousData.length > 0)
      .decorate(program => {
        // Set the color of the points.
        fillColor(program);

        // Enable blending of transparent colors.
        const context = program.context();
        context.enable(context.BLEND);
        context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
      });

    // const informationOverlay = fc
    //   .seriesSvgPoint()
    //   .type(d3.symbolStar)
    //   .xScale(x)
    //   .yScale(y)
    //   .crossValue((d, i) => d.x)
    //   .mainValue(d => d.y)
    //   .defined(d => d.name !== '')
    //   .size(d => 10)
    //   .decorate(selection => {
    //     selection
    //       .enter()
    //       .select('path')
    //       .style('fill', 'white')
    //       .style('stroke', 'white')
    //       .style('stroke-width', '3')
    //       .style('stroke-opacity', '0');
    //
    //     selection
    //       .on('mouseover', (event, data) => {
    //         d3.select(event.currentTarget)
    //           .select('path')
    //           .style('stroke-opacity', '1');
    //         d3.select(event.currentTarget)
    //           .append('text')
    //           .attr('fill', 'white')
    //           .attr('stroke', 'none')
    //           .attr('x', 12)
    //           .attr('y', 6)
    //           .text(data.name);
    //       })
    //       .on('mouseout', (event, data) => {
    //         d3.select(event.currentTarget)
    //           .select('path')
    //           .style('stroke-opacity', '0');
    //         d3.select(event.currentTarget)
    //           .select('text')
    //           .remove();
    //       });
    //   });

    const chart = fc
      .chartCartesian(x, y)
      .chartLabel(`Stars`)
      // .svgPlotArea(informationOverlay)
      .webglPlotArea(starChart)
      .decorate(selection => {
        selection.enter().call(zoom, x, y);
      });

    const render = () => {
      d3.select(this.container)
        .datum(data)
        .call(chart);

    };

    render();
  }

  render2() {
    const randomNormal = d3.randomNormal(0, 1);

    const data = Array.from({length: 1e4}, () => ({
      x: randomNormal(),
      y: randomNormal()
    }));

    const xArray = new Float32Array(data.map((d) => d.x));
    const yArray = new Float32Array(data.map((d) => d.y));

    const xAttr = fc.webglAttribute().data(xArray);
    const yAttr = fc.webglAttribute().data(yArray);

    const x = d3.scaleLinear().domain([-5, 5]);
    const y = d3.scaleLinear().domain([-5, 5]);

    const zoom = fc.zoom().on('zoom', () => render());

    const sizeAttribute = webglConstantAttribute();
    sizeAttribute.value([5]);
    const definedAttribute = webglConstantAttribute();
    definedAttribute.value([true]);
    const fillColorAttribute = webglConstantAttribute();
    fillColorAttribute.value([1, 0.7784313725490196, 0.5, 0.49767416666666675]);



    const starChart = fc.webglSeriesPoint()
      .sizeAttribute(sizeAttribute)
      // .definedAttribute(definedAttribute)
      .crossValueAttribute(xAttr)
      .mainValueAttribute(yAttr)
      .xScale(webglScaleMapper(x).webglScale)
      .yScale(webglScaleMapper(y).webglScale)
      .type(fc.webglSymbolMapper(d3.symbolCircle))
      .decorate((programBuilder) => {
        // decorate(programBuilder, data, 0);

        const context = programBuilder.context();
        context.enable(context.BLEND);
        context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
      });
    // fc
    //   .seriesWebglPoint()
    //   .type(d3.symbolCircle)
    //   .xScale(x)
    //   .yScale(y)
    //   .crossValue(xArray)
    //   .mainValue(yArray)
    //   .size(10)
    //   .defined(true)
    //   // .equals((previousData, data) => previousData.length > 0)
    //   .decorate((program: any) => {
    //     // Set the color of the points.
    //     // fillColor(program);
    //
    //     // Enable blending of transparent colors.
    //     const context = program.context();
    //     context.enable(context.BLEND);
    //     context.blendFunc(context.SRC_ALPHA, context.ONE_MINUS_SRC_ALPHA);
    //   });

    const chart = fc
      .chartCartesian(x, y)
      .chartLabel(`Stars`)
      // .svgPlotArea(informationOverlay)
      .webglPlotArea(starChart)
      .decorate(selection => {
        selection.enter().call(zoom, x, y);
      });

    const render = () => {
      d3.select(this.container)
        .datum(data)
        .call(chart);

    };

    render();
  }

  redraw() {
    d3.select(this.container)
        .datum(data)
        .call(chart);
  }

  public get numLoadedPoints(): number {
    return this.table.numRows;
  }

  public get numTotalPoints(): number | undefined {
    if (this.metadata?.total_points) return this.metadata?.total_points;
    return undefined;
  }

  async load() {
    this.state = LoadingState.LOADING;
    const response = await fetch(this.url);
    const reader = await Arrow.RecordBatchReader.from(response);
    await reader.open();

    this.table = new Arrow.Table(reader.schema);
    this.metadata = {
      extent: JSON.parse(reader.schema.metadata.get('extent') as string),
      total_points: JSON.parse(reader.schema.metadata.get('total_points') as string),
      schemes: JSON.parse(reader.schema.metadata.get('schemes') as string),
    };

    this.xScale = d3.scaleLinear(this.metadata.extent.x, [0, this.container.getBoundingClientRect().width]);
    this.yScale = d3.scaleLinear(this.metadata.extent.y, [0, this.container.getBoundingClientRect().height]);

    this.schemaReceivedCallback(this.metadata.total_points)

    for await (const recordBatch of reader) {
      //@ts-ignore // FIXME
      this.table = this.table.concat(recordBatch);

      this.batchReceivedCallback(recordBatch.numRows, this.numLoadedPoints, this.numTotalPoints as number)

      this.redraw();
    }
  }
}