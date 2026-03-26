import van from "vanjs-core";
import { getViewer } from "./getViewer";
import { Node } from "awatif-fem";

const nodes = van.state([
  // To test orientation for beams
  [0, 2, 0], // 0
  [4, 0, 5], // 1
  // To test orientation for shells
  [5, 3, 0], // 2
  [10, 0, 0], // 3
  [5, 0, 5], // 4
] as Node[]);
const elements = van.state([
  [0, 1],
  [2, 3, 4],
]);

const viewerElm = getViewer({
  mesh: { nodes, elements },
  settingsObj: { orientations: true },
});
console.log("main > viewerElm", viewerElm);
document.body.appendChild(viewerElm);
