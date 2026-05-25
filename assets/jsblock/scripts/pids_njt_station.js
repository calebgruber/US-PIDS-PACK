include(Resources.id("jsblock:scripts/pids_util.js"));

const MAX_ROWS = 5;
const ROW_HEIGHT = 10.4;
const START_Y = 24;
const PID_ID = "STATION-PIDS";

function create(ctx, state, pids) {}

function render(ctx, state, pids) {

  // --- Background ---
  Texture.create("Background")
    .texture("jsblock:textures/njt_bg.png")
    .size(pids.width, pids.height)
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
    .size(20, 6)
    .pos(pids.width - 2, 2)
    .scaleXY()
    .rightAlign()
    .scale(1.0)
    .draw(ctx);

  // --- Paging setup (fixed: 2 pages, 10 slots total) ---
  const TOTAL_ITEMS = 10;    // try to show up to 10 departures
  const ITEMS_PER_PAGE = 5;  // 5 rows per page
  const TOTAL_PAGES = 2;     // exactly 2 pages

  let pageCycle = Math.floor((nowMs / 10000) % TOTAL_PAGES);
  let page = pageCycle + 1;

  // --- Page indicator (same size as clock) ---
  Text.create("PageInfo")
    .text(page + " of " + TOTAL_PAGES)
    .color(0xFFFFFF)
    .size(20, 6)
    .pos(pids.width / 2, 2)
    .scaleXY()
    .centerAlign()
    .scale(1.0)
    .draw(ctx);

  // --- TID ---
  Text.create("HeaderPID")
    .text(PID_ID)
    .color(0xFFFFFF)
    .size(20, 6)
    .pos(pids.width - 24, 2)
    .scaleXY()
    .rightAlign()
    .scale(1.0)
    .draw(ctx);

  // --- Station name (smaller) ---
  const stationObj = pids.station();
  const stationName = stationObj ? stationObj.getName() : "Unknown Station";

  Text.create("HeaderStation")
    .text(stationName)
    .color(0xFFFFFF)
    .pos(2, 2)
    .size(100, 6)
    .scaleXY()
    .scale(1.0)
    .draw(ctx);

  // --- Paging indices ---
  let startIndex = ITEMS_PER_PAGE * (page - 1); // 0 or 5
  let endIndex = startIndex + ITEMS_PER_PAGE;   // 5 or 10

  // --- Rows ---
  for (let i = startIndex; i < endIndex; i++) {

    let rowIndex = i - startIndex;
    let rowY = START_Y + rowIndex * ROW_HEIGHT;
    let centerY = rowY + ROW_HEIGHT * 0.5;

    let arrival = pids.arrivals().get(i);
    if (!arrival) continue;

    let arrMs = arrival.arrivalTime();
    let depMs = arrival.departureTime();

    let secsToDep = Math.floor((depMs - nowMs) / 1000);
    let minsToDep = Math.floor(secsToDep / 60);
    let minsToArr = Math.floor((arrMs - nowMs) / 60000);

    // --- Row background ---
    Texture.create("RowBG_" + rowIndex)
      .texture("jsblock:textures/njt_template.png")
      .pos(0, rowY)
      .size(pids.width, ROW_HEIGHT)
      .color(arrival.routeColor())
      .draw(ctx);

    // --- DEP ---
    let depDate = new Date(depMs);
    let depStr = depDate.getHours().toString().padStart(2, "0") + ":" +
                 depDate.getMinutes().toString().padStart(2, "0");

    Text.create("DEP_" + rowIndex)
      .text(depStr)
      .pos(9, centerY)
      .size(12, 5)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(0xFFFFFF)
      .draw(ctx);

    // --- TO ---
    Text.create("TO_" + rowIndex)
      .text(arrival.destination())
      .pos(39.5, centerY)
      .size(45, 5)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(0xFFFFFF)
      .draw(ctx);

    // --- LINE ---
    Text.create("LINE_" + rowIndex)
      .text(arrival.routeName())
      .pos(78, centerY)
      .size(30, 5)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(0xFFFFFF)
      .draw(ctx);

    // --- TK (track assignment rules) ---
    let showTK = false;

    if (minsToArr <= 3) showTK = true;
    if (minsToDep < 6) showTK = true;
    if (secsToDep <= 30 && secsToDep >= 0) showTK = true; // boarding + final call window

    if (showTK && arrival.platformName()) {
      Text.create("TK_" + rowIndex)
        .text(arrival.platformName())
        .pos(100, centerY)
        .size(10, 5)
        .scaleXY()
        .centerAlign()
        .scale(1.0)
        .color(0xFFFFFF)
        .draw(ctx);
    }

    // --- STATUS LOGIC ---
    let status = "ON TIME";

    if (arrival.cancelled && arrival.cancelled()) {
      status = "CANCELLED";
    }
    else if (arrival.delayed && arrival.delayed()) {
      status = "DELAYED";
    }
    // BOARDING: 30s → 10s before departure
    else if (secsToDep > 10 && secsToDep <= 30) {
      status = "BOARDING";
    }
    // FINAL CALL: last 10 seconds before departure
    else if (secsToDep >= 0 && secsToDep <= 10) {
      status = "FINAL CALL";
    }
    // IN # MIN: 1–4 minutes
    else if (minsToDep >= 1 && minsToDep < 5) {
      status = "IN " + minsToDep + " MIN";
    }
    // ON TIME: 5–15 minutes
    else if (minsToDep >= 5 && minsToDep <= 15) {
      status = "ON TIME";
    }
    // STAND BY: > 15 minutes
    else if (minsToDep > 15) {
      status = "STAND BY";
    }

    // --- STATUS TEXT ---
    Text.create("STATUS_" + rowIndex)
      .text(status)
      .pos(122.5, centerY)
      .size(25, 5)
      .scaleXY()
      .centerAlign()
      .scale(1.0)
      .color(0xFFFFFF)
      .draw(ctx);
  }
}

function dispose(ctx, state, pids) {}
