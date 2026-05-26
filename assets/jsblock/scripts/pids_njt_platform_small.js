include(Resources.id("jsblock:scripts/pids_util.js"));

const WIDTH = 186;
const HEIGHT = 60;
const MAX_ROWS = 2;
const ROW_HEIGHT = 14;
const START_Y = 32;
const PID_ID = "PID-6-23";
const ANIM_DURATION = 700;  // ms — duration of fade + slide animation
const SLIDE_AMOUNT = 10;    // px — rows slide up from this offset on entry

function create(ctx, state, pids) {
  state.firstDepTime = null;  // departure time of the first-listed train
  state.animStartMs = 0;      // timestamp when the last departure-triggered animation began
}

function render(ctx, state, pids) {

  // --- Background ---
  Texture.create("Background")
    .texture("jsblock:textures/njt_bg_small.png")
    .size(WIDTH, HEIGHT)
    .draw(ctx);

  // --- Clock ---
  let now = new Date();
  let nowMs = Date.now();
  let hh = now.getHours().toString().padStart(2, "0");
  let mm = now.getMinutes().toString().padStart(2, "0");
  let timeStr = hh + ":" + mm;

  Text.create("Clock")
    .text(timeStr)
    .color(0xFFFFFF)
    .size(50, 16)
    .pos(WIDTH - 2, 2)
    .scaleXY()
    .rightAlign()
    .scale(1.0)
    .draw(ctx);

  // --- Station name ---
  const stationObj = pids.station();
  const stationName = stationObj ? stationObj.getName() : "Unknown Station";

  Text.create("HeaderStation")
    .text(stationName)
    .color(0xFFFFFF)
    .pos(2, 2)
    .size(250, 16)
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  // --- Departure detection: trigger one-shot animation when the first train changes ---
  let firstArr = pids.arrivals().get(0);
  let currentFirstDepTime = firstArr ? firstArr.departureTime() : null;

  if (state.firstDepTime !== null && state.firstDepTime !== currentFirstDepTime) {
    // First train has left — start the entry animation for the new pair
    state.animStartMs = nowMs;
  }
  state.firstDepTime = currentFirstDepTime;

  let elapsed = nowMs - state.animStartMs;
  let inAnim = state.animStartMs > 0 && elapsed < ANIM_DURATION;
  let animT = inAnim ? elapsed / ANIM_DURATION : 1.0;  // 0→1 during animation

  // Returns baseRgb with animation alpha blended in; passthrough when animation is done.
  // Alpha 0 in existing non-animated calls renders as opaque — untouched after animation.
  function fadeColor(baseRgb) {
    if (!inAnim) return baseRgb;
    let alpha = Math.round(animT * 255);
    return ((alpha * 0x1000000) + (baseRgb & 0x00FFFFFF)) | 0;
  }

  // --- Rows ---
  for (let i = 0; i < MAX_ROWS; i++) {

    let rowY = START_Y + i * ROW_HEIGHT;

    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let arrMs = arrival.arrivalTime();
    let depMs = arrival.departureTime();

    let secsToDep = Math.floor((depMs - nowMs) / 1000);
    let minsToDep = Math.floor(secsToDep / 60);
    let minsToArr = Math.ceil(Math.max(0, (arrMs - nowMs) / 60000));

    // Slide: rows start slightly below their target and rise into place
    let slideOffset = inAnim ? Math.round((1 - animT) * SLIDE_AMOUNT) : 0;
    let drawY = rowY + slideOffset;
    let drawCenterY = drawY + ROW_HEIGHT * 0.5;

    // --- Row background ---
    Texture.create("RowBG_" + i)
      .texture("jsblock:textures/njt_template.png")
      .pos(0, drawY)
      .size(WIDTH, ROW_HEIGHT)
      .color(fadeColor(arrival.routeColor()))
      .draw(ctx);

    // --- DEP time ---
    let depDate = new Date(depMs);
    let depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
                 depDate.getMinutes().toString().padStart(2, "0");

    Text.create("DEP_" + i)
      .text(depStr)
      .pos(11.5, drawCenterY)
      .size(45, 6)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(fadeColor(0xFFFFFF))
      .draw(ctx);

    // --- Destination ---
    Text.create("TO_" + i)
      .text(arrival.destination())
      .pos(51.5, drawCenterY)
      .size(45, 8)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(fadeColor(0xFFFFFF))
      .draw(ctx);

    // --- Line name ---
    Text.create("LINE_" + i)
      .text(arrival.routeName())
      .pos(104, drawCenterY)
      .size(30, 8)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(fadeColor(0xFFFFFF))
      .draw(ctx);

    // --- Track (shown when train is close) ---
    let showTK = minsToArr <= 3 || minsToDep < 6 || (secsToDep >= 0 && secsToDep <= 30);

    if (showTK && arrival.platformName()) {
      Text.create("TK_" + i)
        .text(arrival.platformName())
        .pos(135, drawCenterY)
        .size(10, 8)
        .scaleXY()
        .centerAlign()
        .scale(1.0)
        .color(fadeColor(0xFFFFFF))
        .draw(ctx);
    }

    // --- Status ---
    // Countdown (minutes to arrival) → BOARDING (train at platform) → FINAL CALL (last 10 s)
    let status;

    if (arrival.cancelled && arrival.cancelled()) {
      status = "CANCELLED";
    }
    else if (arrival.delayed && arrival.delayed()) {
      status = "DELAYED";
    }
    else if (secsToDep >= 0 && secsToDep <= 10) {
      status = "FINAL CALL";
    }
    else if (nowMs >= arrMs) {
      // Train has arrived at the platform
      status = "BOARDING";
    }
    else {
      // Countdown in whole minutes until arrival
      status = minsToArr + " MIN";
    }

    Text.create("STATUS_" + i)
      .text(status)
      .pos(165, drawCenterY)
      .size(25, 8)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(fadeColor(0xFFFFFF))
      .draw(ctx);
  }
}

function dispose(ctx, state, pids) {}