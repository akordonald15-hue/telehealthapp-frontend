// Branding follows the backend cutover; recovery namespaces remain unchanged.
export function campaignBrand(code?: string) {
  return code === "CARE50"
    ? { publicCode: "CARE50", campaignName: "50 Free Consultations" }
    : { publicCode: "FOUNDER50", campaignName: "Founder50" };
}
