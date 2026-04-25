import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parseTutorialData } from "../src/tutorial/steps-data";

const name = process.argv[2];
if (!name) {
  console.error(
    "用法:tsx scripts/generate-tutorial-voiceover.ts <video-name> [...filterIds]",
  );
  console.error("例:tsx scripts/generate-tutorial-voiceover.ts tutorial-ch2");
  process.exit(1);
}
const STEPS_PATH = join("public", "screenshots", name, "steps.json");
if (!existsSync(STEPS_PATH)) {
  console.error(`找不到 steps.json:${STEPS_PATH}`);
  process.exit(1);
}
const tutorialJson = JSON.parse(readFileSync(STEPS_PATH, "utf-8"));

function loadEnv() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnv();

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error("❌ Missing GOOGLE_API_KEY in .env");
  process.exit(1);
}

const MODEL = "gemini-2.5-flash-preview-tts";
const VOICE = "Aoede"; // 女聲偏旋律感,教學片清晰
const OUTPUT_DIR = join("public", "voiceover", name);

type ClipToRender = { id: string; text: string };

const data = parseTutorialData(tutorialJson);
const clips: ClipToRender[] = [];
if (data.intro?.voiceover) {
  clips.push({ id: "intro", text: data.intro.voiceover });
}
for (const step of data.steps) {
  if (step.voiceovers) {
    step.voiceovers.forEach((text, i) => {
      clips.push({ id: `${step.id}-p${i + 1}`, text });
    });
  }
}
if (clips.length === 0) {
  console.error("❌ 沒有任何 voiceover 腳本 (intro 或 step.voiceover 都沒填)");
  process.exit(1);
}

function pcmToWav(
  pcm: Buffer,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16,
): Buffer {
  const byteRate = (sampleRate * channels * bitsPerSample) / 8;
  const blockAlign = (channels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const fileSize = 36 + dataSize;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(fileSize, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcm]);
}

async function generate(clip: ClipToRender): Promise<number> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: clip.text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  };
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS failed for ${clip.id}: ${response.status}\n${errText}`);
  }
  const json = (await response.json()) as {
    candidates?: {
      content?: { parts?: { inlineData?: { data: string } }[] };
    }[];
  };
  const audioB64 = json.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioB64) {
    console.error(`❌ Unexpected response for ${clip.id}:`);
    console.error(JSON.stringify(json, null, 2).slice(0, 800));
    throw new Error("No audio in response");
  }
  const pcm = Buffer.from(audioB64, "base64");
  const wav = pcmToWav(pcm);
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = join(OUTPUT_DIR, `${clip.id}.wav`);
  writeFileSync(outPath, wav);
  const seconds = pcm.length / (24000 * 2);
  console.log(
    `✓ ${clip.id}: ${(wav.length / 1024).toFixed(1)} KB (${seconds.toFixed(2)}s) → ${outPath}`,
  );
  return seconds;
}

const filter = process.argv.slice(3);
const toGenerate =
  filter.length > 0 ? clips.filter((c) => filter.includes(c.id)) : clips;

if (toGenerate.length === 0) {
  console.error(`❌ No matching clips for: ${filter.join(", ")}`);
  console.error(`   Available: ${clips.map((c) => c.id).join(", ")}`);
  process.exit(1);
}
console.log(
  `🎙️  Generating tutorial voiceover with voice="${VOICE}" for: ${toGenerate.map((c) => c.id).join(", ")}`,
);

const durationsPath = join(OUTPUT_DIR, "durations.json");
let durations: Record<string, number> = {};
if (existsSync(durationsPath)) {
  durations = JSON.parse(readFileSync(durationsPath, "utf-8"));
}

void (async () => {
  for (const clip of toGenerate) {
    const seconds = await generate(clip);
    durations[clip.id] = seconds;
    if (toGenerate.indexOf(clip) < toGenerate.length - 1) {
      await new Promise((r) => setTimeout(r, 7000));
    }
  }
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(durationsPath, JSON.stringify(durations, null, 2));
  console.log(`\n🎙️  Done — ${toGenerate.length} clip(s) written.`);
})();
