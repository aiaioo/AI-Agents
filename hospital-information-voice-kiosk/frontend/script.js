/**
 * Main application script for Gemini Live API Demo
 * Handles UI interactions, media streaming, and communication with Gemini API
 */

// System prompt for the hospital information kiosk
const HOSPITAL_SYSTEM_PROMPT = `You are the voice assistant for a hospital information kiosk, standing in the hospital lobby. Patients and their families speak to you directly, often while stressed, in a hurry, or unwell. Many speak a regional Indian language and may have limited literacy.

LANGUAGE
- Detect the language the person is speaking (Hindi, English, or another Indian regional language) and reply in that same language.
- If they switch languages mid-conversation, switch with them.
- Use simple, everyday words. Avoid medical jargon and English loanwords when a common local-language term exists.

WHAT YOU HELP WITH
1. Doctor availability and schedules (which doctors are in today, their specialty, timing).
2. Directions to departments, rooms, wards, labs, pharmacy, billing, and restrooms.
3. General information about hospital services (what a department does, how to register, visiting hours, documents to bring).
4. Approximate costs or billing/insurance procedures, when that information has been provided to you.
5. Helping a patient understand the *structure* of a report or prescription in plain language — for example, explaining what a section heading means, or that a prescription lists medicine name, dosage, and timing — without interpreting the actual medical findings.
6. Recording feedback or complaints: listen, acknowledge, ask for enough detail to log it (their name/contact if they're willing, department, and issue), and confirm it has been noted.

STRICT SAFETY BOUNDARIES — YOU ARE NOT A CLINICIAN
- Never diagnose a condition, interpret lab or scan results as normal/abnormal, recommend or adjust medication or dosage, or give clinical advice. Always say a doctor or nurse needs to review it, and offer to help them find one.
- If someone describes symptoms that sound like a medical emergency (chest pain, severe bleeding, difficulty breathing, loss of consciousness, stroke signs, etc.), immediately tell them to alert hospital staff or go to the Emergency department right now — do not continue a normal conversation first.
- Do not guess at or repeat back sensitive personal medical details beyond what's needed to route them to the right place or log their feedback.

ACCURACY
- Only state specific facts — doctor names, timings, room numbers, prices — that have actually been given to you in this conversation or via a tool/function result. Never invent or guess them.
- If you don't have the information, say so plainly and offer to connect them with a staff member at the help desk, rather than making something up.

VOICE STYLE
- Your replies are spoken aloud, not read. Keep responses short — one or two sentences per turn — clear, and warm. Confirm understanding before moving on to something new.

HOSPITAL LAYOUT
- The information desk is to the left of the front door just as you step inside the hospital.
- The outpatient department (OPD) is on the ground floor in hall 2.
- The pharmacy is outside the hospital on the right of the entrance.
- The labs are on the first floor.
- Doctor names and room numbers are listed on the board just opposite the information desk.
- The toilets are at the back of the hospital near the back door.
`;

// Global state
const state = {
  client: null,
  audio: { streamer: null, player: null, isStreaming: false },
  video: { streamer: null, isStreaming: false },
  user: { speaking: false, animationId: null },
  ai: { speaking: false, animationId: null },
};

// DOM element cache
const elements = {};

// Initialize DOM references
function initDOM() {
  const ids = [
    //"model",
    //"systemInstructions",
    //"enableInputTranscription",
    //"enableOutputTranscription",
    //"enableGrounding",
    //"enableAlertTool",
    //"enableCssStyleTool",
    //"voiceSelect",
    //"temperature",
    //"temperatureValue",
    //"disableActivityDetection",
    //"silenceDuration",
    //"prefixPadding",
    //"endSpeechSensitivity",
    //"startSpeechSensitivity",
    //"activityHandling",
    "connectionStatus",
    "startAudioBtn",
    "videoPreview",
    "volume",
    "volumeValue",
    //"chatInput",
    //"sendBtn",
    "debugInfo",
    "setupJsonSection",
    "setupJsonDisplay",
    "userSpeakingContainer",
    "userAudioViz",
    "aiSpeakingContainer",
    "aiAudioViz",
  ];

  ids.forEach((id) => {
    elements[id] = document.getElementById(id);
  });
}

// Update status display
function updateStatus(elementId, text) {
  if (elements[elementId]) {
    elements[elementId].textContent = text;
  }
}

// Connect to Gemini
async function connect() {
  try {
    updateStatus("connectionStatus", "Fetching ephemeral token...");

  //elements["model"] = 'gemini-3.1-flash-live-preview';
  //elements["systemInstructions"] = 'You are a helpful assistant. Be concise and friendly.';
  //elements["enableInputTranscription"] = true;
  //elements["enableOutputTranscription"] = false;
  //elements["enableGrounding"] = false;
  //elements["enableAlertTool"] = false;
  //elements["enableCssStyleTool"] = false;
  //elements["voiceSelect"] = "Puck";
  //elements["temperature"] = "1.0";
  //elements["temperatureValue"] = "1.0";
  //elements["disableActivityDetection"] = false;
  //elements["silenceDuration"] = "500";
  //elements["prefixPadding"] = "500";
  //elements["endSpeechSensitivity"] = "END_SENSITIVITY_UNSPECIFIED";
  //elements["startSpeechSensitivity"] = "START_SENSITIVITY_UNSPECIFIED";
  //elements["activityHandling"] = "ACTIVITY_HANDLING_UNSPECIFIED";

    // Fetch token from backend
    const response = await fetch("/api/token", { method: "POST" });
    if (!response.ok) {
      throw new Error(`Failed to fetch token: ${response.statusText}`);
    }
    const { token } = await response.json();
    const model = 'gemini-3.1-flash-live-preview'; //elements.model.value;

    updateStatus("connectionStatus", "Connecting...");

    // Create GeminiLiveAPI instance
    state.client = new GeminiLiveAPI(token, model);

    // Configure settings
    state.client.systemInstructions = HOSPITAL_SYSTEM_PROMPT; //elements.systemInstructions.value;
    state.client.inputAudioTranscription = true;
      //elements.enableInputTranscription.checked;
    state.client.outputAudioTranscription = true;
      //elements.enableOutputTranscription.checked;
    state.client.googleGrounding = false; //elements.enableGrounding.checked;
    state.client.responseModalities = ["AUDIO"];
    state.client.voiceName = 'Puck'; //elements.voiceSelect.value;
    state.client.temperature = 1.0; //parseFloat(elements.temperature.value);

    // Set automatic activity detection configuration
    state.client.automaticActivityDetection = {
      disabled: false, //elements.disableActivityDetection.checked,
      silence_duration_ms: 500, // parseInt(elements.silenceDuration.value),
      prefix_padding_ms: 500, // parseInt(elements.prefixPadding.value),
      end_of_speech_sensitivity: "END_SENSITIVITY_UNSPECIFIED", //elements.endSpeechSensitivity.value,
      start_of_speech_sensitivity: "START_SENSITIVITY_UNSPECIFIED", //elements.startSpeechSensitivity.value,
    };

    // Set activity handling
    state.client.activityHandling = "ACTIVITY_HANDLING_UNSPECIFIED"; //elements.activityHandling.value;

    // Add custom tools only if Google grounding is disabled
    const isGroundingEnabled = false; //elements.enableGrounding.checked;

    if (!isGroundingEnabled) {
      // Add alert tool if enabled
      //if (elements.enableAlertTool.checked) {
      //  const alertTool = new ShowAlertTool();
      //  state.client.addFunction(alertTool);
      //  console.log("✅ Alert tool enabled");
      //}

      // Add CSS style tool if enabled
      //if (elements.enableCssStyleTool.checked) {
      //  const cssStyleTool = new AddCSSStyleTool();
      //  state.client.addFunction(cssStyleTool);
      //  console.log("✅ CSS style tool enabled");
      //}
    } else {
      console.log(
        "⚠️ Custom tools disabled due to Google grounding being enabled"
      );
    }

    // Set callbacks
    state.client.onReceiveResponse = handleMessage;
    state.client.onError = handleError;
    state.client.onOpen = handleOpen;
    state.client.onClose = handleClose;

    await state.client.connect();

    // Initialize media handlers
    state.audio.streamer = new AudioStreamer(state.client);
    state.video.streamer = new VideoStreamer(state.client);
    state.audio.player = new AudioPlayer();
    await state.audio.player.init();

    updateStatus("debugInfo", "Connected successfully");
  } catch (error) {
    console.error("Connection failed:", error);
    updateStatus("connectionStatus", "Connection failed: " + error.message);
    updateStatus("debugInfo", "Error: " + error.message);
  }
}

// Disconnect
function disconnect() {
  if (state.client && state.client.webSocket) {
    state.client.webSocket.close();
    state.client = null;
  }

  // Stop all streams
  if (state.audio.streamer) state.audio.streamer.stop();
  if (state.video.streamer) state.video.streamer.stop();

  // Reset states
  state.audio.isStreaming = false;
  state.video.isStreaming = false;

  // Update UI
  updateStatus("connectionStatus", "Disconnected");

  elements.startAudioBtn.classList.remove("active");
  elements.startAudioBtn.title = "Start microphone";

  elements.videoPreview.srcObject = null;
}

// Input audio visualization (microphone → Gemini)
function startInputVisualization() {
  if (state.user.speaking) return;
  state.user.speaking = true;
  elements.userSpeakingContainer.style.display = "flex";

  const canvas = elements.userAudioViz;
  const ctx = canvas.getContext("2d");
  const analyser = state.audio.streamer && state.audio.streamer.analyserNode;
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  const barCount = 32;
  const barSpacing = 2;
  const barWidth = (canvas.width - barSpacing * (barCount - 1)) / barCount;

  function draw() {
    state.user.animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < barCount; i++) {
      const binIndex = Math.floor((i / barCount) * (bufferLength * 0.75));
      const amplitude = dataArray[binIndex] / 255;
      const barHeight = Math.max(3, amplitude * canvas.height);

      const x = i * (barWidth + barSpacing);
      const y = (canvas.height - barHeight) / 2;

      // Green gradient based on amplitude
      const green = Math.round(157 + amplitude * 55);
      const alpha = 0.5 + amplitude * 0.5;
      ctx.fillStyle = `rgba(15, ${green}, 88, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }

  draw();
}

function stopInputVisualization() {
  if (state.user.animationId) {
    cancelAnimationFrame(state.user.animationId);
    state.user.animationId = null;
  }
  state.user.speaking = false;
  elements.userSpeakingContainer.style.display = "none";

  const canvas = elements.userAudioViz;
  if (canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Output audio visualization (Gemini → speaker)
function startAudioVisualization() {
  if (state.ai.speaking) return;
  state.ai.speaking = true;
  elements.aiSpeakingContainer.style.display = "flex";

  const canvas = elements.aiAudioViz;
  const ctx = canvas.getContext("2d");
  const analyser = state.audio.player && state.audio.player.analyserNode;
  if (!analyser) return;

  const bufferLength = analyser.frequencyBinCount; // fftSize / 2 = 128
  const dataArray = new Uint8Array(bufferLength);
  const barCount = 32;
  const barSpacing = 2;
  const barWidth = (canvas.width - barSpacing * (barCount - 1)) / barCount;

  function draw() {
    state.ai.animationId = requestAnimationFrame(draw);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < barCount; i++) {
      // Sample frequency bins spread across the useful range (skip the top bins)
      const binIndex = Math.floor((i / barCount) * (bufferLength * 0.75));
      const amplitude = dataArray[binIndex] / 255;
      const barHeight = Math.max(3, amplitude * canvas.height);

      const x = i * (barWidth + barSpacing);
      const y = (canvas.height - barHeight) / 2;

      // Blue gradient based on amplitude
      const blue = Math.round(200 + amplitude * 55);
      const alpha = 0.5 + amplitude * 0.5;
      ctx.fillStyle = `rgba(66, 133, ${blue}, ${alpha})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, 2);
      ctx.fill();
    }
  }

  draw();
}

function stopAudioVisualization() {
  if (state.ai.animationId) {
    cancelAnimationFrame(state.ai.animationId);
    state.ai.animationId = null;
  }
  state.ai.speaking = false;
  elements.aiSpeakingContainer.style.display = "none";

  // Clear canvas
  const canvas = elements.aiAudioViz;
  if (canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Handle messages
function handleMessage(message) {
  updateStatus("debugInfo", `Message: ${message.type}`);

  switch (message.type) {
    case MultimodalLiveResponseType.TEXT:
      addMessage(message.data);
      break;

    case MultimodalLiveResponseType.AUDIO:
      if (state.audio.player) {
        state.audio.player.play(message.data);
        startAudioVisualization();
      }
      break;

    case MultimodalLiveResponseType.INPUT_TRANSCRIPTION:
      console.log("Input transcription:", message.data);
      if (!message.data.finished) {
        addMessage(message.data.text);
      }
      break;

    case MultimodalLiveResponseType.OUTPUT_TRANSCRIPTION:
      console.log("Output transcription:", message.data);
      if (!message.data.finished) {
        addMessage(message.data.text);
      }
      break;

    case MultimodalLiveResponseType.SETUP_COMPLETE:
      console.log("Setup complete:", message.data);
      addMessage("Ready!");

      // Display the setup JSON
      //if (state.client && state.client.lastSetupMessage) {
      //  elements.setupJsonDisplay.textContent = JSON.stringify(
      //    state.client.lastSetupMessage,
      //    null,
      //    2
      //  );
      //  elements.setupJsonSection.style.display = "block";
      //}
      break;

    case MultimodalLiveResponseType.TOOL_CALL:
      console.log("🛠️ Tool call received: ", message.data);
      const functionCalls = message.data.functionCalls;
      const functionResponses = [];
      for (let index = 0; index < functionCalls.length; index++) {
        const functionCall = functionCalls[index];
        const functionName = functionCall.name;
        const functionCallId = functionCall.id;
        const parameters = functionCall.args;
        console.log(
          `Calling function ${functionName} with parameters: ${JSON.stringify(
            parameters
          )}`
        );
        let result;
        try {
          result = state.client.callFunction(functionName, parameters);
          functionResponses.push({
            id: functionCallId,
            name: functionName,
            response: { result: result ?? "ok" },
          });
        } catch (err) {
          console.error(`Error calling function ${functionName}:`, err);
          functionResponses.push({
            id: functionCallId,
            name: functionName,
            response: { error: err.message },
          });
        }
      }
      // Send all function responses back to the API
      state.client.sendToolResponse(functionResponses);
      break;

    case MultimodalLiveResponseType.TURN_COMPLETE:
      console.log("Turn complete:", message.data);
      updateStatus("debugInfo", "Turn complete");
      stopAudioVisualization();
      break;

    case MultimodalLiveResponseType.INTERRUPTED:
      console.log("Interrupted");
      addMessage("[Interrupted]");
      if (state.audio.player) state.audio.player.interrupt();
      stopAudioVisualization();
      break;
  }
}

// Connection handlers
function handleOpen() {
  updateStatus("connectionStatus", "Connected");
}

function handleClose() {
  updateStatus("connectionStatus", "Disconnected");
  disconnect();
}

function handleError(error) {
  console.error("Error:", error);
  updateStatus("connectionStatus", "Error: " + error);
  updateStatus("debugInfo", "Error: " + error);
}

// Toggle audio (also starts/stops the camera alongside the microphone)
async function toggleAudio() {
  if (!state.audio.isStreaming) {
    try {
      await connect();
      await state.audio.streamer.start();
      state.audio.isStreaming = true;
      elements.startAudioBtn.classList.add("active");
      elements.startAudioBtn.title = "Stop microphone";
      addMessage("[Microphone on]");
      startInputVisualization();

      try {
        if (!state.video.streamer && state.client) {
          state.video.streamer = new VideoStreamer(state.client);
        }
        const video = await state.video.streamer.start({
          fps: 1,
          width: 640,
          height: 480,
        });
        state.video.isStreaming = true;
        elements.videoPreview.srcObject = video.srcObject;
      } catch (videoError) {
        console.error("Failed to start camera:", videoError);
      }
    } catch (error) {
      addMessage("[Audio error: " + error.message + "]");
    }
  } else {
    stopInputVisualization();
    if (state.audio.streamer) state.audio.streamer.stop();
    state.audio.isStreaming = false;
    elements.startAudioBtn.classList.remove("active");
    elements.startAudioBtn.title = "Start microphone";
    addMessage("[Microphone off]");
    disconnect();
  }
}

// Send message
function sendMessage() {
  const message = elements.chatInput.value.trim();
  if (!message) return;

  if (state.client) {
    addMessage(message);
    state.client.sendTextMessage(message);
    elements.chatInput.value = "";
  } else {
    addMessage("[Connect to Gemini first]");
  }
}

// Show a fleeting status message (overwrites, does not accumulate)
function addMessage(text) {
  updateStatus("connectionStatus", text);
}

// Update volume
function updateVolume() {
  const value = elements.volume.value;
  const volume = value / 100;
  if (state.audio.player) {
    state.audio.player.setVolume(volume);
  }
  updateStatus("volumeValue", value + "%");
}

// Update temperature display
function updateTemperature() {
  const value = elements.temperature.value;
  updateStatus("temperatureValue", value);
}

// Event listeners
function initEventListeners() {
  elements.startAudioBtn.addEventListener("click", toggleAudio);
  //elements.sendBtn.addEventListener("click", sendMessage);
  elements.volume.addEventListener("input", updateVolume);
  //elements.temperature.addEventListener("input", updateTemperature);

  //elements.chatInput.addEventListener("keypress", (e) => {
  //  if (e.key === "Enter") sendMessage();
  //});
}

// Initialize
window.addEventListener("DOMContentLoaded", () => {
  initDOM();
  initEventListeners();
  updateStatus("debugInfo", "Application initialized");
});
