const URL = "https://teachablemachine.withgoogle.com/models/zW6nFqWic/";

let model, webcam;
let isRunning = false;
let lastGesture = "";

// 🔥 nuovo: stato memoria
let state = "stop";

const song = document.getElementById("song");
const statusText = document.getElementById("status");

// 🔓 unlock audio
document.body.addEventListener("click", async () => {
  try {
    await song.play();
    song.pause();
    song.currentTime = 0;
  } catch (e) {}
}, { once: true });


async function init() {

  if (isRunning) return;
  isRunning = true;

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";

  model = await tmImage.load(modelURL, metadataURL);

  webcam = new tmImage.Webcam(300, 300, true);
  await webcam.setup();
  await webcam.play();

  const container = document.getElementById("webcam-container");
  container.innerHTML = "";
  container.appendChild(webcam.canvas);

  window.requestAnimationFrame(loop);
}


async function loop() {
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}


async function predict() {

  const prediction = await model.predict(webcam.canvas);

  let best = prediction[0];

  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > best.probability) {
      best = prediction[i];
    }
  }

  const gesture = best.className;
  const confidence = best.probability;

  if (confidence < 0.85) return; // 🔥 più tollerante
  if (gesture === lastGesture && gesture !== "nothing") return;

  lastGesture = gesture;

  console.log("GESTURE:", gesture, confidence);


  // ▶ PLAY
  if (gesture === "play") {
    song.play().catch(()=>{});
    state = "play";
    statusText.innerText = "PLAY ▶";
  }

  // ⏸ PAUSE
  if (gesture === "pause") {
    song.pause();
    state = "pause";
    statusText.innerText = "PAUSA ⏸";
  }

  // ⏹ STOP
  if (gesture === "stop") {
    song.pause();
    song.currentTime = 0;
    state = "stop";
    statusText.innerText = "STOP ⏹";
  }

  // 🙈 NOTHING INTELLIGENTE
  if (gesture === "nothing") {

    if (state === "play") {
      song.play().catch(()=>{});
      statusText.innerText = "PLAY (hold) ▶";
    }

    if (state === "pause") {
      song.pause();
      statusText.innerText = "PAUSA (hold) ⏸";
    }

    if (gesture === "stop") {
      song.pause();
      song.currentTime = 0;
      state = "stop";
      statusText.innerText = "STOP ⏹";
    }
  }
}