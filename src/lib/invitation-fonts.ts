let fontsPromise: Promise<string[]> | undefined;

export function invitationFonts() {
  if (!fontsPromise) {
    fontsPromise = Promise.all(
      ["regular", "italic", "light", "light-italic"].map(async (style) => {
        const response = await fetch("/fonts/cormorant-garamond-" + style + ".ttf");
        if (!response.ok) throw new Error("Não foi possível carregar a fonte do convite.");
        const bytes = new Uint8Array(await response.arrayBuffer());
        let binary = "";
        for (let offset = 0; offset < bytes.length; offset += 8192)
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
        return btoa(binary);
      }),
    ).catch((error) => {
      fontsPromise = undefined;
      throw error;
    });
  }
  return fontsPromise;
}
