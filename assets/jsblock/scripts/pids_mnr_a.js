include(Resources.id("jsblock:scripts/pids_util.js"));

const BAR_X = 22;
const STATUS_W = 28;
const HEADER_Y = 2;
const TOP_ROW_Y = 20;
const BOTTOM_ROW_Y = 45;
const ROW_H = 12;
const STOPS_Y = 24;
const SCROLL_STEP_MS = 220;

const WIDTH = 186;
const HEIGHT = 60;
const ROW_HEIGHT = 15;
const PID_ID = "MNR-LCD-A";

function create(ctx, state, pids) {}

function render(ctx, state, pids) {
  let nowMs = Date.now();
  let barW = pids.width - BAR_X - STATUS_W - 4;

  // Background
  Texture.create("BG")
    .texture("jsblock:textures/mnr_bg.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  // Column headers
  Text.create("HdrTrack")
    .text("TRACK")
    .color(0xCFCFCF)
    .pos(9, HEADER_Y)
    .size(WIDTH - 8, 22)
    .centerAlign()
    .bold(true)
    .scaleXY()
    .scale(0.55)
    .draw(ctx);

  Text.create("HdrDep")
    .text("DEPARTING TRAIN")
    .color(0xCFCFCF)
    .pos(BAR_X + barW / 2, HEADER_Y)
    .size(WIDTH - 8, 50)
    .centerAlign()
    .bold(true)
    .scaleXY()
    .scale(0.55)
    .draw(ctx);

  Text.create("HdrStatus")
    .text("STATUS")
    .color(0xCFCFCF)
    .pos(pids.width - 4, HEADER_Y)
    .size(WIDTH - 8, 50)
    .rightAlign()
    .bold(true)
    .scaleXY()
    .scale(0.55)
    .draw(ctx);

  // Two train rows
  for (var i = 0; i < 2; i++) {
    var rowY = (i === 0) ? TOP_ROW_Y : BOTTOM_ROW_Y;
    var arrival = pids.arrivals().get(i);
    var chevronColor = arrival ? arrival.routeColor() : 0x646464;

    // Chevron row background (placeholder when no train)
    Texture.create("Chevron_" + i)
      .texture("jsblock:textures/mnr_chevron.png")
      .pos(BAR_X, rowY)
      .size(125, ROW_H)
      .color(chevronColor)
      .draw(ctx);

    if (!arrival) continue;

    var depMs = arrival.departureTime();
    var secsToDep = Math.floor((depMs - nowMs) / 1000);
    var minsToDep = Math.floor(secsToDep / 60);
    var depDate = new Date(depMs);
    var depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
                 depDate.getMinutes().toString().padStart(2, "0");

    var track = arrival.platformName() ? arrival.platformName() : "--";
    var destination = arrival.destination() ? arrival.destination() : "TBD";

    var status = "0 MIN";
    if (arrival.cancelled && arrival.cancelled()) {
      status = "CANCELLED";
    } else if (arrival.delayed && arrival.delayed()) {
      status = "DELAYED";
    } else if (secsToDep < 0 && secsToDep >= -90) {
      status = "AT STATION";
    } else if (minsToDep >= 1) {
      status = minsToDep + " MIN";
    }

    // Track number (left of chevron)
    Text.create("Track_" + i)
      .text(track)
      .color(0xFFFFFF)
      .pos(BAR_X - 12, rowY + 1)
      .size(22, ROW_H - 2)
      .centerAlign()
      .bold(true)
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // Departure time (left side of chevron)
    Text.create("Time_" + i)
      .text(depStr)
      .color(0xFFFFFF)
      .pos(BAR_X + 14, rowY + 1)
      .size(24, ROW_H - 2)
      .centerAlign()
      .bold(true)
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // Destination (right side of chevron)
    Text.create("Dest_" + i)
      .text(destination)
      .color(0xFFFFFF)
      .pos(pids.width - STATUS_W - 4, rowY + 1)
      .size(barW - 44, ROW_H - 2)
      .rightAlign()
      .bold(true)
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // Status (right of chevron)
    Text.create("Status_" + i)
      .text(status)
      .color(0xFFFFFF)
      .pos(pids.width - 4, rowY + 1)
      .size(STATUS_W - 2, ROW_H - 2)
      .rightAlign()
      .bold(false)
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // Scrolling stops — first row only
    if (i === 0) {
      var stopsText = getStopsText(arrival);
      if (stopsText) {
        Text.create("Stops")
          .text(scrollText(stopsText, barW - 8, nowMs))
          .color(0xD8D8D8)
          .pos(100, STOPS_Y)
          .size(barW, 6)
          .centerAlign()
          .bold(false)
          .scaleXY()
          .scale(0.6)
          .draw(ctx);
      }
    }
  }

  // PID label
  Text.create("PID")
    .text(PID_ID)
    .color(0x8A8A8A)
    .pos(pids.width - 2, pids.height - 8)
    .size(32, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.8)
    .draw(ctx);
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

function scrollText(text, pixelWidth, nowMs) {
  if (!text) return "";
  var visibleChars = Math.max(10, Math.floor(pixelWidth / 6));
  if (text.length <= visibleChars) return text;
  var spacer = "   \u2022   ";
  var loop = text + spacer;
  var repeated = loop + loop;
  var offset = Math.floor(nowMs / SCROLL_STEP_MS) % loop.length;
  return repeated.substring(offset, offset + visibleChars);
}

function dispose(ctx, state, pids) {}
