const apiKey = "sk_c1a28ad18d1e3f6e673da31372044b7e7527115dbbf9080f";
const voiceId = "pNInz6obpgDQGcFmaJgB";

async function test() {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: "hello world",
      model_id: "eleven_turbo_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });
  if (!res.ok) {
    console.error("Failed:", res.status, await res.text());
  } else {
    console.log("Success! Got bytes:", (await res.arrayBuffer()).byteLength);
  }
}
test();
