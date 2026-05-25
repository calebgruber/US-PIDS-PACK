include(Resources.id("jsblock:scripts/pids_util.js"));

const MAX_ROWS = 4;
const HEADER_H = 13;
const ROW_H = 11;
const START_Y = 14;
const PID_ID = "MNR-A";
const FONT_REG = "jsblock:font/mnr_font_reg.ttf";
const FONT_BOLD = "jsblock:font/mnr_font_bold.ttf";
const TRACK_X = 3;
const TRACK_W = 22;
const BAR_X = 26;
const STATUS_W = 28;

function create(ctx, state, pids) {}

function render(ctx, state, pids) {
  let nowMs = Date.now();

  Texture.create("BG")
    .texture("jsblock:textures/mnr_bg.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  let focusIndex = 0;
  for (let i = 0; i < MAX_ROWS; i++) {
    let a = pids.arrivals().get(i);
    if (!a) continue;
    let secs = Math.floor((a.departureTime() - nowMs) / 1000);
    if (secs >= 0) {
      focusIndex = i;
      break;
    }
  }

  for (let i = 0; i < MAX_ROWS; i++) {
    let rowY = START_Y + i * ROW_H;
    let barW = pids.width - BAR_X - STATUS_W - 3;

    Texture.create("Divider_" + i)
      .texture("jsblock:textures/gray.png")
      .pos(1, rowY - 1)
      .size(pids.width - 2, 1)
      .color(0x242424)
      .draw(ctx);

    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let depMs = arrival.departureTime();
    let depDate = new Date(depMs);
    let depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
      depDate.getMinutes().toString().padStart(2, "0");

    let secsToDep = Math.floor((depMs - nowMs) / 1000);
    let minsToDep = Math.floor(secsToDep / 60);
    let status = "ON TIME";

    if (arrival.cancelled && arrival.cancelled()) status = "CANCELLED";
    else if (arrival.delayed && arrival.delayed()) status = "DELAYED";
    else if (secsToDep >= 0 && secsToDep <= 30) status = "BOARDING";
    else if (secsToDep < 0 && secsToDep >= -90) status = "AT STATION";
    else if (minsToDep >= 1 && minsToDep <= 59) status = minsToDep + " MIN";

    let track = arrival.platformName() ? arrival.platformName() : "";
    let isFocus = i === focusIndex;
    let timeDestColor = isFocus ? 0xFFFFFF : 0x000000;
    let statusColor = 0xFFFFFF;

    if (isFocus) {
      Texture.create("FocusBase_" + i)
        .texture("jsblock:textures/black.png")
        .pos(BAR_X, rowY + 1)
        .size(barW, ROW_H - 3)
        .color(arrival.routeColor())
        .draw(ctx);
      Texture.create("Chevron_" + i)
        .texture("jsblock:textures/mnr_chevron.png")
        .pos(BAR_X, rowY + 1)
        .size(barW, ROW_H - 3)
        .draw(ctx);
    } else {
      Texture.create("Base_" + i)
        .texture("jsblock:textures/black.png")
        .pos(BAR_X, rowY + 1)
        .size(barW, ROW_H - 3)
        .color(0xFFFFFF)
        .draw(ctx);
      Texture.create("Chevron_" + i)
        .texture("jsblock:textures/mnr_chevron.png")
        .pos(BAR_X, rowY + 1)
        .size(barW, ROW_H - 3)
        .color(0x000000)
        .draw(ctx);
    }

    Text.create("Track_" + i)
      .text(track)
      .color(0xFFFFFF)
      .pos(TRACK_X, rowY + 2)
      .size(TRACK_W, 7)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .bold(true)
      .font(FONT_BOLD)
      .draw(ctx);

    Text.create("Time_" + i)
      .text(depStr)
      .color(timeDestColor)
      .pos(BAR_X + 4, rowY + 2)
      .size(23, 7)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .bold(true)
      .font(FONT_BOLD)
      .draw(ctx);

    Text.create("Dest_" + i)
      .text(arrival.destination())
      .color(timeDestColor)
      .pos(BAR_X + 28, rowY + 2)
      .size(barW - 31, 7)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .bold(true)
      .font(FONT_BOLD)
      .draw(ctx);

    Text.create("Status_" + i)
      .text(status)
      .color(statusColor)
      .pos(pids.width - 3, rowY + 2)
      .size(STATUS_W - 1, 7)
      .rightAlign()
      .scaleXY()
      .scale(1.0)
      .bold(false)
      .font(FONT_REG)
      .draw(ctx);

    if (isFocus) {
      let stops = [];
      let route = arrival.route && arrival.route();
      if (route) {
        let platforms = route.getPlatforms();
        for (let j = 0; j < platforms.size() && j < 3; j++) {
          stops.push(platforms.get(j).getStationName());
        }
      }

      if (stops.length > 0) {
        Text.create("Stops_" + i)
          .text(stops.join(" • "))
          .color(0xE6E6E6)
          .pos(3, pids.height - 8)
          .size(pids.width - 6, 6)
          .leftAlign()
          .scaleXY()
          .scale(0.85)
          .bold(false)
          .font(FONT_REG)
          .draw(ctx);
      }
    }
  }

  Text.create("PID")
    .text(PID_ID)
    .color(0x7A7A7A)
    .pos(pids.width - 2, HEADER_H + 1)
    .size(35, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.8)
    .bold(true)
    .font(FONT_BOLD)
    .draw(ctx);
}

function dispose(ctx, state, pids) {}
