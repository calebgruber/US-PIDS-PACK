include(Resources.id("jsblock:scripts/pids_util.js"));

const BAR_X = 22;
const CHEVRON_W = 125;
const STATUS_W = 28;
const HEADER_Y = 2;
const TOP_ROW_Y = 20;
const BOTTOM_ROW_Y = 45;
const ROW_H = 12;
const STOPS_REGION_X = BAR_X;            // full chevron width
const STOPS_REGION_W = CHEVRON_W;        // full chevron width
const STOPS_SCALE = 0.74;                // small static text
const STOPS_CHAR_PX = 6.0 * STOPS_SCALE;
const STOPS_PAGE_MS = 3000;
const ROW_SHIFT_ANIM_MS = 500;

const WIDTH = 186;
const HEIGHT = 60;
const ROW_HEIGHT = 15;
const PID_ID = "MNR-LCD-A";

function create(ctx, state, pids) {
  state.lastTopKey = null;
  state.rowTransitionStartMs = 0;
}

function render(ctx, state, pids) {
  let nowMs = Date.now();
  let barW = pids.width - BAR_X - STATUS_W - 4;
  let topArrival = pids.arrivals().get(0);
  let bottomArrival = pids.arrivals().get(1);
  let topKey = getTrainKey(topArrival);

  if (state.lastTopKey === null) {
    state.lastTopKey = topKey;
  }
  if (topKey !== state.lastTopKey && state.lastTopKey !== "none" && topKey !== "none" && state.rowTransitionStartMs === 0) {
    state.rowTransitionStartMs = nowMs;
  }

  let transitioning = false;
  let transitionT = 1;
  if (state.rowTransitionStartMs > 0) {
    transitionT = Math.min(1, (nowMs - state.rowTransitionStartMs) / ROW_SHIFT_ANIM_MS);
    transitioning = transitionT < 1;
    if (!transitioning) {
      state.rowTransitionStartMs = 0;
    }
  }
  state.lastTopKey = topKey;

  let easedT = easeOutCubic(transitionT);
  // Both rows fade up: top slides from bottom→top, bottom slides in from below
  let topOpacity = transitioning ? easedT : 1;
  let topRowY = transitioning
    ? lerp(BOTTOM_ROW_Y, TOP_ROW_Y, easedT)
    : TOP_ROW_Y;
  let bottomOpacity = transitioning ? easedT : 1;
  let bottomRowY = transitioning
    ? lerp(pids.height, BOTTOM_ROW_Y, easedT)
    : BOTTOM_ROW_Y;

  // Background
  Texture.create("BG")
    .texture("jsblock:textures/mnr_bg_txt.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  // Column headers
  //Text.create("HdrTrack")
   // .text("TRACK")
   // .color(0xFFFFFF)
  //  .pos(9, HEADER_Y)
  //  .size(WIDTH - 8, 22)
  //  .centerAlign()
  //  .scaleXY()
  //  .scale(0.55)
  //  .draw(ctx);
//
 // Text.create("HdrDep")
 //   .text("DEPARTING TRAIN")
  //  .color(0xFFFFFF)
  ///  .pos(BAR_X + barW / 2, HEADER_Y)
  //  .size(WIDTH - 8, 50)
  //  .centerAlign()
  //  .scaleXY()
  //  .scale(0.55)
   // .draw(ctx);

 // Text.create("HdrStatus")
  //  .text("STATUS")
  //  .color(0xFFFFFF)
 //   .pos(pids.width - 4, HEADER_Y)
  //  .size(WIDTH - 8, 50)
 //   .rightAlign()
   // .scaleXY()
   // .scale(0.55)
   // .draw(ctx);

  drawRow(ctx, state, pids, topArrival, "Top", topRowY, nowMs, barW, topOpacity, true);
  drawRow(ctx, state, pids, bottomArrival, "Bottom", bottomRowY, nowMs, barW, bottomOpacity, false);
}

function getStopsText(arrival, nowMs) {
  var route = arrival.route && arrival.route();
  if (!route) return "";
  var platforms = route.getPlatforms();
  var stops = [];
  for (var i = 0; i < platforms.size(); i++) {
    stops.push(platforms.get(i).getStationName());
  }
  return getStopsPage(stops, nowMs);
}

function drawRow(ctx, state, pids, arrival, id, rowY, nowMs, barW, opacity, showStops) {
  var clampedOpacity = clamp01(opacity);
  var baseTextColor = blendColor(0x606060, 0xFFFFFF, clampedOpacity);
  var chevronColor = arrival ? arrival.routeColor() : 0x646464;
  var chevronDrawColor = blendColor(0x646464, chevronColor, clampedOpacity);

  Texture.create("Chevron_" + id)
    .texture("jsblock:textures/mnr_chevron.png")
    .pos(BAR_X, rowY)
    .size(CHEVRON_W, ROW_H)
    .color(chevronDrawColor)
    .draw(ctx);

  if (!arrival) return;

  var depMs = arrival.departureTime();
  var arrMs = arrival.arrivalTime ? arrival.arrivalTime() : depMs;
  var secsToArr = Math.floor((arrMs - nowMs) / 1000);
  var arrDate = new Date(arrMs);
  var arrStr = arrDate.getHours().toString().padStart(2, "0") + ":" +
               arrDate.getMinutes().toString().padStart(2, "0");

  var track = arrival.platformName() ? arrival.platformName() : "--";
  var destination = arrival.destination() ? arrival.destination() : "TBD";
  var status = getStatus(arrival, secsToArr);

  // Track number (left of chevron)
  Text.create("Track_" + id)
    .text(track)
    .color(baseTextColor)
    .pos(BAR_X - 12, rowY + 2)
    .size(22, ROW_H - 2)
    .centerAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  // Arrival time (left side of chevron)
  Text.create("Time_" + id)
    .text(arrStr)
    .color(baseTextColor)
    .pos(BAR_X + 14, rowY + 2)
    .size(24, ROW_H - 2)
    .centerAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  // Destination (right side of chevron)
  Text.create("Dest_" + id)
    .text(destination)
    .color(baseTextColor)
    .pos(pids.width - STATUS_W - 12, rowY + 2)
    .size(barW - 44, ROW_H - 2)
    .rightAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  // Status (right of chevron)
  Text.create("Status_" + id)
    .text(status)
    .color(baseTextColor)
    .pos(pids.width - 4, rowY + 2)
    .size(STATUS_W - 2, ROW_H - 2)
    .rightAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  if (showStops) {
    var stopsText = getStopsText(arrival, nowMs);
    if (stopsText) {
      Text.create("Stops")
        .text(stopsText)
        .color(baseTextColor)
        .pos(STOPS_REGION_X, rowY + ROW_H + 1)
        .size(STOPS_REGION_W, ROW_H)
        .leftAlign()
        .scaleXY()
        .scale(STOPS_SCALE)
        .draw(ctx);
    }
  }
}

function getStatus(arrival, secsToArr) {
  if (arrival.cancelled && arrival.cancelled()) return "CANCELLED";
  if (arrival.delayed && arrival.delayed()) return "DELAYED";
  if (secsToArr <= 0) return "AT STATION";
  var countdownMins = Math.max(1, Math.ceil(secsToArr / 60));
  return countdownMins + " min";
}

function getStopsPage(stops, nowMs) {
  if (stops.length === 0) return "";

  var maxChars = Math.max(1, Math.floor(STOPS_REGION_W / STOPS_CHAR_PX) - 1);
  var pages = [];
  var current = "";

  function pushChunks(text) {
    var start = 0;
    while (start < text.length) {
      pages.push(text.substring(start, start + maxChars));
      start += maxChars;
    }
  }

  for (var i = 0; i < stops.length; i++) {
    var stop = stops[i];
    var candidate = current ? current + " \u2022 " + stop : stop;
    if (candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    if (current) {
      pages.push(current);
      current = "";
    }

    if (stop.length <= maxChars) {
      current = stop;
    } else {
      pushChunks(stop);
    }
  }

  if (current) {
    pages.push(current);
  }

  if (pages.length === 0) return "";
  return pages[Math.floor(nowMs / STOPS_PAGE_MS) % pages.length];
}

function getTrainKey(arrival) {
  if (!arrival) return "none";
  var dest = arrival.destination ? arrival.destination() : "";
  var routeId = arrival.routeId ? arrival.routeId() : "";
  // Round to nearest minute so minor ms fluctuations don't produce spurious key changes
  var dep = arrival.departureTime ? Math.round(arrival.departureTime() / 60000) : 0;
  return routeId + "|" + dep + "|" + dest;
}

function clamp01(v) {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function lerp(a, b, t) {
  return a + (b - a) * clamp01(t);
}

function easeOutCubic(t) {
  var x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

function blendColor(fromColor, toColor, t) {
  var k = clamp01(t);
  var fr = (fromColor >> 16) & 255;
  var fg = (fromColor >> 8) & 255;
  var fb = fromColor & 255;
  var tr = (toColor >> 16) & 255;
  var tg = (toColor >> 8) & 255;
  var tb = toColor & 255;

  var r = Math.round(fr + (tr - fr) * k);
  var g = Math.round(fg + (tg - fg) * k);
  var b = Math.round(fb + (tb - fb) * k);
  return (r << 16) | (g << 8) | b;
}

function dispose(ctx, state, pids) {}
