import van, { State } from "vanjs-core";
import { Pane } from "tweakpane";
import { Mesh } from "awatif-fem";

import "./styles.css";

// Todo: Remove this duplicated Settings type (might not be possible to remove it)
export type Settings = {
  gridSize: State<number>;
  displayScale: State<number>;
  nodes: State<boolean>;
  elements: State<boolean>;
  nodesIndexes: State<boolean>;
  elementsIndexes: State<boolean>;
  orientations: State<boolean>;
  supports: State<boolean>;
  loads: State<boolean>;
  deformedShape: State<boolean>;
  nodeResults: State<string>;
  frameResults: State<string>;
  shellResults: State<string>;
  solids: State<boolean>;
  flipAxes: State<boolean>;
  // View controls
  viewType: State<string>;
  viewZLevel: State<number>;
  // Modal animation
  modalMode: State<number>;
  modalAnimate: State<boolean>;
  modalSpeed: State<number>;
  modalScale: State<number>;
};

export type SettingsObj = {
  gridSize?: number;
  displayScale?: number;
  nodes?: boolean;
  elements?: boolean;
  nodesIndexes?: boolean;
  elementsIndexes?: boolean;
  orientations?: boolean;
  supports?: boolean;
  loads?: boolean;
  deformedShape?: boolean;
  nodeResults?: string;
  frameResults?: string;
  shellResults?: string;
  flipAxes?: boolean;
  solids?: boolean;
  // View controls
  viewType?: string;
  viewZLevel?: number;
  // Modal animation (can be State for reactivity)
  modalMode?: number | State<number>;
  modalAnimate?: boolean | State<boolean>;
  modalSpeed?: number | State<number>;
  modalScale?: number | State<number>;
};

export function getSettings(
  settings: Settings,
  mesh?: Mesh,
  solids?: State<object>,
): HTMLElement {
  // init
  const container = document.createElement("div");
  const pane = new Pane({
    title: "Settings",
    expanded: false,
    container,
  });

  // update
  container.setAttribute("id", "settings");

  if (mesh?.nodes) {
    pane.addBinding(settings.displayScale, "val", {
      label: "Display scale",
      min: -10,
      max: 10,
      step: 1,
    });
    pane.addBinding(settings.nodes, "val", { label: "Nodes" });
    pane.addBinding(settings.elements, "val", {
      label: "Elements",
    });
    pane.addBinding(settings.nodesIndexes, "val", {
      label: "Nodes indexes",
    });
    pane.addBinding(settings.elementsIndexes, "val", {
      label: "Elements indexes",
    });
    pane.addBinding(settings.orientations, "val", {
      label: "Orientations",
    });
  }

  if (mesh?.nodeInputs || mesh?.elementInputs) {
    const inputs = pane.addFolder({ title: "Analysis Inputs" });

    inputs.addBinding(settings.supports, "val", { label: "Supports" });
    inputs.addBinding(settings.loads, "val", { label: "Loads" });
  }

  if (mesh?.deformOutputs || mesh?.analyzeOutputs) {
    const outputs = pane.addFolder({ title: "Analysis Outputs" });

    outputs.addBinding(settings.nodeResults, "val", {
      options: {
        none: "none",
        deformations: "deformations",
        reactions: "reactions",
      },
      label: "Node results",
    });

    outputs.addBinding(settings.frameResults, "val", {
      options: {
        none: "none",
        normals: "normals",
        shearsY: "shearsY",
        shearsZ: "shearsZ",
        torsions: "torsions",
        bendingsY: "bendingsY",
        bendingsZ: "bendingsZ",
      },
      label: "Frame results",
    });

    outputs.addBinding(settings.shellResults, "val", {
      options: {
        none: "none",
        bendingXX: "bendingXX",
        bendingYY: "bendingYY",
        bendingXY: "bendingXY",
        displacementZ: "displacementZ",
      },
      label: "Shell results",
    });

    outputs.addBinding(settings.deformedShape, "val", {
      label: "Deformed shape",
    });
  }

  if (solids) pane.addBinding(settings.solids, "val", { label: "Solids" });

  // View controls folder
  const viewFolder = pane.addFolder({ title: "View", expanded: false });

  viewFolder.addBinding(settings.viewType, "val", {
    options: {
      "3D Isometric": "3D",
      "Plan (XY)": "plan",
      "Front (XZ)": "front",
      "Left (YZ)": "left",
    },
    label: "View Type",
  });

  viewFolder.addBinding(settings.viewZLevel, "val", {
    label: "Z Level",
    min: 0,
    max: 50,
    step: 0.5,
  });

  // Modal Animation folder
  const modalFolder = pane.addFolder({
    title: "Modal Animation",
    expanded: false,
  });

  modalFolder.addBinding(settings.modalMode, "val", {
    label: "Mode",
    min: 1,
    max: 12,
    step: 1,
  });

  modalFolder.addBinding(settings.modalAnimate, "val", {
    label: "Animate",
  });

  modalFolder.addBinding(settings.modalScale, "val", {
    label: "Scale",
    min: 1,
    max: 200,
    step: 1,
  });

  modalFolder.addBinding(settings.modalSpeed, "val", {
    label: "Speed",
    min: 0.1,
    max: 5,
    step: 0.1,
  });

  return container;
}

// Utils
export function getDefaultSettings(settingsObj: SettingsObj): Settings {
  return {
    gridSize: van.state(settingsObj?.gridSize ?? 20),
    displayScale: van.state(settingsObj?.displayScale ?? 1),
    nodes: van.state(settingsObj?.nodes ?? true),
    elements: van.state(settingsObj?.elements ?? true),
    nodesIndexes: van.state(settingsObj?.nodesIndexes ?? false),
    elementsIndexes: van.state(settingsObj?.elementsIndexes ?? false),
    orientations: van.state(settingsObj?.orientations ?? false),
    supports: van.state(settingsObj?.supports ?? true),
    loads: van.state(settingsObj?.loads ?? true),
    deformedShape: van.state(settingsObj?.deformedShape ?? false),
    nodeResults: van.state(settingsObj?.nodeResults ?? "none"),
    frameResults: van.state(settingsObj?.frameResults ?? "none"),
    shellResults: van.state(settingsObj?.shellResults ?? "none"),
    flipAxes: van.state(settingsObj?.flipAxes ?? false),
    solids: van.state(settingsObj?.solids ?? true),
    // View controls
    viewType: van.state(settingsObj?.viewType ?? "3D"),
    viewZLevel: van.state(settingsObj?.viewZLevel ?? 0),
    // Modal animation
    modalMode: van.state(settingsObj?.modalMode ?? 1),
    modalAnimate: van.state(settingsObj?.modalAnimate ?? false),
    modalSpeed: van.state(settingsObj?.modalSpeed ?? 1),
    modalScale: van.state(settingsObj?.modalScale ?? 50),
  };
}
