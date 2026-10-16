import { panelConfig } from "@/lib/panel-config";
import { failure, reply, requireAccess } from "@/lib/guest-server";
import { panelData, panelSections, type PanelSection } from "@/lib/panel-data";
export async function GET(request: Request) {
  try {
    const access = await requireAccess(request);
    const { role, wedding } = access;
    const query = new URL(request.url).searchParams;
    if (query.get("preview") === "frame")
      return reply({
        role,
        wedding: { modules: wedding.modules, plan: wedding.plan, theme: wedding.theme },
      });
    const section = query.get("section");
    if (panelSections.includes(section as PanelSection)) {
      const panel = await panelData(
        access,
        section as PanelSection,
        query.get("invitations") === "1",
      );
      return reply({
        role,
        wedding: {
          slug: wedding.slug,
          status: wedding.status,
          plan: wedding.plan,
          config: panelConfig(wedding.config, section as PanelSection),
          theme: wedding.theme,
          modules: wedding.modules,
          templateId: wedding.templateId,
        },
        panel,
      });
    }
    return reply({ role, wedding });
  } catch (e) {
    return failure(e);
  }
}
