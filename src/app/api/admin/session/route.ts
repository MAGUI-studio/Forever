import { failure, reply, requireAccess } from "@/lib/guest-server";
export async function GET(request: Request) {
  try {
    const { role, wedding } = await requireAccess(request);
    return reply({ role, wedding });
  } catch (e) {
    return failure(e);
  }
}
