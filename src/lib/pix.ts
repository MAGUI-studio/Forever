interface PixPayloadParams {
  pixKey: string;
  receiverName: string;
  city: string;
  amount?: number;
  description?: string;
  txId?: string;
}

function sanitizeText(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .slice(0, maxLength);
}

function formatEMVField(id: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${id}${length}${value}`;
}

function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePixPayload({
  pixKey,
  receiverName,
  city,
  amount,
  description = "Presente de Casamento",
  txId = "***",
}: PixPayloadParams): string {
  const cleanKey = pixKey.trim();
  const cleanName = sanitizeText(receiverName, 25) || "NOIVOS";
  const cleanCity = sanitizeText(city, 15) || "BRASIL";
  const cleanDesc = sanitizeText(description, 25);
  const cleanTxId = sanitizeText(txId, 25) || "***";

  const guiField = formatEMVField("00", "br.gov.bcb.pix");
  const keyField = formatEMVField("01", cleanKey);
  const descField = cleanDesc ? formatEMVField("02", cleanDesc) : "";
  const merchantAccountInfo = formatEMVField("26", `${guiField}${keyField}${descField}`);

  const txIdField = formatEMVField("05", cleanTxId);
  const additionalDataField = formatEMVField("62", txIdField);

  let payload = [
    formatEMVField("00", "01"),
    formatEMVField("01", "12"),
    merchantAccountInfo,
    formatEMVField("52", "0000"),
    formatEMVField("53", "986"),
  ].join("");

  if (amount && amount > 0) {
    const formattedAmount = amount.toFixed(2);
    payload += formatEMVField("54", formattedAmount);
  }

  payload += [
    formatEMVField("58", "BR"),
    formatEMVField("59", cleanName),
    formatEMVField("60", cleanCity),
    additionalDataField,
    "6304",
  ].join("");

  const crc = calculateCRC16(payload);
  return `${payload}${crc}`;
}
