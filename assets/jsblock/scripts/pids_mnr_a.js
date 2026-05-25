include(Resources.id("jsblock:scripts/pids_util.js"));

const BAR_X = 22;
const CHEVRON_W = 125;
const STATUS_W = 28;
const HEADER_Y = 2;
const TOP_ROW_Y = 20;
const BOTTOM_ROW_Y = 45;
const ROW_H = 12;
const STOPS_Y = 30;
const STOPS_X = 100;
const STOPS_CHAR_PX = 3.6;      // approx px-per-char at scale 0.6
const STOPS_SCROLL_PX_PER_SEC = 24;
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
  if (topKey !== state.lastTopKey && state.lastTopKey !== "none" && topKey !== "none") {
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
    ? lerp(BOTTOM_ROW_Y + ROW_H * 2, BOTTOM_ROW_Y, easedT)
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

  drawRow(ctx, pids, topArrival, "Top", topRowY, nowMs, barW, topOpacity, true);
  drawRow(ctx, pids, bottomArrival, "Bottom", bottomRowY, nowMs, barW, bottomOpacity, false);
}

function getStopsText(arrival) {
  var route = arrival.route && arrival.route();
  if (!route) return "";
  var platforms = route.getPlatforms();
  var stops = [];
  for (var i = 0; i < platforms.size(); i++) {
    stops.push(platforms.get(i).getStationName());
  }
  return stops.join(" \u2022 ");
}

function drawRow(ctx, pids, arrival, id, rowY, nowMs, barW, opacity, showStops) {
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
  var secsToDep = Math.floor((depMs - nowMs) / 1000);
  var minsToDep = Math.floor(secsToDep / 60);
  var depDate = new Date(depMs);
  var depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
               depDate.getMinutes().toString().padStart(2, "0");

  var track = arrival.platformName() ? arrival.platformName() : "--";
  var destination = arrival.destination() ? arrival.destination() : "TBD";
  var status = getStatus(arrival, secsToDep, minsToDep);

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

  // Departure time (left side of chevron)
  Text.create("Time_" + id)
    .text(depStr)
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
    var stopsText = getStopsText(arrival);
    if (stopsText) {
      var scroll = getStopsScroll(stopsText, nowMs);
      Text.create("Stops")
        .text(scroll.text)
        .color(baseTextColor)
        .pos(scroll.x, STOPS_Y)
        .size(barW + 100, 25)
        .leftAlign()
        .scaleXY()
        .scale(0.6)
        .draw(ctx);
    }
  }
}

function getStatus(arrival, secsToDep, minsToDep) {
  if (arrival.cancelled && arrival.cancelled()) return "CANCELLED";
  if (arrival.delayed && arrival.delayed()) return "DELAYED";
  if (secsToDep <= 30 && secsToDep >= -90) return "AT STATION";
  if (minsToDep >= 1 && minsToDep <= 5) return "in " + minsToDep + " min";
  return "ON TIME";
}

function getStopsScroll(text, nowMs) {
  var spacer = "   \u2022   ";
  var loop = text + spacer;
  var loopPx = Math.max(STOPS_CHAR_PX, Math.ceil(loop.length * STOPS_CHAR_PX));
  var offsetPx = ((nowMs / 1000) * STOPS_SCROLL_PX_PER_SEC) % loopPx;
  return {
    text: loop + loop,
    x: STOPS_X - offsetPx
  };
}

function getTrainKey(arrival) {
  if (!arrival) return "none";
  var dep = arrival.departureTime ? arrival.departureTime() : 0;
  var dest = arrival.destination ? arrival.destination() : "";
  var routeId = arrival.routeId ? arrival.routeId() : "";
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
