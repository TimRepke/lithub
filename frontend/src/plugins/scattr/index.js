import * as d3 from 'd3';
import * as fc from 'd3fc';
import * as Arrow from 'apache-arrow';
import bespokePointSeries from './bespokePointSeries';
import streamingAttribute from './streamingAttribute';
import indexedFillColor from './indexedFillColor';
import closestPoint from './closestPoint';
import { seriesSvgAnnotation } from './annotationSeries.js';

export const MAX_BUFFER_SIZE = 4e6; // 1M values * 4 byte value width

// bufferBuilder doesn't automatically assign texture units,
// so we manually assign them here
export const CLOSEST_POINT_TEXTURE_UNIT = 0;
export const FILL_COLOR_TEXTURE_UNIT = 1;

export const LoadingState = {
  EMPTY: 'EMPTY',
  LOADING: 'LOADING',
  DONE: 'DONE',
  FAILED: 'FAILED',
};// as const;
//export type LoadingStateT = typeof LoadingState[keyof typeof LoadingState];

// export type DataRow = {
//   dbid: number;
//   note: { label: string, bgPadding: number, title: string };
//   data: { x: number, y: number };
//   dx: number;
//   dy: number;
// };

// export type MetaData = {
//   extent: {x: [number, number], y: [number, number]};
//   total_points: number;
//   schemes: Record<number, {scheme_id: number, column: string, label: number, choices: Array<string>, description: string}>;
// }

export class ScatterPlot {
  #arrowFileURL; //: string;
  state;//: LoadingStateT
  #table;//?: Arrow.Table
  metadata; //?: MetaData

  #pointers; // Array<fc.pointer>
  #annotations; // Array<DataRow>

  totalPoints;//?:  number
  loadedPoints;//?: number

  #fillColor; //?

  #xScale; // d3.scaleLinear()
  #yScale; // d3.scaleLinear()

  #pointSeries; // ?: BespokePointSeries
  #annotationSeries; //?: AnnotationSeries

  findClosestPoint;
  #highlightPointSeries;
  #pointer; // fs.pointer

  #attributes; // Record<string, { attribute: StreamingAttribute, fill: IndexedFillColor }>
  #indexAttribute; //?: StreamingAttribute
  #crossValueAttribute; //?: StreamingAttribute
  #mainValueAttribute; //?: StreamingAttribute

  #zoom;
  #chart;

  #elem;

  schemaReceivedCallback;
  batchReceivedCallback;

  constructor (arrowFile, elem, schemaReceivedCallback, batchReceivedCallback) {//: string, : DOMElement) {
    this.arrowFileURL = arrowFile;
    this.state = LoadingState.EMPTY;
    this.pointers = [];
    this.annotations = [];
    this.attributes = {};
    this.table = new Arrow.Table();
    this.elem = elem;
    this.batchReceivedCallback = batchReceivedCallback;
    this.schemaReceivedCallback = schemaReceivedCallback;
  }

  redraw () {
    // render the chart with the required data
    // enqueues redraw to occur on the next animation frame
    // using raw attributes means we need to explicitly pass the data in

    this.crossValueAttribute.data(columnValues(this.table, 'x'));
    this.mainValueAttribute.data(columnValues(this.table, 'y'));

    // this.languageAttribute.data(columnValues(data.table, 'language'));
    this.attributes.year.attribute.data(columnValues(this.table, 'year'));
    this.indexAttribute.data(columnValues(this.table, 'dbid'));

    // scale the points as the user zooms, but at a slower rate
    const scale = (this.#xScale.domain()[1] - this.#xScale.domain()[0]) / 100;
    const size = 1 / (1 + (scale - 0.9));
    this.pointSeries.size(size);

    d3.select(this.elem)
      .datum({
        pointers: this.pointers,
        annotations: this.annotations,
        table: this.table,
      })
      .call(this.chart);
  }

  #initDataAttributes () {
    // ASSERT: metadata exists

    const yearAttribute = streamingAttribute()
      .maxByteLength(MAX_BUFFER_SIZE)
      // WebGL doesn't support 32-bit integers
      // because it's based around 32-bit floats.
      // Therefore, ignore 16 most significant bits.
      .type(fc.webglTypes.UNSIGNED_SHORT)
      .stride(4);

    const yearColorScale = d3.scaleSequential()
      .domain([1950, 2030])
      .interpolator(d3.interpolateRdYlGn);

    const yearFill = indexedFillColor()
      .attribute(yearAttribute)
      .range(yearColorScale.domain())
      .value(d => d3.color(yearColorScale(d)))
      .clamp(true)
      .unit(FILL_COLOR_TEXTURE_UNIT);

    this.attributes['year'] = {
      attribute: yearAttribute,
      fill: yearFill,
    };

    // Record<number, {scheme_id: number, column: string, label: number, choices: Array<string>, description: string}>
    Object.entries(this.metadata.schemes).forEach((scheme) => {
      const attr = streamingAttribute()
        .maxByteLength(MAX_BUFFER_SIZE)
        // WebGL doesn't support 32-bit integers
        // because it's based around 32-bit floats.
        // Therefore, ignore 16 most significant bits.
        .type(fc.webglTypes.UNSIGNED_SHORT)
        .stride(4);

      const fill = indexedFillColor()
        .attribute(attr)
        .range([0, d3.schemeCategory10.length - 1])
        .value(d => d3.color(d3.schemeCategory10[Math.round(d)]))
        .clamp(false)
        .unit(FILL_COLOR_TEXTURE_UNIT);

      this.attributes[scheme.column] = {
        attribute: attr,
        fill: fill,
      };
    });

    this.fillColor = yearFill;

  }

  #initPointSeries () {
    this.indexAttribute = streamingAttribute()
      .maxByteLength(MAX_BUFFER_SIZE)
      .type(fc.webglTypes.UNSIGNED_BYTE)
      .size(4)
      .normalized(true);
    this.crossValueAttribute = streamingAttribute()
      .maxByteLength(MAX_BUFFER_SIZE);
    this.mainValueAttribute = streamingAttribute()
      .maxByteLength(MAX_BUFFER_SIZE);

    this.pointSeries = bespokePointSeries()
      .crossValueAttribute(this.crossValueAttribute)
      .mainValueAttribute(this.mainValueAttribute);

    this.pointSeries.decorate((programBuilder) => {
      const gl = programBuilder.context();
      gl.disable(gl.BLEND);

      this.fillColor(programBuilder);
    });
  }

  #initClosestPointFinder () {
    this.findClosestPoint = closestPoint()
      .crossValueAttribute(this.crossValueAttribute)
      .mainValueAttribute(this.mainValueAttribute)
      .indexValueAttribute(this.indexAttribute)
      .unit(CLOSEST_POINT_TEXTURE_UNIT)
      .on('read', ({ index }) => {
        const currentPoint = this.pointers[0];
        this.findClosestPoint.point(currentPoint);

        // ensure the read is not for a stale point
        const previousPoint = this.findClosestPoint.point();
        if (
          previousPoint?.x !== currentPoint?.x ||
          previousPoint?.y !== currentPoint?.y
        ) {
          return;
        }

        // create an annotation for the read value
        this.annotations = [
          convertArrowRow(this.table.get(index))
        ];

        // disable further reads
        this.findClosestPoint.read(false);

        // no need to schedule redraw because the SVG
        // series are rendered after the WebGL series
      });

    const highlightFillColor = fc.webglFillColor([0.3, 0.3, 0.3, 0.6]);
    this.highlightPointSeries = bespokePointSeries()
      .crossValueAttribute(this.crossValueAttribute)
      .mainValueAttribute(this.mainValueAttribute)
      .decorate((programBuilder) => {
        const gl = programBuilder.context();
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        programBuilder.vertexShader()
          .appendHeader('uniform sampler2D uTexture;')
          .appendHeader('attribute vec4 aIndex;')
          .appendBody(`
          vec4 sample = texture2D(uTexture, vec2(0.5, 0.5));
          if (!all(equal(aIndex.xyz, sample.xyz))) {
            // could specify vDefined = 0.0; but this is quicker
            gl_PointSize = 0.0;
          }
      `);
        programBuilder.buffers()
          .attribute('aSize').value([100]);
        programBuilder.buffers()
          .uniform('uTexture', this.findClosestPoint.texture())
          .attribute('aIndex', this.indexAttribute);
        highlightFillColor(programBuilder);
      });
  }

  #initAnnotationSeries () {
    this.annotationSeries = seriesSvgAnnotation()
      .notePadding(15)
      .key(d => d.dbid);
  }

  #initPointer () {
    let debounceTimer = null;

    this.pointer = fc.pointer()
      .on('point', (pointers) => {
        // convert the point to domain values
        this.pointers = pointers.map(({ x, y }) => ({
          x: this.#xScale.invert(x),
          y: this.#yScale.invert(y)
        }));

        const point = this.pointers[0];

        // clear any scheduled reads
        clearTimeout(debounceTimer);

        // clear the annotation if the pointer leaves the area
        // otherwise let it linger until it is updated
        if (point == null) {
          this.annotations = [];
          return;
        }

        // push the point into WebGL
        this.findClosestPoint.point(point);

        // schedule a read of the closest data point back
        // from WebGL
        debounceTimer = setTimeout(() => {
          this.findClosestPoint.read(true);
          this.redraw();
        }, 100);

        this.redraw();
      });
  }

  #initZoom () {
    this.zoom = fc.zoom()
      .on('zoom', () => {
        this.annotations = [];
        this.redraw();
      });
  }

  #initChart () {
    this.chart = fc
      .chartCartesian(this.#xScale, this.#yScale)
      .webglPlotArea(
        // only render the point series on the WebGL layer
        fc
          .seriesWebglMulti()
          .series([this.pointSeries, this.findClosestPoint, this.highlightPointSeries]) //FIXME
          .mapping(d => d.table)
      )
      .svgPlotArea(
        // only render the annotations series on the SVG layer
        fc
          .seriesSvgMulti()
          .series([this.annotationSeries])
          .mapping(d => d.annotations)
      )
      .decorate(sel => {
        // apply the zoom behaviour to the plot area
        sel.enter()
          .selectAll('.plot-area')
          .call(this.zoom, this.#xScale, this.#yScale)
          .call(this.pointer);
      });
  }

  async load () {
    this.state = LoadingState.LOADING;
    const response = await fetch(this.arrowFileURL);
    const reader = await Arrow.RecordBatchReader.from(response);
    await reader.open();

    this.table = new Arrow.Table(reader.schema);
    this.metadata = {
      extent: JSON.parse(reader.schema.metadata.get('extent')),
      total_points: JSON.parse(reader.schema.metadata.get('total_points')),
      schemes: JSON.parse(reader.schema.metadata.get('schemes')),
    };
    this.totalPoints = this.metadata.total_points;

    this.schemaReceivedCallback(reader.schema, this.metadata, this.totalPoints)

    // this.#xScale = d3.scaleLinear().domain(this.metadata.extent.x);
    // this.#yScale = d3.scaleLinear().domain(this.metadata.extent.y);
    this.#xScale = d3.scaleLinear().domain([-50,50]);
    this.#yScale = d3.scaleLinear().domain([-50,50]);

    this.#initDataAttributes();
    this.#initPointSeries();
    this.#initClosestPointFinder();
    this.#initAnnotationSeries();
    this.#initPointer();
    this.#initZoom();
    this.#initChart();
    this.selectColorMap('year')

    for await (const recordBatch of reader) {
      this.table = this.table.concat(recordBatch);
    window.table = this.table;
      this.loadedPoints = this.table.numRows;

      this.batchReceivedCallback(this.loadedPoints)

      this.redraw();
    }
  }

  selectColorMap (attribute) {
    if (attribute in this.attributes) {
      this.fillColor = this.attributes[attribute].fill;
      this.redraw();
    }
  }
}

function columnValues (table, columnName) {
  const index = table.schema.fields.findIndex((field) => field.name === columnName);
  return table.batches.filter(batch => batch.numRows > 0)
    .map(batch => batch.data.children[index].values);
}

function convertArrowRow (row) {
  const rowObj = row.toJSON();
  return {
    dbid: rowObj.dbid,
    note: {
      label: rowObj.year,
      bgPadding: 5,
      title: rowObj.title,
      // label_{label_id}
    },
    data: {
      x: rowObj.x,
      y: rowObj.y,
    },
    dx: 20,
    dy: 20
  };
}
