import fs from "node:fs";
import { spawn, spawnSync } from "node:child_process";

process.loadEnvFile(".env");
const key = process.env.STRIPE_SECRET_KEY;
if (!key?.startsWith("sk_test_") && !key?.startsWith("rk_test_")) {
  throw new Error("Este encaminhamento local exige uma chave de teste do Stripe.");
}
const env = { ...process.env, STRIPE_API_KEY: key };
const options = { env, shell: process.platform === "win32", windowsHide: true };
const command = "npm exec --yes --package=@stripe/cli -- stripe listen";
const result = spawnSync(`${command} --print-secret`, { ...options, encoding: "utf8" });
const secret = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.match(/whsec_[A-Za-z0-9]+/)?.[0];
if (result.status !== 0 || !secret)
  throw new Error("Não foi possível iniciar o encaminhamento oficial do Stripe.");
const current = fs.readFileSync(".env", "utf8");
fs.writeFileSync(
  ".env",
  /^STRIPE_WEBHOOK_SECRET=.*$/m.test(current)
    ? current.replace(/^STRIPE_WEBHOOK_SECRET=.*$/m, `STRIPE_WEBHOOK_SECRET=${secret}`)
    : `${current}\nSTRIPE_WEBHOOK_SECRET=${secret}\n`,
);
console.log("Webhook de teste configurado. Encaminhando eventos oficiais para localhost:3001.");
const listener = spawn(
  `${command} --forward-to http://localhost:3001/api/webhooks/stripe --events checkout.session.completed,checkout.session.async_payment_succeeded,checkout.session.async_payment_failed`,
  options,
);
for (const output of [listener.stdout, listener.stderr])
  output.on("data", (chunk) =>
    process.stdout.write(chunk.toString().replace(/whsec_[A-Za-z0-9]+/g, "[segredo configurado]")),
  );
listener.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    listener.kill(signal);
  });
