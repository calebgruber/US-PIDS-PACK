include(Resources.id("jsblock:scripts/pids_util.js"));

const WIDTH = 186;
const HEIGHT = 60;
const ROW_HEIGHT = 15;
const PID_ID = "LIRR-LCD-A";

function create(ctx, state, pids) {
  state.lastTrainId = null;
  state.carColors = [];
}

function render(ctx, state, pids) {

  let now = new Date();
  let nowMs = Date.now();

  // Time with seconds + AM/PM
  let hh = now.getHours();
  let mm = now.getMinutes();
  let ss = now.getSeconds();
  let ampm = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;

  let timeStr =
    hh.toString().padStart(2, "0") + ":" +
    mm.toString().padStart(2, "0") + ":" +
    ss.toString().padStart(2, "0") + " " + ampm;

  let stationName = pids.station()?.getName() ?? "Unknown Station";

  // Next train
  let nextTrain = pids.arrivals().get(0);
  let secsToArr = nextTrain ? Math.floor((nextTrain.arrivalTime() - nowMs) / 1000) : null;
  let minsToNext = nextTrain && secsToArr > 0
    ? Math.max(1, Math.ceil(secsToArr / 60))
    : null;

  // Status logic
  let status = "";

  if (!nextTrain) status = "";
  else if (secsToArr <= 0) status = "AT STATION";
  else if (minsToNext >= 1 && minsToNext <= 5) status = "in " + minsToNext + " min";
  else status = "ON TIME";

  // ----------------------------------------------------
  // DO NOT RETURN TO PAGE 1 UNTIL TRAIN LEFT
  // ----------------------------------------------------
  let showPage1 = true;

  if (nextTrain) {
    showPage1 = false;
    if (nowMs > nextTrain.departureTime() + 30000) {
      showPage1 = true;
    }
  }

  let pageCycle = Math.floor((nowMs / 10000) % 2);
  let page = showPage1 ? 1 : pageCycle + 2;

  // Base background
  Texture.create("BG")
    .texture("jsblock:textures/lirr_lcd_bg_blank.png")
    .size(WIDTH, HEIGHT)
    .draw(ctx);

  // -----------------------------
  // PAGE 1 — Station + Clock
  // -----------------------------
  if (page === 1) {

    Text.create("Station")
      .text(stationName)
      .color(0xFFFFFF)
      .pos(93, 8)
      .size(WIDTH - 8, ROW_HEIGHT)
      .centerAlign()
      .scaleXY()
      .scale(1.25)     // BIGGER
      .bold(true)      // BOLDER
      .draw(ctx);

    Text.create("Time")
      .text(timeStr)
      .color(0xFFFFFF)
      .pos(93, 30)
      .size(WIDTH - 8, ROW_HEIGHT)
      .centerAlign()
      .scaleXY()
      .scale(1.25)     // BIGGER
      .bold(true)      // BOLDER
      .draw(ctx);

    return;
  }

  // -----------------------------
  // PAGE 2 — Next train info
  // -----------------------------
  if (page === 2 && nextTrain) {

    Texture.create("BG")
      .texture("jsblock:textures/lirr_lcd_bg_head.png")
      .size(WIDTH, HEIGHT)
      .draw(ctx);

    Texture.create("HeaderTemplate")
      .texture("jsblock:textures/lirr_lcd_template.png")
      .pos(0, 0)
      .size(WIDTH, ROW_HEIGHT)
      .color(nextTrain.routeColor())
      .draw(ctx);

    let arrTime = new Date(nextTrain.arrivalTime());
    let arrStr =
      arrTime.getHours().toString().padStart(2, "0") + ":" +
      arrTime.getMinutes().toString().padStart(2, "0");

    Text.create("HeaderLeft")
      .text(arrStr + "  " + nextTrain.destination())
      .color(0xFFFFFF)
      .pos(4, 1)
      .size(WIDTH / 2, ROW_HEIGHT)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("HeaderRight")
      .text(status)
      .color(0xFFFFFF)
      .pos(WIDTH - 4, 1)
      .size(WIDTH / 2, ROW_HEIGHT)
      .rightAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // -----------------------------
    // CHANGE #1 — MAX 3 STOPS PER LINE
    // -----------------------------
    let stops = [];
    let route = nextTrain.route?.();
    if (route) {
      let platforms = route.getPlatforms();
      for (let i = 0; i < platforms.size(); i++) {
        stops.push(platforms.get(i).getStationName());
      }
    }

    // Group into lines of 3
    let line1 = stops.slice(0, 3).join(", ");
    let line2 = stops.slice(3, 6).join(", ");
    let line3 = stops.slice(6, 9).join(", ");

    let lines = [line1, line2, line3];

    for (let i = 0; i < 3; i++) {
      if (!lines[i]) continue;

      let rowY = ROW_HEIGHT * (i + 1);

      Text.create("StopRow_" + i)
        .text(lines[i])
        .color(0xFFFFFF)
        .pos(4, rowY + 2)
        .size(WIDTH - 8, ROW_HEIGHT)
        .leftAlign()
        .scaleXY()
        .scale(1.0)
        .draw(ctx);
    }

    return;
  }

  // -----------------------------
  // PAGE 3 — Seat availability
  // -----------------------------
  if (page === 3 && nextTrain) {

    Texture.create("BG")
      .texture("jsblock:textures/lirr_lcd_bg_head.png")
      .size(WIDTH, HEIGHT)
      .draw(ctx);

    Texture.create("HeaderTemplate")
      .texture("jsblock:textures/lirr_lcd_template.png")
      .pos(0, 0)
      .size(WIDTH, ROW_HEIGHT)
      .color(nextTrain.routeColor())
      .draw(ctx);

    let arrTime = new Date(nextTrain.arrivalTime());
    let arrStr =
      arrTime.getHours().toString().padStart(2, "0") + ":" +
      arrTime.getMinutes().toString().padStart(2, "0");

    Text.create("HeaderLeft")
      .text(arrStr + "  " + nextTrain.destination())
      .color(0xFFFFFF)
      .pos(4, 1)
      .size(WIDTH / 2, ROW_HEIGHT)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("HeaderRight")
      .text(status)
      .color(0xFFFFFF)
      .pos(WIDTH - 4, 1)
      .size(WIDTH / 2, ROW_HEIGHT)
      .rightAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    Text.create("SeatLabel")
      .text("Seat availability")
      .color(0xFFFFFF)
      .pos(4, ROW_HEIGHT + 2)
      .size(WIDTH - 8, ROW_HEIGHT)
      .leftAlign()
      .scaleXY()
      .scale(1.0)
      .draw(ctx);

    // Regenerate per-box colors if train changed
    let trainId = nextTrain.routeId?.();
    let cars = nextTrain.carCount?.() ?? 6;

    if (trainId !== state.lastTrainId) {
      state.lastTrainId = trainId;
      state.carColors = [];
      for (let i = 0; i < cars; i++) {
        let r = Math.random();
        let color = 0x00FF00;
        if (r > 0.9) color = 0xFF0000;
        else if (r > 0.7) color = 0xFFFF00;
        state.carColors.push(color);
      }
    }

    let boxW = 23;
    let boxH = 16;
    let spacing = 4;
    let totalWidth = cars * boxW + (cars - 1) * spacing;
    let startX = Math.floor((WIDTH - totalWidth - 20) / 2);
    let y = ROW_HEIGHT * 2 + 1;

    for (let i = 0; i < cars; i++) {
      let x = startX + i * (boxW + spacing);

      Texture.create("CarBox_" + i)
        .texture("jsblock:textures/lirr_lcd_template.png")
        .pos(x, y)
        .size(boxW, boxH)
        .color(state.carColors[i])
        .draw(ctx);
    }

    let arrowX = startX + totalWidth + 4;

    Texture.create("Arrow")
      .texture("jsblock:textures/lirr_arrow.png")
      .pos(arrowX, ROW_HEIGHT * 2)
      .size(15, 15)
      .draw(ctx);

      Texture.create("PIDLocation")
      .texture("jsblock:textures/lirr_lcd_template.png")
      .size(WIDTH, ROW_HEIGHT - 6)
      .pos(0, ROW_HEIGHT * 3 + 6)
      .color(0xFFFFFF)
      .draw(ctx);

    return;
  }
}

function dispose(ctx, state, pids) {}
