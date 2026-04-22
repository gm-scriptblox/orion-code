const express = require("express");
const fetch   = require("node-fetch");
const path    = require("path");
const crypto  = require("crypto");

const app  = express();
const PORT = process.env.PORT || 3000;

const SYSTEM = `You are Orion-Code, an expert AI assistant specializing in Roblox scripting and Lua programming.

Who you are:
- Your name is Orion-Code.
- You were built to help Roblox developers of all skill levels — from beginners to advanced scripters.
- You have deep knowledge of Roblox Studio, Lua 5.1, the Roblox API, game design patterns, and exploit scripting.

What you can do:
- Write complete, working Roblox LocalScripts, Scripts, and ModuleScripts on request.
- Debug Lua code and explain what went wrong.
- Explain Roblox concepts like RemoteEvents, BindableEvents, Datastores, Pathfinding, GUIs, physics, and more.
- Help with math problems, algebra, geometry, and general calculations.
- Answer general knowledge questions on any topic.
- Give advice on game design, optimization, and best practices.

How you respond:
- Always be concise and clear.
- When writing scripts, wrap them in a Lua code block using triple backticks.
- Explain what your code does after writing it.
- If someone asks who you are, tell them you are Orion-Code, a Roblox scripting AI assistant.
- Be friendly, direct, and helpful.`;

const EXPIRY = 20 * 60 * 1000;
const sessions = new Map();

function getSession(id) {
  const s = sessions.get(id);
  if (!s) return null;
  if (Date.now() - s.lastActive > EXPIRY) {
    sessions.delete(id);
    return null;
  }
  s.lastActive = Date.now();
  return s;
}

function createSession() {
  const id = crypto.randomUUID();
  sessions.set(id, { history: [], lastActive: Date.now() });
  return id;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.lastActive > EXPIRY) sessions.delete(id);
  }
}, 60 * 1000);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function askAI(userMessage, history = []) {
  const messages = [
    { role: "system", content: SYSTEM },
    ...history,
    { role: "user", content: userMessage }
  ];

  const url = "https://text.pollinations.ai/" + encodeURIComponent(userMessage)
    + "?model=openai"
    + "&system=" + encodeURIComponent(SYSTEM)
    + "&messages=" + encodeURIComponent(JSON.stringify(messages));

  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const text = await response.text();
  return text.trim() || "No response received.";
}

app.get("/api", async (req, res) => {
  if (req.query.prompt && req.query.prompt.trim()) {
    try {
      let history = [];
      if (req.query.history) {
        try { history = JSON.parse(req.query.history); } catch {}
      }
      const text = await askAI(req.query.prompt.trim(), history);
      return res.type("text/plain").send(text);
    } catch (err) {
      return res.status(500).type("text/plain").send("Error: " + err.message);
    }
  }

  const origin = `https://${req.get("host")}`;

  res.type("text/html").send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Orion-Code — API Docs</title>
<link href="https://fonts.googleapis.com/css2?family=Oxanium:wght@700;800&family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#07080f;color:#c8d8ff;font-family:'Share Tech Mono',monospace;min-height:100vh;padding:48px 24px}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 60% 40% at 20% 10%,rgba(0,212,255,0.07) 0,transparent 65%),radial-gradient(ellipse 50% 50% at 85% 90%,rgba(123,77,255,0.06) 0,transparent 65%);pointer-events:none}
  .wrap{max-width:720px;margin:0 auto;position:relative;z-index:1}
  .back{display:inline-flex;align-items:center;gap:6px;margin-bottom:28px;font-size:.72rem;color:#3a4a6a;border:1px solid #1a1f38;padding:5px 14px;border-radius:6px;text-decoration:none;transition:color .2s,border-color .2s}
  .back:hover{color:#00d4ff;border-color:rgba(0,212,255,0.3)}
  .logo{font-family:'Oxanium',sans-serif;font-size:2rem;font-weight:800;letter-spacing:.1em;background:linear-gradient(90deg,#00d4ff,#7b4dff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:4px}
  .sub{font-size:.7rem;color:#3a4a6a;letter-spacing:.18em;text-transform:uppercase;margin-bottom:36px}
  h2{font-size:.72rem;color:#00d4ff;letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px;margin-top:30px}
  p{font-size:.8rem;color:#8090b8;line-height:1.8;margin-bottom:10px}
  .block{background:#0d0f1e;border:1px solid #1a1f38;border-radius:8px;overflow:hidden;margin-bottom:10px}
  .block-head{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #1a1f38}
  .block-body{padding:12px 16px;font-size:.78rem;color:#8090b8;line-height:1.7}
  .block-body strong{color:#c8d8ff}
  .badge{padding:3px 9px;border-radius:4px;font-size:.65rem;font-weight:700;flex-shrink:0}
  .get{background:rgba(0,212,255,0.12);color:#00d4ff;border:1px solid rgba(0,212,255,0.25)}
  .post{background:rgba(123,77,255,0.12);color:#a07aff;border:1px solid rgba(123,77,255,0.25)}
  .url{font-size:.78rem;color:#c8d8ff;word-break:break-all}
  .url span{color:#00d4ff}
  pre{background:#060810;border:1px solid #1a1f38;border-left:3px solid #00d4ff;border-radius:6px;padding:14px 16px;font-size:.74rem;color:#a8e6ff;line-height:1.7;overflow-x:auto;margin-bottom:10px;white-space:pre}
  .ex-link{display:block;padding:10px 16px;background:#0d0f1e;border:1px solid #1a1f38;border-radius:8px;color:#7b4dff;font-size:.74rem;text-decoration:none;word-break:break-all;transition:border-color .2s,color .2s;margin-bottom:7px}
  .ex-link:hover{border-color:#7b4dff;color:#a07aff}
  .about{background:#0d0f1e;border:1px solid #1a1f38;border-left:3px solid #7b4dff;border-radius:8px;padding:18px 20px;margin-top:10px}
  .about p{margin:0;color:#8090b8;font-size:.78rem;line-height:1.9}
  .about strong{color:#c8d8ff}
  .tag{display:inline-block;padding:2px 8px;background:rgba(0,212,255,0.08);border:1px solid rgba(0,212,255,0.2);border-radius:4px;color:#00d4ff;font-size:.65rem;margin:2px}
  a{color:#00d4ff;text-decoration:none}
  a:hover{text-decoration:underline}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="${origin}">← Back to Orion-Code</a>
  <div class="logo">ORION-CODE</div>
  <div class="sub">API Reference</div>
  <h2>Endpoints</h2>
  <div class="block">
    <div class="block-head">
      <span class="badge get">GET</span>
      <span class="url">${origin}/api?prompt=<span>{prompt}</span></span>
    </div>
    <div class="block-body">Returns <strong>raw plain text</strong>. Pass your prompt as a query parameter.</div>
  </div>
  <div class="block">
    <div class="block-head">
      <span class="badge post">POST</span>
      <span class="url">${origin}/api</span>
    </div>
    <div class="block-body">Send JSON body <strong>{ "prompt": "..." }</strong> — returns <strong>{ "reply": "...", "sessionId": "..." }</strong>. Pass <strong>sessionId</strong> back on the next request to keep chat history. Sessions expire after 20 minutes of inactivity.</div>
  </div>
  <h2>cURL</h2>
<pre>curl "${origin}/api?prompt=Who+are+you"

curl -X POST "${origin}/api" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Write a Roblox kill script"}'

curl -X POST "${origin}/api" \\
  -H "Content-Type: application/json" \\
  -d '{"prompt":"Make it shorter","sessionId":"your-session-id"}'</pre>
  <h2>Python</h2>
<pre>import requests

session_id = None
while True:
    prompt = input("You: ")
    res = requests.post("${origin}/api", json={"prompt": prompt, "sessionId": session_id})
    data = res.json()
    session_id = data["sessionId"]
    print("Orion-Code:", data["reply"])</pre>
  <h2>JavaScript</h2>
<pre>let sessionId = null;
async function chat(prompt) {
  const res = await fetch("${origin}/api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, sessionId })
  });
  const data = await res.json();
  sessionId = data.sessionId;
  return data.reply;
}</pre>
  <h2>Try It</h2>
  <a class="ex-link" href="${origin}/api?prompt=Who+are+you">${origin}/api?prompt=Who+are+you</a>
  <a class="ex-link" href="${origin}/api?prompt=Write+a+Roblox+kill+script">${origin}/api?prompt=Write+a+Roblox+kill+script</a>
  <a class="ex-link" href="${origin}/api?prompt=Explain+RemoteEvents">${origin}/api?prompt=Explain+RemoteEvents</a>
  <a class="ex-link" href="${origin}/api?prompt=What+is+2+%2B+2">${origin}/api?prompt=What+is+2+%2B+2</a>
  <h2>About Orion-Code</h2>
  <div class="about">
    <p>
      <strong>Orion-Code</strong> is a Roblox scripting AI assistant built on <strong>text.pollinations.ai</strong>. It stays in character on every request — always responding as Orion-Code.
      <br><br>
      <span class="tag">Write Roblox scripts</span>
      <span class="tag">Debug Lua code</span>
      <span class="tag">Explain Roblox API</span>
      <span class="tag">Teach scripting concepts</span>
      <span class="tag">Solve math</span>
      <span class="tag">Answer anything</span>
      <br><br>
      Main interface → <a href="${origin}">${origin}</a>
    </p>
  </div>
</div>
</body>
</html>`);
});

app.post("/api", async (req, res) => {
  const prompt    = req.body?.prompt;
  const sessionId = req.body?.sessionId;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: "prompt is required." });
  }

  let session;
  let id;

  if (sessionId) {
    session = getSession(sessionId);
    id = sessionId;
  }

  if (!session) {
    id = createSession();
    session = getSession(id);
  }

  try {
    const reply = await askAI(prompt.trim(), session.history);
    session.history.push({ role: "user",      content: prompt.trim() });
    session.history.push({ role: "assistant", content: reply });
    res.json({ reply, sessionId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/:sessionId", (req, res) => {
  const session = getSession(req.params.sessionId);
  if (!session) return res.status(404).type("text/plain").send("Session not found or expired.");
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((req, res) => {
  res.status(404).type("text/plain").send("404 — Not found");
});

app.listen(PORT, () => {
  console.log(`Orion-Code running → https://localhost:${PORT}`);
});
