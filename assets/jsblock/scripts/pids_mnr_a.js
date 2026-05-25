include(Resources.id("jsblock:scripts/pids_util.js"));

const PID_ID = "MNR-A";
const TRACK_X = 4;
const TRACK_W = 14;
const BAR_X = 18;
const STATUS_W = 28;
const HEADER_Y = 2;
const TOP_ROW_Y = 12;
const BOTTOM_ROW_Y = 34;
const ROW_H = 10;
const STOPS_Y = 24;
const TRANSITION_MS = 650;
const SCROLL_STEP_MS = 220;
const ENTRY_OFFSET = 5;
const EXIT_OFFSET = 5;
const SEARCH_ROWS = 8;
const PLACEHOLDER_COLOR = 0x646464;

function create(ctx, state, pids) {
  state.previousRows = [];
  state.currentRows = [];
  state.transitionStart = 0;
}

function render(ctx, state, pids) {
  let nowMs = Date.now();

  Texture.create("BG")
    .texture("jsblock:textures/mnr_bg.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  renderHeaders(ctx, pids);
  renderSlotPlaceholders(ctx, pids);

  let nextRows = getDisplayRows(pids, nowMs);

  if (!sameRowKeys(nextRows, state.currentRows)) {
    state.previousRows = cloneRows(state.currentRows);
    state.currentRows = cloneRows(nextRows);
    state.transitionStart = nowMs;
  }

  let previousRows = state.previousRows ?? [];
  let currentRows = state.currentRows ?? [];
  let elapsed = nowMs - (state.transitionStart ?? 0);

  if (!previousRows.length || elapsed >= TRANSITION_MS) {
    state.previousRows = cloneRows(currentRows);
    renderStaticRows(ctx, currentRows, pids, nowMs);
  } else {
    let progress = clamp(elapsed / TRANSITION_MS, 0, 1);
    renderAnimatedRows(ctx, previousRows, currentRows, pids, nowMs, easeInOut(progress));
  }

  renderFallback(ctx, currentRows, pids);
  renderPidLabel(ctx, pids);
}

function renderSlotPlaceholders(ctx, pids) {
  for (let i = 0; i < 2; i++) {
    Texture.create("SlotChevron_" + i)
      .texture("jsblock:textures/mnr_chevron.png")
      .pos(BAR_X, slotY(i))
      .size(getBarWidth(pids), ROW_H)
      .color(PLACEHOLDER_COLOR)
      .draw(ctx);
  }
}

function renderHeaders(ctx, pids) {
  let headerColor = 0xCFCFCF;

  Text.create("HdrTrack")
    .text("TRACK")
    .color(headerColor)
    .pos(TRACK_X, HEADER_Y)
    .size(TRACK_W + 4, 6)
    .leftAlign()
    .scaleXY()
    .scale(0.55)
    .bold(true)
    .draw(ctx);

  Text.create("HdrDeparting")
    .text("DEPARTING TRAIN")
    .color(headerColor)
    .pos(BAR_X + 4, HEADER_Y)
    .size(getBarWidth(pids) - 4, 6)
    .leftAlign()
    .scaleXY()
    .scale(0.55)
    .bold(true)
    .draw(ctx);

  Text.create("HdrStatus")
    .text("STATUS")
    .color(headerColor)
    .pos(pids.width - 4, HEADER_Y)
    .size(STATUS_W - 2, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.55)
    .bold(true)
    .draw(ctx);
}

function renderStaticRows(ctx, rows, pids, nowMs) {
  if (rows.length === 0) return;
  let row = rows[0];
  renderRow(ctx, "Row_0", row, pids, slotY(0), 1.0, true, nowMs);
  renderRow(ctx, "Row_1", row, pids, slotY(1), 1.0, false, nowMs);
}

function renderAnimatedRows(ctx, previousRows, currentRows, pids, nowMs, t) {
  let prevRow = previousRows.length > 0 ? previousRows[0] : null;
  let currRow = currentRows.length > 0 ? currentRows[0] : null;

  if (prevRow && (!currRow || prevRow.key !== currRow.key)) {
    renderRow(ctx, "Prev_0", prevRow, pids, slotY(0) - EXIT_OFFSET * t, 1.0 - t, false, nowMs);
    renderRow(ctx, "Prev_1", prevRow, pids, slotY(1) - EXIT_OFFSET * t, 1.0 - t, false, nowMs);
  }

  if (currRow) {
    let sameKey = prevRow && prevRow.key === currRow.key;
    let alpha = sameKey ? 1.0 : t;
    let y0 = sameKey ? slotY(0) : slotY(0) + ENTRY_OFFSET * (1.0 - t);
    let y1 = sameKey ? slotY(1) : slotY(1) + ENTRY_OFFSET * (1.0 - t);
    renderRow(ctx, "Current_0", currRow, pids, y0, alpha, true, nowMs);
    renderRow(ctx, "Current_1", currRow, pids, y1, alpha, false, nowMs);
  }
}

function renderRow(ctx, id, row, pids, y, alpha, showStops, nowMs) {
  let barW = getBarWidth(pids);
  let textColor = fadeColor(0xFFFFFF, alpha);
  let dimTextColor = fadeColor(0xD8D8D8, alpha);
  let chevronColor = fadeColor(row.routeColor, alpha);

  Texture.create(id + "_Chevron")
    .texture("jsblock:textures/mnr_chevron.png")
    .pos(BAR_X, y)
    .size(barW, ROW_H)
    .color(chevronColor)
    .draw(ctx);

  Text.create(id + "_Track")
    .text(row.track)
    .color(textColor)
    .pos(TRACK_X, y + 1)
    .size(TRACK_W, 7)
    .leftAlign()
    .scaleXY()
    .scale(0.72)
    .bold(true)
    .draw(ctx);

  Text.create(id + "_Time")
    .text(row.departureText)
    .color(textColor)
    .pos(BAR_X + 4, y + 1)
    .size(22, 7)
    .leftAlign()
    .scaleXY()
    .scale(0.72)
    .bold(true)
    .draw(ctx);

  Text.create(id + "_Dest")
    .text(row.destination)
    .color(textColor)
    .pos(BAR_X + barW - 4, y + 1)
    .size(barW - 52, 7)
    .rightAlign()
    .scaleXY()
    .scale(0.72)
    .bold(true)
    .draw(ctx);

  Text.create(id + "_Status")
    .text(row.status)
    .color(textColor)
    .pos(pids.width - 4, y + 1)
    .size(STATUS_W - 2, 7)
    .rightAlign()
    .scaleXY()
    .scale(0.65)
    .bold(true)
    .draw(ctx);

  if (showStops && row.stopsText.length > 0) {
    Text.create(id + "_Stops")
      .text(scrollText(row.stopsText, barW - 8, nowMs))
      .color(dimTextColor)
      .pos(BAR_X + 4, STOPS_Y)
      .size(barW - 8, 6)
      .leftAlign()
      .scaleXY()
      .scale(0.6)
      .bold(false)
      .draw(ctx);
  }
}

function renderFallback(ctx, rows, pids) {
  if (rows.length > 0) return;

  Text.create("NoTrains")
    .text("NO TRAINS")
    .color(0xFFFFFF)
    .pos(BAR_X + 5, TOP_ROW_Y + 2)
    .size(getBarWidth(pids) - 8, 7)
    .leftAlign()
    .scaleXY()
    .scale(0.72)
    .bold(true)
    .draw(ctx);
}

function renderPidLabel(ctx, pids) {
  Text.create("PID")
    .text(PID_ID)
    .color(0x8A8A8A)
    .pos(pids.width - 2, pids.height - 8)
    .size(32, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.8)
    .bold(true)
    .draw(ctx);
}

function getDisplayRows(pids, nowMs) {
  let fallback = null;

  for (let i = 0; i < SEARCH_ROWS; i++) {
    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let row = buildRow(arrival, nowMs);
    if (!fallback) fallback = row;
    if (row.secsToDeparture >= -45) return [row];
  }

  return fallback ? [fallback] : [];
}

function buildRow(arrival, nowMs) {
  let departureMs = arrival.departureTime();
  let departureDate = new Date(departureMs);
  let secsToDeparture = Math.floor((departureMs - nowMs) / 1000);
  let minsToDeparture = Math.floor(secsToDeparture / 60);
  let routeColor = arrival.routeColor ? arrival.routeColor() : 0xFFFFFF;
  let track = arrival.platformName && arrival.platformName() ? arrival.platformName() : "--";
  let destination = arrival.destination && arrival.destination() ? arrival.destination() : "TBD";
  let status = "0 MIN";

  if (arrival.cancelled && arrival.cancelled()) status = "CANCELLED";
  else if (arrival.delayed && arrival.delayed()) status = "DELAYED";
  else if (secsToDeparture < 0 && secsToDeparture >= -90) status = "AT STATION";
  else if (minsToDeparture >= 1) status = minsToDeparture + " MIN";

  return {
    key: buildRowKey(arrival, departureMs, destination, track),
    departureText: departureDate.getHours().toString().padStart(2, "0") + ":" +
      departureDate.getMinutes().toString().padStart(2, "0"),
    destination: destination,
    routeColor: routeColor,
    secsToDeparture: secsToDeparture,
    status: status,
    stopsText: getStopsText(arrival),
    track: track
  };
}

function getStopsText(arrival) {
  let route = arrival.route && arrival.route();
  if (!route) return "";

  let platforms = route.getPlatforms();
  let stops = [];
  for (let i = 0; i < platforms.size(); i++) {
    stops.push(platforms.get(i).getStationName());
  }
  return stops.join(" • ");
}

function scrollText(text, pixelWidth, nowMs) {
  if (!text) return "";

  let visibleChars = Math.max(10, Math.floor(pixelWidth / 6));
  if (text.length <= visibleChars) return text;

  let spacer = "   •   ";
  let loop = text + spacer;
  let repeated = loop + loop;
  let offset = Math.floor(nowMs / SCROLL_STEP_MS) % loop.length;
  return repeated.substring(offset, offset + visibleChars);
}

function buildRowKey(arrival, departureMs, destination, track) {
  let routeId = arrival.routeId && arrival.routeId() ? arrival.routeId() : "";
  return departureMs + "|" + destination + "|" + track + "|" + routeId;
}

function sameRowKeys(a, b) {
  if (!a) a = [];
  if (!b) b = [];
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i].key !== b[i].key) return false;
  }
  return true;
}

function cloneRows(rows) {
  let copy = [];
  for (let i = 0; i < rows.length; i++) {
    copy.push({
      key: rows[i].key,
      departureText: rows[i].departureText,
      destination: rows[i].destination,
      routeColor: rows[i].routeColor,
      secsToDeparture: rows[i].secsToDeparture,
      status: rows[i].status,
      stopsText: rows[i].stopsText,
      track: rows[i].track
    });
  }
  return copy;
}

function findRowIndex(rows, key) {
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].key === key) return i;
  }
  return -1;
}

function getBarWidth(pids) {
  return pids.width - BAR_X - STATUS_W - 4;
}

function slotY(index) {
  return index === 0 ? TOP_ROW_Y : BOTTOM_ROW_Y;
}

function fadeColor(color, factor) {
  let clamped = clamp(factor, 0, 1);
  let r = Math.floor(((color >> 16) & 255) * clamped);
  let g = Math.floor(((color >> 8) & 255) * clamped);
  let b = Math.floor((color & 255) * clamped);
  return (r << 16) | (g << 8) | b;
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function clamp(value, minValue, maxValue) {
  return Math.max(minValue, Math.min(maxValue, value));
}

function dispose(ctx, state, pids) {}
