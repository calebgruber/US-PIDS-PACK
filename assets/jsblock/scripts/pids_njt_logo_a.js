include(Resources.id("jsblock:scripts/pids_util.js"));

const PID_ID = "NJT-STATIC-1";

function create(ctx, state, pids) {}

function render(ctx, state, pids) {

  // --- Background ---
  Texture.create("Background")
    .texture("jsblock:textures/njt_bg1.png")
    .size(pids.width, pids.height)
    .draw(ctx);

  // --- Clock ---
  let now = new Date();
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

  // --- Station name ---
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
}

function dispose(ctx, state, pids) {}
