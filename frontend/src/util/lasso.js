import { pointer } from "d3-selection";
import { drag } from "d3-drag";
import classifyPoint from "robust-point-in-polygon";
import { isNone } from "@/util/index.ts";

const closePathDistance = 150;
const closePathSelect = true;

export function d3lasso() {
  let isPathClosed = false;
  let hoverSelect = true;
  let isReady = false;
  let targetArea;
  let items;

  const on = {
    start: function () {},
    drag: function () {},
    end: function () {},
  };

  // Function to execute on call
  function lasso(root) {
    // add a new group for the lasso
    const g = root.append("g").attr("class", "lasso");

    // add the drawn path for the lasso
    const dyn_path = g.append("path").attr("class", "drawn");

    // add a closed path
    const close_path = g.append("path").attr("class", "loop_close");

    // add an origin node
    const origin_node = g.append("circle").attr("class", "origin");

    // The transformed lasso path for rendering
    let tpath;

    // The lasso origin for calculations
    let origin;

    // The transformed lasso origin for rendering
    let torigin;

    // Store off coordinates drawn
    let drawnCoords;

    // Apply drag behaviors
    const dragAction = drag()
      .filter((event) => event.shiftKey && isReady && hoverSelect)
      .on("start", dragstart)
      .on("drag", dragmove)
      .on("end", dragend);

    dragAction(targetArea);

    function dragstart(event) {
      // Init coordinates
      drawnCoords = [];

      // Initialize paths
      tpath = "";
      dyn_path.attr("d", null);
      close_path.attr("d", null);

      // Set every item to have a false selection and reset their center point and counters
      items.nodes().forEach(function (e) {
        e.__lasso = {};
        e.__lasso.possible = false;
        e.__lasso.selected = false;
        e.__lasso.hoverSelect = false;
        e.__lasso.loopSelect = false;

        const box = e.getBoundingClientRect();
        e.__lasso.lassoPoint = [Math.round(box.left + (box.width / 2)), Math.round(box.top + (box.height / 2))];
      });

      // if hover is on, add hover function
      if (hoverSelect) {
        items.on("mouseover.lasso", function () {
          // if hovered, change lasso selection attribute to true
          this.__lasso.hoverSelect = true;
        });
      }

      // Run user defined start function
      on.start(event);
    }

    function dragmove(event) {
      // Get mouse position within body, used for calculations
      let x, y;
      if (event.sourceEvent.type === "touchmove") {
        x = event.sourceEvent.touches[0].clientX;
        y = event.sourceEvent.touches[0].clientY;
      } else {
        x = event.sourceEvent.clientX;
        y = event.sourceEvent.clientY;
      }

      // Get mouse position within drawing area, used for rendering
      const tx = pointer(event, this)[0];
      const ty = pointer(event, this)[1];

      // Initialize the path or add the latest point to it
      if (tpath === "") {
        tpath = tpath + "M " + tx + " " + ty;
        origin = [x, y];
        torigin = [tx, ty];
        // Draw origin node
        origin_node.attr("cx", tx).attr("cy", ty).attr("r", 4).attr("display", null);
      } else {
        tpath = tpath + " L " + tx + " " + ty;
      }

      drawnCoords.push([x, y]);

      // Calculate the current distance from the lasso origin
      const distance = Math.sqrt(Math.pow(x - origin[0], 2) + Math.pow(y - origin[1], 2));

      // Set the closed path line
      const close_draw_path = "M " + tx + " " + ty + " L " + torigin[0] + " " + torigin[1];

      // Draw the lines
      dyn_path.attr("d", tpath);

      close_path.attr("d", close_draw_path);

      // Check if the path is closed
      isPathClosed = distance <= closePathDistance;

      // If within the closed path distance parameter, show the closed path. otherwise, hide it
      if (isPathClosed && closePathSelect) {
        close_path.attr("display", null);
      } else {
        close_path.attr("display", "none");
      }

      items.nodes().forEach(function (n) {
        n.__lasso.loopSelect =
          isPathClosed && closePathSelect ? classifyPoint(drawnCoords, n.__lasso.lassoPoint) < 1 : false;
        n.__lasso.possible = n.__lasso.hoverSelect || n.__lasso.loopSelect;
      });

      on.drag(event);
    }

    function dragend(event) {
      // Remove mouseover tagging function
      items.on("mouseover.lasso", null);

      items.nodes().forEach(function (n) {
        if (n.__lasso) {
          n.__lasso.selected = n.__lasso.possible;
          n.__lasso.possible = false;
        }
      });

      // Clear lasso
      dyn_path.attr("d", null);
      close_path.attr("d", null);
      origin_node.attr("display", "none");

      // Run user defined end function
      on.end(event);
    }
  }

  // Set or get list of items for lasso to select
  lasso.items = function (selection) {
    if (isNone(selection)) return items;
    items = selection;
    isReady = !!items && [...items].length > 0;
    const nodes = items.nodes();
    nodes.forEach(function (n) {
      n.__lasso = {
        possible: false,
        selected: false,
      };
    });
    return lasso;
  };

  // Return possible items
  lasso.possibleItems = function () {
    return items.filter(function () {
      return !!this.__lasso?.possible;
    });
  };

  // Return selected items
  lasso.selectedItems = function () {
    return items.filter(function () {
      return !!this.__lasso?.selected;
    });
  };

  // Return not possible items
  lasso.notPossibleItems = function () {
    return items.filter(function () {
      return !this.__lasso?.possible;
    });
  };

  // Return not selected items
  lasso.notSelectedItems = function () {
    return items.filter(function () {
      return !this.__lasso?.selected;
    });
  };

  // Option to select on hover or not
  lasso.active = function (active) {
    if (isNone(active)) return hoverSelect;
    hoverSelect = active;
    return lasso;
  };

  // Events
  lasso.on = function (type, fn) {
    if (!arguments.length) return on;
    if (arguments.length === 1) return on[type];
    on[type] = fn;
    return lasso;
  };

  // Area where lasso can be triggered from
  lasso.targetArea = function (area) {
    if (isNone(area)) return targetArea;
    targetArea = area;
    return lasso;
  };

  return lasso;
}
