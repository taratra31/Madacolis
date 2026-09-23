import QRCode from "qrcode";
import { appConfig } from "../config/index.js";

/** Génère un QR code scannable (image PNG data URL) qui ouvre la page de suivi public du colis. */
export async function shipmentQrDataUrl(trackingNumber: string, width = 320): Promise<string> {
  const trackUrl = `${appConfig.frontendUrl}/suivi?code=${encodeURIComponent(trackingNumber)}`;
  try {
    return await QRCode.toDataURL(trackUrl, {
      type: "image/png",
      errorCorrectionLevel: "M",
      margin: 1,
      width,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
  } catch {
    return "";
  }
}