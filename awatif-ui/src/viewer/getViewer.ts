import * as THREE from "three";
import van, { State } from "vanjs-core";
import { Node, Mesh, ModalOutputs } from "awatif-fem";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Settings,
  SettingsObj,
  getDefaultSettings,
  getSettings,
} from "./settings/getSettings";
import { nodes } from "./objects/nodes";
import { elements } from "./objects/elements";
import { grid } from "./objects/grid";
import { supports } from "./objects/supports";
import { loads } from "./objects/loads";
import { nodesIndexes } from "./objects/nodesIndexes";
import { elementsIndexes } from "./objects/elementsIndexes";
import { axes } from "./objects/axes";
import { orientations } from "./objects/orientations";
import { frameResults } from "./objects/frameResults";
import { nodeResults } from "./objects/nodeResults";
import { drawing, Drawing } from "./drawing/drawing";
import { shellResults } from "./objects/shellResults";

import "./styles.css";
import { getLegend } from "../color-map/getLegend";

export function getViewer({
  mesh,
  settingsObj,
  drawingObj,
  objects3D,
  solids,
  modalOutputs,
}: {
  mesh?: Mesh;
  settingsObj?: SettingsObj;
  drawingObj?: Drawing;
  objects3D?: State<THREE.Object3D[]>;
  solids?: State<THREE.Object3D[]>;
  modalOutputs?: State<ModalOutputs | null>;
}): HTMLDivElement {
  // init
  THREE.Object3D.DEFAULT_UP = new THREE.Vector3(0, 0, 1);

  const viewerElm = document.createElement("div");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    45,
    1,
    0.1,
    2 * 1e6, // supported view till 1e6
  );
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  const controls = new OrbitControls(camera, renderer.domElement);

  const settings = getDefaultSettings(settingsObj);
  const derivedDisplayScale = van.derive(() =>
    settings.displayScale.val === 0
      ? 1
      : settings.displayScale.val > 0
        ? settings.displayScale.val
        : -1 / settings.displayScale.val,
  );
  const derivedNodes = deriveNodes(mesh, settings);
  const gridObj = grid(settings.gridSize.rawVal);

  // update
  viewerElm.appendChild(getSettings(settings, mesh, solids));

  viewerElm.setAttribute("id", "viewer");
  viewerElm.appendChild(renderer.domElement);

  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 1);

  const gridSize = settings.gridSize.rawVal;
  const z2fit = gridSize * 0.5 + (gridSize * 0.5) / Math.tan(45 * 0.5);
  camera.position.set(0.5 * gridSize, 0.8 * -z2fit, 0.5 * gridSize);
  controls.target.set(0.5 * gridSize, 0.5 * gridSize, 0);
  controls.minDistance = 1;
  controls.maxDistance = z2fit * 2.5;
  controls.zoomSpeed = 10;
  controls.update();

  scene.add(gridObj, axes(settings.gridSize.rawVal, settings.flipAxes.rawVal));

  // View control functions
  function setView(viewType: string, zLevel: number = 0) {
    const distance = gridSize * 2;
    const center = new THREE.Vector3(gridSize * 0.5, gridSize * 0.5, 0);
    const targetZ = viewType === "plan" ? zLevel : center.z;
    const target = new THREE.Vector3(center.x, center.y, targetZ);

    switch (viewType) {
      case "3D":
        camera.position.set(
          center.x + distance * 0.7,
          center.y - distance * 0.7,
          distance * 0.5,
        );
        camera.up.set(0, 0, 1);
        break;
      case "plan":
        camera.position.set(center.x, center.y, distance);
        camera.up.set(0, 1, 0);
        break;
      case "front":
        camera.position.set(center.x, -distance, center.z);
        camera.up.set(0, 0, 1);
        break;
      case "left":
        camera.position.set(-distance, center.y, center.z);
        camera.up.set(0, 0, 1);
        break;
    }

    controls.target.copy(target);
    controls.update();
    viewerRender();
  }

  // Events: on view type change
  van.derive(() => {
    const viewType = settings.viewType.val;
    const zLevel = settings.viewZLevel.val;
    setView(viewType, zLevel);
  });

  // Events
  // on size change
  const resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      const width = entry.target?.clientWidth;
      const height = entry.target?.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      viewerRender();
    }
  });
  resizeObserver.observe(viewerElm);

  // on controls change
  controls.addEventListener("change", viewerRender);

  // on mesh or settings change: render
  van.derive(() => {
    mesh?.nodes?.val;
    mesh?.elements?.val;
    mesh?.nodeInputs?.val;
    mesh?.elementInputs?.val;
    mesh?.deformOutputs?.val;
    mesh?.analyzeOutputs?.val;

    settings.displayScale.val;
    settings.nodes.val;
    settings.elements.val;
    settings.nodesIndexes.val;
    settings.elementsIndexes.val;
    settings.orientations.val;
    settings.supports.val;
    settings.loads.val;
    settings.deformedShape.val;
    settings.nodeResults.val;
    settings.frameResults.val;
    settings.shellResults.val;

    setTimeout(viewerRender); // setTimeout to ensure render is called after all updates are done in that event tick
  });

  // Object's functions (Actions)
  function viewerRender() {
    renderer.render(scene, camera);
  }

  // Optional inputs
  if (mesh) {
    // 3D objects
    scene.add(
      nodes(settings, derivedNodes, derivedDisplayScale),
      elements(mesh, settings, derivedNodes),
      nodesIndexes(settings, derivedNodes, derivedDisplayScale),
      elementsIndexes(mesh, settings, derivedNodes, derivedDisplayScale),
      supports(mesh, settings, derivedNodes, derivedDisplayScale),
      loads(mesh, settings, derivedNodes, derivedDisplayScale),
      orientations(mesh, settings, derivedNodes, derivedDisplayScale),
      nodeResults(mesh, settings, derivedNodes, derivedDisplayScale),
      frameResults(mesh, settings, derivedNodes, derivedDisplayScale),
    );

    // Color map
    const colorMapValues = getColorMapValues(mesh, settings);
    const shellResultsObj = shellResults(
      mesh,
      settings,
      derivedNodes,
      colorMapValues,
    );
    const legend = getLegend(colorMapValues);

    scene.add(shellResultsObj);
    viewerElm.appendChild(legend);

    van.derive(() => {
      legend.hidden = settings.shellResults.val == "none";
      shellResultsObj.visible = settings.shellResults.val != "none";
    });
  }

  if (solids) {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.5);
    light1.position.set(30, 25, -10);
    light1.shadow.mapSize.width = 1024;
    light1.shadow.mapSize.height = 1024;
    scene.add(light1);

    const d = 10;
    light1.shadow.camera.left = -d;
    light1.shadow.camera.right = d;
    light1.shadow.camera.top = d;
    light1.shadow.camera.bottom = -d;
    light1.shadow.camera.far = 1000;

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.color.setHSL(11, 43, 96);
    light2.position.set(-10, 0, 30);
    scene.add(light2);

    // Events: on solids change add/remove objects from the scene
    van.derive(() => {
      if (!solids?.val.length) return;

      scene.remove(...solids.oldVal);

      scene.add(...solids.rawVal);

      viewerRender();
    });

    // Events: on solids settings change update visibility
    van.derive(() => {
      solids.rawVal.forEach((solid) => (solid.visible = settings.solids.val));

      viewerRender();
    });
  }

  if (objects3D) {
    // Events: on objects3D change add/remove objects from the scene
    van.derive(() => {
      if (!objects3D?.val.length) return;

      scene.remove(...objects3D.oldVal);

      scene.add(...objects3D.rawVal);

      viewerRender();
    });
  }

  if (drawingObj)
    drawing({
      drawingObj,
      gridObj,
      scene,
      camera,
      controls,
      gridSize,
      derivedDisplayScale,
      rendererElm: renderer.domElement,
      viewerRender,
    });

  // Modal Animation
  if (modalOutputs) {
    let animationFrameId: number | null = null;
    let startTime: number = 0;

    function animateModal(timestamp: number) {
      if (!settings.modalAnimate.val) {
        animationFrameId = null;
        return;
      }

      const outputs = modalOutputs?.val;
      if (!outputs || !mesh?.nodes?.val) {
        animationFrameId = requestAnimationFrame(animateModal);
        return;
      }

      if (startTime === 0) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000;

      const modeNum = settings.modalMode.val;
      const modeShape = outputs.modeShapes?.get(modeNum);
      const freq = outputs.frequencies?.get(modeNum) || 1;

      if (modeShape) {
        const omega = 2 * Math.PI * freq * settings.modalSpeed.val;
        const factor = Math.sin(omega * elapsed) * settings.modalScale.val;

        const newNodes: Node[] = mesh.nodes.val.map((node, i) => {
          const dx = (modeShape[i * 6 + 0] || 0) * factor;
          const dy = (modeShape[i * 6 + 1] || 0) * factor;
          const dz = (modeShape[i * 6 + 2] || 0) * factor;
          return [node[0] + dx, node[1] + dy, node[2] + dz] as Node;
        });

        derivedNodes.val = newNodes;
        viewerRender(); // Render the animation frame
      }

      animationFrameId = requestAnimationFrame(animateModal);
    }

    // Start/stop animation based on settings
    van.derive(() => {
      if (settings.modalAnimate.val) {
        if (animationFrameId === null) {
          startTime = 0;
          animationFrameId = requestAnimationFrame(animateModal);
        }
      } else {
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
        // Reset to original or static deformed
        if (mesh?.nodes?.val) {
          derivedNodes.val = settings.deformedShape.val
            ? mesh.nodes.val.map((node, index) => {
                const d = mesh.deformOutputs?.val.deformations
                  ?.get(index)
                  ?.slice(0, 3) ?? [0, 0, 0];
                return node.map((n, i) => n + d[i]) as Node;
              })
            : [...mesh.nodes.val];
        }
      }
    });
  }

  return viewerElm;
}

// Utils
function deriveNodes(
  mesh: Mesh | undefined,
  settings: Settings,
): State<Node[]> {
  const derivedNodes: State<Node[]> = van.state([]);

  van.derive(() => {
    if (!mesh?.nodes?.val || mesh.nodes.val.length === 0) {
      derivedNodes.val = [];
      return;
    }

    if (!settings.deformedShape.val && !settings.modalAnimate.val) {
      derivedNodes.val = [...mesh.nodes.val];
      return;
    }

    // Static deformed shape (when not animating)
    if (!settings.modalAnimate.val) {
      derivedNodes.val = mesh.nodes.val.map((node, index) => {
        const d = mesh.deformOutputs?.val.deformations
          ?.get(index)
          ?.slice(0, 3) ?? [0, 0, 0];
        return node.map((n, i) => n + d[i]) as Node;
      });
    }
    // If animating, the animation loop will update derivedNodes
  });

  return derivedNodes;
}

function getColorMapValues(mesh: Mesh, settings: Settings): State<number[]> {
  // Init
  const colorMapValues = van.state([]);

  enum ResultType {
    bendingXX = "bendingXX",
    bendingYY = "bendingYY",
    bendingXY = "bendingXY",
    displacementZ = "displacementZ",
  }

  // Events
  // On resultMapper, nodes, settings.shellResults change: get new values
  van.derive(() => {
    const nodeBendingXX = new Map<number, number[]>();
    const nodeBendingYY = new Map<number, number[]>();
    const nodeBendingXY = new Map<number, number[]>();

    mesh.analyzeOutputs?.val.bendingXX?.forEach((vals, elementIndex) => {
      const element = mesh.elements.val[elementIndex];
      element.forEach((nodeIdx, i) => {
        if (vals[i] !== undefined) {
          nodeBendingXX.set(nodeIdx, [vals[i]]);
        }
      });
    });

    mesh.analyzeOutputs?.val.bendingYY?.forEach((vals, elementIndex) => {
      const element = mesh.elements.val[elementIndex];
      element.forEach((nodeIdx, i) => {
        if (vals[i] !== undefined) {
          nodeBendingYY.set(nodeIdx, [vals[i]]);
        }
      });
    });

    mesh.analyzeOutputs?.val.bendingXY?.forEach((vals, elementIndex) => {
      const element = mesh.elements.val[elementIndex];
      element.forEach((nodeIdx, i) => {
        if (vals[i] !== undefined) {
          nodeBendingXY.set(nodeIdx, [vals[i]]);
        }
      });
    });

    const resultMapper = {
      [ResultType.bendingXX]: [nodeBendingXX, 0],
      [ResultType.bendingYY]: [nodeBendingYY, 0],
      [ResultType.bendingXY]: [nodeBendingXY, 0],
      [ResultType.displacementZ]: [mesh.deformOutputs?.val.deformations, 2],
    };

    const values = [];
    mesh.nodes.val.forEach((_, i) => {
      const resultMap = resultMapper[settings.shellResults.val];
      if (!resultMap) return;
      if (!resultMap[0].has(i)) {
        values.push(0);
        return;
      }
      values.push(resultMap[0].get(i)[resultMap[1]]);
    });

    colorMapValues.val = values;
  });

  return colorMapValues;
}
