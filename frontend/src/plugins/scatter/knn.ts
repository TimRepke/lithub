import type {Quadtree, QuadtreeLeaf, QuadtreeInternalNode} from "d3";
import type {RowSchema} from "@/plugins/scatter/index";

// https://observablehq.com/@llb4ll/k-nearest-neighbor-search-using-d3-quadtrees

// type Node = { x1: number, x2: number, y1: number, y2: number, mindist: number, data: RowSchema, length: number };
type Node = (QuadtreeInternalNode<RowSchema> | QuadtreeLeaf<RowSchema>) & { mindist: number };

function euclidDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2);
}

function mindist(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  const dx1 = x - x1;
  const dx2 = x - x2;
  const dy1 = y - y1;
  const dy2 = y - y2;

  if (dx1 * dx2 < 0) { // x is between x1 and x2
    if (dy1 * dy2 < 0) { // (x,y) is inside the rectangle
      return 0; // return 0 as point is in rect
    }
    return Math.min(Math.pow(Math.abs(dy1), 2), Math.pow(Math.abs(dy2), 2));
  }
  if (dy1 * dy2 < 0) { // y is between y1 and y2
    // we don't have to test for being inside the rectangle, it's already tested.
    return Math.min(Math.pow(Math.abs(dx1), 2), Math.pow(Math.abs(dx2), 2));
  }
  return Math.min(Math.min(euclidDistance(x, y, x1, y1), euclidDistance(x, y, x2, y2)),
    Math.min(euclidDistance(x, y, x1, y2), euclidDistance(x, y, x2, y1)));
}


function knearest(bestqueue: Array<Node>,
                  resultqueue: Array<RowSchema>,
                  x: number, y: number, k: number) {
  // sort children according to their mindist/dist to searchpoint
  bestqueue.sort(function (a: Node, b: Node) {
    [a, b].forEach(function (val: Node) {
      if (val.mindist == undefined) { // add minidst to nodes if not there already
        if (!val.length) { // is leaf
          val.mindist = euclidDistance(x, y, val.data.x as number, val.data.x as number);
        } else {
          // @ts-ignore
          val.mindist = mindist(x, y, val.x1, val.y1, val.x2, val.y2);
        }
      }
    });
    return b.mindist - a.mindist;
  });

  for (let i = bestqueue.length - 1; i >= 0; i--) { // add nearest leafs if any
    const elem = bestqueue[i];
    if (!elem.length) { // is leaf
      bestqueue.pop();
      //@ts-ignore
      resultqueue.push(elem);
      if (resultqueue.length >= k || bestqueue.length == 0) { // return if k neighbors found or no points left
        return;
      }
    } else {
      break;
    }
  }

  const visited = bestqueue.pop();
  if (visited) {
    // @ts-ignore
    for (let i = 0; i < visited.length; i++) { // add child quadrants to queue
      // @ts-ignore
      if (visited[i]) {
        // @ts-ignore
        visited[i].mindist = undefined; // reset before adding it to the queue
        // @ts-ignore
        bestqueue.push(visited[i]);
      }
    }
  }

  knearest(bestqueue, resultqueue, x, y, k); // recursion
}

export function knn(quadTree: Quadtree<RowSchema>, cx: number, cy: number, k: number): Array<RowSchema> {
  // @ts-ignore
  quadTree.root().mindist = 0;
  const bestqueue = new Array(quadTree.root()); // start with the root node of the quadtree
  const resultqueue: Array<RowSchema> = [];

  // @ts-ignore
  knearest(bestqueue, resultqueue, cx, cy, k);
  //@ts-ignore
  return resultqueue.map(d => d.data);
}
