import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";
import { runtimeEnv } from "@/lib/runtime-env";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  return createRouteHandler({ router: ourFileRouter, config: { token: runtimeEnv("UPLOADTHING_TOKEN") } }).GET(request);
}
export async function POST(request: NextRequest) {
  return createRouteHandler({ router: ourFileRouter, config: { token: runtimeEnv("UPLOADTHING_TOKEN") } }).POST(request);
}
