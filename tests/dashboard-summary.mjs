import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/dashboard-summary.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const reference = new Function(
  "guests",
  "invitations",
  ts.transpileModule(
    'const totalGuests = guests.length;\n  const confirmedGuests = guests.filter((g) => g.status === "confirmado");\n  const pendingGuests = guests.filter((g) => g.status === "pendente");\n  const declinedGuests = guests.filter((g) => g.status === "recusado");\n\n  const confirmedPct =\n    totalGuests > 0 ? Math.round((confirmedGuests.length / totalGuests) * 100) : 0;\n  const pendingPct = totalGuests > 0 ? Math.round((pendingGuests.length / totalGuests) * 100) : 0;\n  const declinedPct = totalGuests > 0 ? Math.round((declinedGuests.length / totalGuests) * 100) : 0;\n\n  const activeInvitations = invitations.filter((i) => i.active);\n  const totalInvites = activeInvitations.length;\n  const sentInvites = activeInvitations.filter((i) => !!i.sentAt).length;\n  const openedInvites = activeInvitations.filter((i) => !!i.openedAt).length;\n  const sentPct = totalInvites > 0 ? Math.round((sentInvites / totalInvites) * 100) : 0;\n\n  const guestMessages: { name: string; message: string }[] = [];\n  activeInvitations.forEach((inv) => {\n    if (inv.personalResponses) {\n      Object.entries(inv.personalResponses).forEach(([guestId, resp]) => {\n        if (resp.message?.trim()) {\n          const g = inv.guests.find((guest) => guest.id === guestId);\n          guestMessages.push({\n            name: g ? g.name : inv.label,\n            message: resp.message.trim(),\n          });\n        }\n      });\n    }\n    if (inv.message?.trim()) {\n      const alreadyAdded = guestMessages.some((m) => m.message === inv.message.trim());\n      if (!alreadyAdded) {\n        guestMessages.push({\n          name: inv.label,\n          message: inv.message.trim(),\n        });\n      }\n    }\n  });\n\n  const dietaryCount = guests.filter((g) => {\n    return activeInvitations.some(\n      (inv) =>\n        inv.personalResponses?.[g.id]?.dietaryRestrictions?.trim() ||\n        (inv.guests.length === 1 && inv.dietaryRestrictions?.trim()),\n    );\n  }).length;\n\nreturn { confirmedGuests, pendingGuests, declinedGuests, confirmedPct, pendingPct, declinedPct, totalInvites, sentInvites, openedInvites, sentPct, guestMessages, dietaryCount };',
    {},
  ).outputText,
);
let seed = 42;
const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const pick = (values) => values[Math.floor(random() * values.length)];
for (let sample = 0; sample < 150; sample++) {
  const invitations = Array.from({ length: sample % 17 }, (_, i) => ({
    active: random() > 0.2,
    label: "Invite " + i,
    sentAt: pick([null, "date"]),
    openedAt: pick([null, "date"]),
    message: pick(["", " Same ", "Other"]),
    dietaryRestrictions: pick(["", " ", "No milk"]),
    guests: Array.from({ length: Math.floor(random() * 5) }, (_, j) => ({
      id: String(j),
      name: "Guest " + i + " " + j,
      status: pick(["confirmado", "pendente", "recusado"]),
    })),
    personalResponses: Object.fromEntries(
      Array.from({ length: Math.floor(random() * 5) }, (_, j) => [
        String(j),
        {
          message: pick(["", " Same ", "Personal"]),
          dietaryRestrictions: pick(["", " ", "No nuts"]),
        },
      ]),
    ),
  }));
  const guests = invitations.filter((i) => i.active).flatMap((i) => i.guests);
  const before = JSON.stringify({ guests, invitations });
  assert.equal(
    JSON.stringify(exports.dashboardSummary(guests, invitations)),
    JSON.stringify(reference(guests, invitations)),
  );
  assert.equal(JSON.stringify({ guests, invitations }), before);
}
console.log(
  "OK dashboard summary matches previous results across 150 datasets, including repeated IDs/messages and dietary responses",
);
