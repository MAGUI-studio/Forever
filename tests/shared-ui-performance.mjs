import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const jsx = { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) };
const icons = { Loader2: "Loader2", Check: "Check" };
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/app/admin/UploadProgress.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText,
  { exports, require: (name) => (name === "lucide-react" ? icons : jsx) },
);
const originalProgress = {
  single:
    '<div className="space-y-1.5 pt-1">\n          <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#722F37)]">\n            <span className="flex items-center gap-1.5 font-medium">\n              <Loader2 size={12} className="animate-spin" />\n              {isUploading\n                ? "Enviando foto para a nuvem…"\n                : isAutoSaving\n                  ? "Salvando alterações no site…"\n                  : "Atualizando foto…"}\n            </span>\n            <span className="font-semibold">\n              {isUploading ? `${progress}%` : <Check size={13} />}\n            </span>\n          </div>\n          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]">\n            <div\n              className="h-full rounded-full bg-[var(--forever-primary,#722F37)] transition-all duration-300"\n              style={{ width: isUploading ? `${progress}%` : "100%" }}\n            />\n          </div>\n        </div>',
  gallery:
    '<div className="mt-4 space-y-2">\n              <div className="flex items-center justify-between text-xs text-[var(--forever-primary,#722F37)]">\n                <span className="flex items-center gap-1.5 font-medium">\n                  <Loader2 size={13} className="animate-spin" />\n                  {isUploading\n                    ? "Enviando fotos para a nuvem…"\n                    : isAutoSaving\n                      ? "Salvando alterações automaticamente no site…"\n                      : "Atualizando galeria…"}\n                </span>\n                <span className="font-semibold">\n                  {isUploading ? `${progress}%` : <Check size={14} />}\n                </span>\n              </div>\n              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--forever-sand,#EFECE6)]">\n                <div\n                  className="h-full rounded-full bg-[var(--forever-primary,#722F37)] transition-all duration-300"\n                  style={{ width: isUploading ? `${progress}%` : "100%" }}\n                />\n              </div>\n            </div>',
};
for (const variant of ["single", "gallery"]) {
  const expected = {};
  vm.runInNewContext(
    ts.transpileModule(
      "exports.render = (isUploading,isAutoSaving,progress) => (" +
        originalProgress[variant] +
        ");",
      { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } },
    ).outputText,
    { exports: expected, ...icons, require: () => jsx },
  );
  for (const isUploading of [false, true])
    for (const isAutoSaving of [false, true])
      for (const progress of [0, 37, 100])
        assert.equal(
          JSON.stringify(exports.UploadProgress({ variant, isUploading, isAutoSaving, progress })),
          JSON.stringify(expected.render(isUploading, isAutoSaving, progress)),
        );
}
console.log(
  "OK shared upload component exactly matches both previous render trees across all progress states",
);
const formatters = {};
let numberCreations = 0,
  dateCreations = 0;
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/utils.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  {
    exports: formatters,
    require: (name) => (name === "clsx" ? { clsx: () => "" } : { twMerge: () => "" }),
    Intl: {
      NumberFormat: function (...args) {
        numberCreations++;
        return new Intl.NumberFormat(...args);
      },
      DateTimeFormat: function (...args) {
        dateCreations++;
        return new Intl.DateTimeFormat(...args);
      },
    },
  },
);
for (let i = 0; i < 100; i++) {
  for (const value of [0, -1, 30, 1990, 1.234, NaN, Infinity])
    assert.equal(
      formatters.formatCurrency(value),
      new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value),
    );
  for (const date of ["2026-10-16T00:00:00Z", "2026-01-01T02:00:00Z", "2000-02-29"])
    assert.equal(
      formatters.formatDateBR(date),
      new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(date)),
    );
}
assert.throws(
  () => formatters.formatDateBR("invalid"),
  (e) => e.name === "RangeError",
);
assert.equal(numberCreations, 1);
assert.equal(dateCreations, 1);
console.log(
  "OK 1000 formatting comparisons preserve currency/date output while creating each Intl formatter only once",
);
