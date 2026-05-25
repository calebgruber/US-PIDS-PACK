include(Resources.id("jsblock:scripts/pids_util.js"));

const MAX_ROWS = 4;
const HEADER_H = 11;
const ROW_H = 11;
const START_Y = 14;
const PID_ID = "LED-MTX-A";

function create(ctx, state, pids) {}

function render(ctx, state, pids) {
  let nowMs = Date.now();

  Texture.create("BG")
    .texture("jsblock:textures/black.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  Texture.create("HeaderBG")
    .texture("jsblock:textures/gray.png")
    .pos(1, 1)
    .size(pids.width - 2, HEADER_H - 2)
    .color(0x6B5B72)
    .draw(ctx);

  Text.create("HeaderTime")
    .text("TIME")
    .color(0xE6E6E6)
    .pos(3, 2)
    .size(16, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  Text.create("HeaderDestination")
    .text("DESTINATION")
    .color(0xE6E6E6)
    .pos(30, 2)
    .size(70, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  Text.create("HeaderStatus")
    .text("St.")
    .color(0xE6E6E6)
    .pos(pids.width - 20, 2)
    .size(14, 7)
    .leftAlign()
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  for (let i = 0; i < MAX_ROWS; i++) {
    let rowY = START_Y + i * ROW_H;

    Texture.create("Divider_" + i)
      .texture("jsblock:textures/gray.png")
      .pos(1, rowY - 1)
      .size(pids.width - 2, 1)
      .color(0x353535)
      .draw(ctx);

    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let depMs = arrival.departureTime();
    let secsToDep = Math.floor((depMs - nowMs) / 1000);
    let minsToDep = Math.floor(secsToDep / 60);

    let depDate = new Date(depMs);
    let depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
      depDate.getMinutes().toString().padStart(2, "0");

    let status = "On";
    if (arrival.cancelled && arrival.cancelled()) status = "Cncl";
    else if (arrival.delayed && arrival.delayed()) status = "Dly";
    else if (secsToDep <= 30 && secsToDep >= 0) status = "Board";
    else if (minsToDep >= 1 && minsToDep <= 59) status = minsToDep + "min";

    let track = arrival.platformName() ? arrival.platformName() : "";

    let highlight = false;
    if (secsToDep >= 0 && minsToDep <= 10) highlight = true;
    if (i === 0 && !highlight) highlight = true;

    if (highlight) {
      Texture.create("Focus_" + i)
        .texture("jsblock:textures/gray.png")
        .pos(27, rowY + 1)
        .size(pids.width - 54, ROW_H - 3)
        .color(0xA000C8)
        .draw(ctx);
    }

    Text.create("Time_" + i)
      .text(depStr)
      .color(0xD7D7D7)
      .pos(3, rowY + 2)
      .size(22, 7)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("Dest_" + i)
      .text(arrival.destination())
      .color(0xD7D7D7)
      .pos(30, rowY + 2)
      .size(pids.width - 70, 7)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("Status_" + i)
      .text(status)
      .color(0xD7D7D7)
      .pos(pids.width - 28, rowY + 2)
      .size(18, 7)
      .rightAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("Track_" + i)
      .text(track)
      .color(0xD7D7D7)
      .pos(pids.width - 6, rowY + 2)
      .size(6, 7)
      .rightAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);
  }

  Text.create("FooterPID")
    .text(PID_ID)
    .color(0x666666)
    .pos(pids.width - 2, pids.height - 8)
    .size(40, 6)
    .rightAlign()
    .scaleXY()
    .scale(0.8)
    .draw(ctx);
}

function dispose(ctx, state, pids) {}
