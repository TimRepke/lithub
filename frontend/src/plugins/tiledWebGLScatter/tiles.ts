import type {
  Color,
  ColorMap,
  Extent,
  FeatherSchema,
  Material,
  Points,
  TileMetadata,
  TileReference
} from '@/plugins/scatter/types';
import { MaterialType } from '@/plugins/scatter/types';
import type { StructRowProxy } from 'apache-arrow';
import { Table, tableFromIPC } from 'apache-arrow';
import * as d3 from 'd3';
import * as THREE from 'three';
// import vertexShader from './vert.vert';
// import fragmentShader from './frag.frag';
// @ts-ignore
import vertexShader from './test.vert';
// @ts-ignore
import fragmentShader from './test.frag';

export type TileManagerParams = {
  baseUrl: string;
  onUpdate: () => void;
  onNew: (points: Points) => void;
  conf: PointSettings;
};
export type PointSettings = {
  pointColor: THREE.ColorRepresentation;
  pointSize: number;
  pointSizeBuffer: number;
  colorField?: keyof FeatherSchema;
  colorScheme?: ColorMap;
  pointRescale: [number, number];
  basePlane: number;
  layerSpacing: number;
  pointSizeAdjuster: number;
  pointsMaterial: MaterialType;
  textureSize?: number;
};

export type Tile = {
  tile?: Table<FeatherSchema>;
  coord: TileReference;
  points: Points;
  extent: Extent;
  children: string[];
  total_points: number;
  tile_size: number;
};

export class TileManager {
  private readonly baseUrl: string;
  public readonly tiles: Record<string, Tile>;
  private readonly conf: PointSettings;
  public material: Material;
  private readonly onNewCallback;
  private readonly onUpdateCallback;
  private scales?: { x: d3.ScaleLinear<number, number>; y: d3.ScaleLinear<number, number> };

  constructor(params: TileManagerParams) {
    this.conf = params.conf;
    this.baseUrl = params.baseUrl;
    this.onNewCallback = params.onNew;
    this.onUpdateCallback = params.onUpdate;

    if (this.conf.pointsMaterial === MaterialType.SHADER) {
      this.material = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          zoomFactor: { value: .1 },
        },
        // blending: THREE.NormalBlending,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        transparent: true,
        vertexColors: true,
      });
    } else {
      this.material = getPointMaterial(this.conf.pointSize, this.conf.pointSizeAdjuster,
        this.conf.textureSize, true);
    }

    this.tiles = {};

    // load root tile
    void this.addTile({ depth: 0, coord0: 0, coord1: 0 });
  }

  async addTile(coord: TileReference) {
    const [tile, metadata] = await this.fetchTile(coord);
    const points = this.preparePoints(tile, metadata, coord.depth);
    const coordStr = coord2str(coord);
    points.name = coordStr;
    this.tiles[coordStr] = {
      coord,
      points,
      tile,
      extent: metadata.extent,
      children: metadata.children,
      tile_size: metadata.tile_size,
      total_points: metadata.total_points,

    };

    this.onNewCallback(points);
  }

  async fetchTile(coord: TileReference): Promise<[Table<FeatherSchema>, TileMetadata]> {
    const tileUrl = `${this.baseUrl}/${coord.depth}/${coord.coord0}/${coord.coord1}.feather`;
    const tile = await tableFromIPC(fetch(tileUrl));

    const arrowMetadata = tile.schema.metadata as Map<keyof TileMetadata, string>;
    const metadata: TileMetadata = {
      extent: JSON.parse(arrowMetadata.get('extent')!),
      children: JSON.parse(arrowMetadata.get('children')!),
      total_points: parseInt(arrowMetadata.get('total_points')!),
      tile_size: parseInt(arrowMetadata.get('tile_size')!),
    };
    console.log(metadata);
    return [tile, metadata];
  }

  preparePoints(tile: Table<FeatherSchema>, metadata: TileMetadata, depth: number) {
    // byteLength = num points x num dimensions x 4 bytes (Float32 = 4*8 bit)
    const positions = new Float32Array(new ArrayBuffer(tile.numRows * 3 * 4));
    const colors = new Float32Array(new ArrayBuffer(tile.numRows * 3 * 4));
    const sizes = new Float32Array(new ArrayBuffer(tile.numRows * 4));

    if (!this.scales) {
      // root tile should be loaded first, based on that, the scales are set
      this.scales = {
        x: d3.scaleLinear().domain(metadata.extent.x).nice().range(this.conf.pointRescale),
        y: d3.scaleLinear().domain(metadata.extent.y).nice().range(this.conf.pointRescale),
      };
    }
    let c: (r: StructRowProxy<FeatherSchema>) => Color;
    const fallbackColor = (new THREE.Color(this.conf.pointColor)).toArray() as Color;
    const { colorScheme, colorField } = this.conf;

    if (colorField && colorScheme) {
      c = (r) => colorScheme[r[colorField] as number].toArray() as Color;
    } else {
      c = () => fallbackColor;
    }
    // const c = new THREE.Color(this.conf.pointColor);
    let run = 0;
    for (const row of tile) {
      positions.set([this.scales.x(row.x), this.scales.y(row.y), this.conf.basePlane - (this.conf.layerSpacing * depth)], run * 3);
      colors.set(c(row), run * 3);
      sizes.set([this.conf.pointSizeBuffer], run);
      run += 1;
    }

    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pointsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pointsGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return new THREE.Points(pointsGeometry, this.material);//this.conf.material);
  }
}

function coord2str({ depth, coord0, coord1 }: TileReference) {
  return `${depth}/${coord0}/${coord1}`;
}

function makePointTexture(size: number = 33) {
  // size should always be an odd number (so div 2 gives int centre)
  const data = new Uint8Array(4 * size * size);
  let distance: number;
  for (let run = 0; run < (size * size); run++) {
    // draw a filled circle
    // xy centre: ((size - 1) / 2)
    // current col (x): run % size
    // current row (y): Math.floor(run / size)
    // a² + b² = c²
    distance = Math.sqrt(((((size - 1) / 2) - Math.floor(run / size)) ** 2) + ((((size - 1) / 2) - (run % size)) ** 2));
    if (distance < (((size - 1) / 2) - 1)) {
      data.set([255, 255, 255, 255], run * 4);
    } else {
      data.set([0, 0, 0, 0], run * 4);
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.needsUpdate = true;

  return texture;
}

function getPointMaterial(pointSize: number, pointSizeAdjuster: number, textureSize: number | undefined, sizeAttenuation: boolean) {

  const materialParams: THREE.PointsMaterialParameters = {
    size: pointSize * pointSizeAdjuster,
    sizeAttenuation: sizeAttenuation,
    vertexColors: true, // enables setting color via geometry attributes (ArrayBuffer)
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
  };

  if (textureSize !== undefined) {
    materialParams.alphaMap = makePointTexture(textureSize);
  }

  const material = new THREE.PointsMaterial(materialParams);

  // customise the shader function to accommodate setting the size for each point individually
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('uniform float size;', 'attribute float size;');
  };
  return material;
}