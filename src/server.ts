import { createServer } from "node:http";
import { signupSchema, sendVerification } from "./verification.js";

const server = createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/signup/verify-email") {
    res.writeHead(404).end();
    return;
  }
  try {
    const body = await new Promise<string>((resolve, reject) => {
      let value = "";
      req.on("data", (chunk) => { value += chunk; });
      req.on("end", () => resolve(value));
      req.on("error", reject);
    });
    const input = signupSchema.parse(JSON.parse(body));
    const result = await sendVerification(input);
    res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(result));
  } catch (error) {
    const status = error instanceof SyntaxError || error?.constructor?.name === "ZodError" ? 400 : 502;
    res.writeHead(status, { "Content-Type": "application/json" }).end(JSON.stringify({ error: String(error) }));
  }
});

server.listen(Number(process.env.PORT ?? 3000), () => console.log("verification service listening"));
