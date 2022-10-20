import * as THREE from 'three';
import { SelectionBox } from 'three/examples/jsm/interactive/SelectionBox';
import { SelectionHelper } from 'three/examples/jsm/interactive/SelectionHelper';
import * as d3 from 'd3';
import type {
  ColorMap,
  FeatherSchema,
  Material,
  MouseEventCallback,
  PointReference,
  Points,
  PointsAttributes
} from '@/plugins/scatter/types';
import { MaterialType } from '@/plugins/scatter/types';
import { TileManager } from '@/plugins/scatter/tiles';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';

export interface ScatterplotParameters {
  tileBaseUrl: string;
  canvas: HTMLCanvasElement;
  canvasBackground?: THREE.ColorRepresentation;
  // determines how the "thickness" of the cursor for mouse events
  raycasterThreshold?: number;

  // number of zoom levels (should be >= number of tile depth)
  numZoomLevels?: number;
  // zoom (k) marking the deepest zoom level
  maxZoomK?: number;

  // Column in the data to use as a label for colors
  colorField?: keyof FeatherSchema;
  // color scheme, has to provide the same labels as in `colorField`
  colorScheme?: ColorMap;

  // taking arbitrary x,y value space and scaling it to e.g. [1..100]
  pointRescale?: [number, number];
  // at what z-position to put the root layer
  basePlane?: number;
  // space between layers (tile depth) along z axis
  layerSpacing?: number;
  // frustum size of camera (i.e. left,right,top,bottom box boundary)
  frustumSize?: number;
  // depth (along z axis) the camera can see. Needs to be balanced with basePlane and layer spacing!
  cameraNear?: number;
  cameraFar?: number;

  // size of the texture (or undefined to use no alpahmap), only works with MaterialType.POINT
  textureSize?: number;
  // which point material to use
  pointMaterial?: MaterialType;
  // fallback color for points
  pointColor?: THREE.ColorRepresentation;
  // color for points when in focus
  pointColorHover?: THREE.ColorRepresentation;
  // size of points (in geometry)
  pointSize?: number;
  // size of points (in buffer)
  pointSizeBuffer?: number;
  // size of point in buffer when hovered
  pointSizeHover?: number;
  // balance between perspective and geometric zoom on point size on screen
  geomZoomShare?: number;
  // factor determining how fast point size changes in relation to zoom level
  pointSizeAdjuster?: number;
  // no clue, something with the perspective camera
  sizeAttenuation?: boolean;
  // called when cursor moves over a point (`d` is the index)
  mouseInCallback?: MouseEventCallback;
  // called when cursor moves away from a point (`d` is the index)
  mouseOutCallback?: MouseEventCallback;
  // called when clicked on a point (`d` is the index)
  mouseClickCallback?: MouseEventCallback;
}

type OptionalConfigFields =
  'colorField'
  | 'textureSize'
  | 'colorScheme'
  | 'mouseInCallback'
  | 'mouseOutCallback'
  | 'mouseClickCallback'

export class Scatterplot {
  public readonly canvas: HTMLCanvasElement;
  public height: number;
  public width: number;
  public zoomLevel: number;

  public readonly scene: THREE.Scene;
  public readonly camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
  public readonly renderer: THREE.WebGLRenderer;

  public tileManager: TileManager;

  private conf: Required<Omit<ScatterplotParameters, 'tileBaseUrl' | 'canvas' | OptionalConfigFields>> &
    Pick<ScatterplotParameters, OptionalConfigFields>;

  // id (offset in buffer) of point that is in focus
  private focusedPoint?: PointReference;
  // id (offset in buffer) of point that is selected
  private selectedPoint?: PointReference;

  public zoomHandler: d3.ZoomBehavior<HTMLCanvasElement, unknown>;

  constructor(params: ScatterplotParameters) {
    if (!params.canvas) throw new Error('You have to provide a canvas!');
    if (!params.tileBaseUrl) throw new Error('You have to provide a base URL for tiles!');
    this.conf = {
      canvasBackground: params.canvasBackground ?? 0x2f2f2f,
      raycasterThreshold: params.raycasterThreshold ?? 0.05,
      pointMaterial: params.pointMaterial ?? MaterialType.POINT,
      pointColor: params.pointColor ?? 0x00EE00,
      pointColorHover: params.pointColorHover ?? 0xFF0000,
      pointSize: params.pointSize ?? 1.3,
      pointSizeBuffer: params.pointSizeBuffer ?? 1,
      pointSizeHover: params.pointSizeHover ?? 2,
      geomZoomShare: params.geomZoomShare ?? 0.4,
      pointSizeAdjuster: params.pointSizeAdjuster ?? .85,
      sizeAttenuation: params.sizeAttenuation ?? true,
      numZoomLevels: params.numZoomLevels ?? 8,
      maxZoomK: params.maxZoomK ?? 800,
      colorField: params.colorField,
      colorScheme: params.colorScheme,
      mouseInCallback: params.mouseInCallback,
      mouseOutCallback: params.mouseOutCallback,
      mouseClickCallback: params.mouseClickCallback,
      layerSpacing: params.layerSpacing ?? 25,
      basePlane: params.basePlane ?? 1000,
      frustumSize: params.frustumSize ?? 400,
      pointRescale: params.pointRescale ?? [0, 100],
      cameraNear: params.cameraNear ?? 0.1,
      cameraFar: params.cameraFar ?? 1000,
      textureSize: params.textureSize,
    };

    this.canvas = params.canvas;

    const { height, width } = this.canvas.getBoundingClientRect();
    this.height = height;
    this.width = width;

    // this.pointsMaterial = this.initPointsMaterial();
    this.scene = this.initScene();
    this.camera = this.initCamera();
    this.renderer = this.initRenderer();

    this.zoomLevel = 1;
    this.zoomHandler = this.initZoomHandler();
    this.initMouseMoveHandler();
    // this.initSelection();
    this.tileManager = new TileManager({
      baseUrl: params.tileBaseUrl,
      onUpdate: this.handleTileUpdate.bind(this),
      onNew: this.handleNewTiles.bind(this),
      conf: {
        pointColor: this.conf.pointColor,
        pointSize: this.conf.pointSize,
        pointSizeBuffer: this.conf.pointSizeBuffer,
        pointsMaterial: this.conf.pointMaterial,
        colorField: this.conf.colorField,
        colorScheme: this.conf.colorScheme,
        basePlane: this.conf.basePlane,
        pointRescale: this.conf.pointRescale,
        layerSpacing: this.conf.layerSpacing,
        pointSizeAdjuster: this.conf.pointSizeAdjuster,
        textureSize: this.conf.textureSize,
      }
    });
  }

  initLabels() {
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    document.body.appendChild(labelRenderer.domElement);
  }

  initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(this.conf.canvasBackground);
    // scene.fog = new THREE.FogExp2(scene.background.getHex(), .0014);
    scene.fog = new THREE.Fog(0x00000, 2000, 2010);
    return scene;
  }

  initRenderer() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: this.canvas });
    renderer.setSize(this.width, this.height);
    renderer.setPixelRatio(devicePixelRatio);
    return renderer;
  }

  initCamera() {
    const aspect = this.width / this.height;
    // return new THREE.PerspectiveCamera(90, this.width / this.height, 1, 1000);
    // const camera = new THREE.OrthographicCamera(this.width / -2, this.width / 2, this.height / 2, this.height / -2, 1, 1000);
    // const camera = new THREE.OrthographicCamera(0, this.width , 0, this.height, .1, 1000);
    const camera = new THREE.OrthographicCamera(
      this.conf.frustumSize * aspect / -2,
      this.conf.frustumSize * aspect / 2,
      this.conf.frustumSize / 2,
      this.conf.frustumSize / -2,
      this.conf.cameraNear, this.conf.cameraFar);

    camera.position.set(
      (this.conf.pointRescale[1] - this.conf.pointRescale[0]) / 2,
      (this.conf.pointRescale[1] - this.conf.pointRescale[0]) / 2,
      this.conf.basePlane + this.conf.cameraFar - (this.conf.layerSpacing / 2));
    return camera;

  }

  initZoomHandler() {
    // const zoom2depth = d3.scaleQuantize()
    //   .domain([1, this.conf.maxZoomK])
    //   .range([...Array(this.conf.numZoomLevels).keys()]);

    const handleZoomEvent = (transform: d3.ZoomTransform) => {
      const { x: transX, y: transY, k: scale } = transform;
      this.zoomLevel = scale;

      // TODO filter visible point clouds in scene by zoom level
      // TODO determine viewport extent on z=0 plane
      // TODO tell tile manager about the updated depth and viewport
      //      (TM should figure out itself which tile if any is needed)

      // console.log(transX, transY, scale, this.camera.position);

      // this enables scrolling into a certain region and moving the focus centre
      // move camera towards/away from the scene and change field of view
      // see why this improves the zooming experience here
      // https://observablehq.com/@bmschmidt/zoom-strategies-for-huge-scatterplots-with-three-js#cell-1821
      this.camera.zoom = scale / 2;
      this.camera.position.setX(-(transX - (this.width / 2)) / scale);
      this.camera.position.setY((transY - (this.height / 2)) / scale);
      this.camera.position.setZ(this.conf.basePlane + this.conf.cameraFar - (this.conf.layerSpacing / 2) - scale);

      // update the camera matrices
      this.camera.updateProjectionMatrix();

      // adjust zoom scale for point size
      if ('uniforms' in this.tileManager.material) {
        this.tileManager.material.uniforms.zoomFactor.value = this.getZoomFactor();
      }

      // tell renderer to update
      this.redraw();
    };

    const zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([1, 40000])
      .extent([[0, 0], [this.width, this.height]])
      .on('zoom', ({ transform }) => handleZoomEvent(transform));

    d3.select(this.canvas).call(zoom);

    return zoom;
  }

  initMouseMoveHandler() {
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: this.conf.raycasterThreshold };

    // a memory, so we can remember which attributes to revert to once hover is over
    const memory = {
      color: null as THREE.Color | null,
      size: null as number | null,
      z: null as number | null
    };

    const resetAttributes = (points: Points, ix: number) => {
      const attributes = points.geometry.attributes as unknown as PointsAttributes;

      // reset color to default
      const c = new THREE.Color((memory.color !== null) ? memory.color : this.conf.pointColor);
      attributes.color.setXYZ(ix, c.r, c.g, c.b);
      attributes.color.needsUpdate = true;
      memory.color = null;

      // reset size to default
      attributes.size.setX(ix, (memory.size !== null) ? memory.size : this.conf.pointSize);
      attributes.size.needsUpdate = true;
      memory.size = null;

      // reset Z offset to 0
      attributes.position.setZ(ix, (memory.z !== null) ? memory.z : 0);
      attributes.position.needsUpdate = true;
      memory.z = null;
    };

    const setAttributes = (points: Points, ix: number) => {
      const attributes = points.geometry.attributes as unknown as PointsAttributes;

      // change color
      const c = new THREE.Color(this.conf.pointColorHover);
      memory.color = new THREE.Color(attributes.color.getX(ix), attributes.color.getY(ix), attributes.color.getZ(ix));
      attributes.color.setXYZ(ix, c.r, c.g, c.b);
      attributes.color.needsUpdate = true;

      // increase size
      memory.size = attributes.size.getX(ix);
      attributes.size.setX(ix, this.conf.pointSizeHover / this.getZoomFactor());
      attributes.size.needsUpdate = true;

      // move closer to camera (so it's definitely in front)
      memory.z = attributes.position.getZ(ix);
      attributes.position.setZ(ix, memory.z + 0.001);
      attributes.position.needsUpdate = true;
    };

    const mouseMoveHandler = (event: MouseEvent) => {
      event.preventDefault();

      const mousePosition = new THREE.Vector2(
        (event.offsetX / this.canvas.width) * 2 - 1,
        -(event.offsetY / this.canvas.height) * 2 + 1);

      raycaster.setFromCamera(mousePosition, this.camera);
      const intersects = raycaster.intersectObjects<THREE.Points<THREE.BufferGeometry, Material>>(this.scene.children);

      const { index: ix, object: points } = intersects[0] || {};
      const { name: key } = points || {};

      // something was in focus, but now it should be something else (or nothing), so reset attributes
      if (this.focusedPoint && (this.focusedPoint.ix !== ix || this.focusedPoint.points.name !== key)) {
        // revert to default attributes
        resetAttributes(this.focusedPoint.points, this.focusedPoint.ix);
        // tell whoever cares that focus will be lost
        if (this.conf.mouseOutCallback) this.conf.mouseOutCallback(this.focusedPoint.points.name, this.focusedPoint.ix);
        // unmark intersection
        this.focusedPoint = undefined;
      }
      if (ix && points && key && // make sure we have a point intersection
        (!this.focusedPoint || // either run when no point in focus or intersection different from point in focus
          (this.focusedPoint && (this.focusedPoint.ix !== ix || this.focusedPoint.points.name !== key)))) {
        // set attributes to the "focus" state
        setAttributes(points, ix);
        // remember which element this was, so we can reset the attributes later on
        this.focusedPoint = { points, ix };
        // tell whoever cares that a new point is in focus
        if (this.conf.mouseInCallback) this.conf.mouseInCallback(key, ix);
      }

      this.redraw();
    };

    this.canvas.addEventListener('mousemove', mouseMoveHandler);
  }

  handleCanvasResize(height: number, width: number) {
    this.height = height;
    this.width = width;
    const aspect = width / height;
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = aspect;
    }
    if (this.camera instanceof OrthographicCamera) {
      this.camera.left = this.conf.frustumSize * aspect / -2;
      this.camera.right = this.conf.frustumSize * aspect / 2;
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.redraw();
  }

  handleTileUpdate() {
    // TODO: remove tiles from scene
  }

  handleNewTiles(points: Points) {
    this.scene.add(points);
    this.redraw();
  }

  redraw() {
    this.renderer.render(this.scene, this.camera);
  }

  getZoomFactor() {
    // via https://mycurvefit.com/ on (8,0.32), (20,0.7), (80,1.7), (400,4.5)
    return 3.579467 - (3.418839 * Math.exp(-0.007335486 * this.zoomLevel));
  }

  // drawBox() {
  //   const material = new THREE.LineBasicMaterial({ color: 0xFF00FF });
  //   const points = [];
  //   points.push(new THREE.Vector3(this.conf.pointRescale[0], this.conf.pointRescale[1], this.conf.basePlane));
  //   points.push(new THREE.Vector3(this.conf.pointRescale[1], this.conf.pointRescale[1], this.conf.basePlane));
  //   points.push(new THREE.Vector3(this.conf.pointRescale[1], this.conf.pointRescale[0], this.conf.basePlane));
  //   points.push(new THREE.Vector3(this.conf.pointRescale[0], this.conf.pointRescale[0], this.conf.basePlane));
  //   points.push(new THREE.Vector3(this.conf.pointRescale[0], this.conf.pointRescale[1], this.conf.basePlane));
  //   const geometry = new THREE.BufferGeometry().setFromPoints(points);
  //   const line = new THREE.Line(geometry, material);
  //   this.scene.add(line);
  //   this.redraw();
  // }
  //
  // initSelection() {
  //   function ndc(x: number, y: number) {
  //     // convert mouse coordinate to normalized device coordinate (NDC) space
  //     return (new Vector3(
  //       (x / that.canvas.width) * 2 - 1,
  //       -(y / that.canvas.height) * 2 + 1,
  //       (that.camera.near + that.camera.far) / (that.camera.near - that.camera.far)
  //     ));
  //   }
  //
  //   function ndc2ws(vec:Vector3) {
  //     // convert from camera's normalized device coordinate (NDC) space into world space
  //     const retVec = vec.clone();
  //     retVec.setZ(that.conf.basePlane + 0.01);
  //     return retVec.unproject(that.camera);
  //   }
  //
  //   this.drawBox();
  //   const selectionBox = new SelectionBox(this.camera, this.scene);
  //   const helper = new SelectionHelper(this.renderer, 'selectBox');
  //   const that = this;
  //   this.canvas.addEventListener('pointerdown', function (event) {
  //     for (const item of selectionBox.collection) {
  //       item.material.emissive.set(0x000000);
  //     }
  //     const pos = ndc(event.offsetX, event.offsetY);
  //     selectionBox.startPoint.set(pos.x, pos.y, pos.z);
  //   });
  //   this.canvas.addEventListener('pointermove', function (event) {
  //     if (helper.isDown) {
  //       for (let i = 0; i < selectionBox.collection.length; i++) {
  //         selectionBox.collection[i].material.emissive.set(0x000000);
  //       }
  //       const pos = ndc(event.offsetX, event.offsetY);
  //       selectionBox.endPoint.set(pos.x, pos.y, pos.z);
  //       // const allSelected = selectionBox.select();
  //       // for (let i = 0; i < allSelected.length; i++) {
  //       //   allSelected[i].material.emissive.set(0xffffff);
  //       // }
  //       that.redraw();
  //     }
  //   });
  //   this.canvas.addEventListener('pointerup', function (event) {
  //     const pos = ndc(event.offsetX, event.offsetY);
  //     selectionBox.endPoint.set(pos.x, pos.y, pos.z);
  // 		selectionBox.updateFrustum( selectionBox.startPoint, selectionBox.endPoint );
  //
  //     const allSelected = selectionBox.select();
  //     for (let i = 0; i < allSelected.length; i++) {
  //       allSelected[i].material.emissive.set(0xffffff);
  //     }
  //     console.log(allSelected);
  //
  //     const material = new THREE.LineBasicMaterial({ color: 0x0000ff });
  //     const points = [];
  //     const sp = ndc2ws(selectionBox.startPoint);
  //     const ep = ndc2ws(selectionBox.endPoint);
  //     points.push(new THREE.Vector3(sp.x, sp.y, that.conf.basePlane + 0.001));
  //     points.push(new THREE.Vector3(ep.x, sp.y, that.conf.basePlane + 0.001));
  //     points.push(new THREE.Vector3(ep.x, ep.y, that.conf.basePlane + 0.001));
  //     points.push(new THREE.Vector3(sp.x, ep.y, that.conf.basePlane + 0.001));
  //     points.push(new THREE.Vector3(sp.x, sp.y, that.conf.basePlane + 0.001));
  //     console.log(points);
  //     const geometry = new THREE.BufferGeometry().setFromPoints(points);
  //     const line = new THREE.Line(geometry, material);
  //     that.scene.add(line);
  //
  //     that.redraw();
  //   });
  // }
}
