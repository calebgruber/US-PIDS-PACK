include(Resources.id("jsblock:scripts/pids_util.js"));

const PID_ID = "MNR-A";
const FONT_REG = "jsblock:font/mnr_font_reg.ttf";
const FONT_BOLD = "jsblock:font/mnr_font_bold.ttf";
const HEADER_H = 13;
const TRACK_X = 3;
const TRACK_W = 22;
const BAR_X = 26;
const STATUS_W = 28;
const TOP_ROW_Y = 14;
const TOP_ROW_H = 18;
const BOTTOM_ROW_Y = 38;
const BOTTOM_ROW_H = 8;
const TRANSITION_MS = 700;
const SCROLL_STEP_MS = 180;
const ENTRY_OFFSET = 4;
const EXIT_OFFSET = 5;
const SEARCH_ROWS = 8;

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
    renderFallback(ctx, currentRows, pids);
    return;
  }

  let progress = clamp(elapsed / TRANSITION_MS, 0, 1);
  let eased = easeInOut(progress);

  renderAnimatedRows(ctx, previousRows, currentRows, pids, nowMs, eased);
}

function renderStaticRows(ctx, rows, pids, nowMs) {
  for (let i = 0; i < rows.length && i < 2; i++) {
    renderRow(ctx, "Row_" + i, rows[i], pids, slotY(i), 1.0, i === 0, nowMs);
  }
}

function renderAnimatedRows(ctx, previousRows, currentRows, pids, nowMs, t) {
  for (let i = 0; i < previousRows.length && i < 2; i++) {
    let previousRow = previousRows[i];
    if (findRowIndex(currentRows, previousRow.key) >= 0) continue;

    renderRow(
      ctx,
      "Prev_" + i,
      previousRow,
      pids,
      slotY(i) - EXIT_OFFSET * t,
      1.0 - t,
      false,
      nowMs
    );
  }

  for (let i = 0; i < currentRows.length && i < 2; i++) {
    let row = currentRows[i];
    let previousIndex = findRowIndex(previousRows, row.key);
    let y = slotY(i);
    let alpha = 1.0;

    if (previousIndex >= 0 && previousIndex !== i) {
      y = lerp(slotY(previousIndex), slotY(i), t);
      alpha = 0.65 + 0.35 * t;
    } else if (previousIndex < 0) {
      y = slotY(i) + ENTRY_OFFSET * (1.0 - t);
      alpha = t;
    }

    renderRow(ctx, "Current_" + i, row, pids, y, alpha, i === 0, nowMs);
  }
}

function renderRow(ctx, id, row, pids, y, alpha, showStops, nowMs) {
  let barW = pids.width - BAR_X - STATUS_W - 3;
  let rowHeight = showStops ? TOP_ROW_H : BOTTOM_ROW_H;
  let mainTextY = showStops ? y + 3 : y + 2;
  let trackColor = fadeColor(0xF2F2F2, alpha);
  let textColor = fadeColor(0xFFFFFF, alpha);
  let stopColor = fadeColor(0xD9D9D9, alpha);
  let chevronColor = fadeColor(row.routeColor, alpha);

  Texture.create(id + "_Chevron")
    .texture("jsblock:textures/mnr_chevron.png")
    .pos(BAR_X, y)
    .size(barW, rowHeight)
    .color(chevronColor)
    .draw(ctx);

  Text.create(id + "_Track")
    .text(row.track)
    .color(trackColor)
    .pos(TRACK_X, mainTextY)
    .size(TRACK_W, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);

  Text.create(id + "_Time")
    .text(row.departureText)
    .color(textColor)
    .pos(BAR_X + 4, mainTextY)
    .size(23, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);

  Text.create(id + "_Dest")
    .text(row.destination)
    .color(textColor)
    .pos(BAR_X + 28, mainTextY)
    .size(barW - 31, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);

  Text.create(id + "_Status")
    .text(row.status)
    .color(textColor)
    .pos(pids.width - 3, mainTextY)
    .size(STATUS_W - 1, 7)
    .rightAlign()
    .scaleXY()
    .scale(1.0)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);

  if (showStops && row.stopsText.length > 0) {
    Text.create(id + "_Stops")
      .text(scrollText(row.stopsText, barW - 12, nowMs))
      .color(stopColor)
      .pos(BAR_X + 4, y + 11)
      .size(barW - 8, 6)
      .leftAlign()
      .scaleXY()
      .scale(0.82)
      .bold(false)
      .font(FONT_REG)
      .draw(ctx);
  }
}

function renderFallback(ctx, rows, pids) {
  if (rows.length > 0) return;

  Text.create("NoTrains")
    .text("NO TRAINS")
    .color(0xFFFFFF)
    .pos(BAR_X + 4, TOP_ROW_Y + 10)
    .size(pids.width - BAR_X - 8, 8)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);

  Text.create("PID")
    .text(PID_ID)
    .color(0x8A8A8A)
    .pos(pids.width - 2, pids.height - 8)
    .size(32, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.8)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);
}

function getDisplayRows(pids, nowMs) {
  let upcoming = [];
  let fallback = [];

  for (let i = 0; i < SEARCH_ROWS; i++) {
    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let row = buildRow(arrival, nowMs);
    if (fallback.length < 2) fallback.push(row);
    if (row.secsToDeparture >= -45 && upcoming.length < 2) upcoming.push(row);
    if (fallback.length >= 2 && upcoming.length >= 2) break;
  }

  if (upcoming.length === 0) return fallback;
  if (upcoming.length === 1 && fallback.length > 1 && fallback[1].key !== upcoming[0].key) {
    upcoming.push(fallback[1]);
  }

  return upcoming.slice(0, 2);
}

function buildRow(arrival, nowMs) {
  let departureMs = arrival.departureTime();
  let departureDate = new Date(departureMs);
  let secsToDeparture = Math.floor((departureMs - nowMs) / 1000);
  let minsToDeparture = Math.floor(secsToDeparture / 60);
  let routeColor = arrival.routeColor ? arrival.routeColor() : 0xFFFFFF;
  let track = arrival.platformName && arrival.platformName() ? arrival.platformName() : "--";
  let destination = arrival.destination && arrival.destination() ? arrival.destination() : "TBD";
  let status = "ON TIME";

  if (arrival.cancelled && arrival.cancelled()) status = "CANCELLED";
  else if (arrival.delayed && arrival.delayed()) status = "DELAYED";
  else if (secsToDeparture >= 0 && secsToDeparture <= 30) status = "BOARDING";
  else if (secsToDeparture < 0 && secsToDeparture >= -90) status = "AT STATION";
  else if (minsToDeparture >= 1 && minsToDeparture <= 59) status = minsToDeparture + " MIN";

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

  let visibleChars = Math.max(12, Math.floor(pixelWidth / 4));
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
