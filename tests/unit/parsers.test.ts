import { describe, it, expect } from "vitest";
import { parseVCF } from "@/lib/utils/vcard";

describe("vCard Parser", () => {
  it("should parse single vCard correctly", () => {
    const vcardText = `
BEGIN:VCARD
VERSION:3.0
FN:Juan Pérez
N:Pérez;Juan;;;
ORG:TechCorp Solutions
TITLE:CTO
TEL;TYPE=CELL:+34600112233
EMAIL;TYPE=PREF,INTERNET:juan.perez@techcorp.example.com
URL:https://techcorp.example.com
END:VCARD
    `.trim();

    const result = parseVCF(vcardText);

    expect(result).toHaveLength(1);
    expect(result[0].display_name).toBe("Juan Pérez");
    expect(result[0].first_name).toBe("Juan");
    expect(result[0].last_name).toBe("Pérez");
    expect(result[0].company_name).toBe("TechCorp Solutions");
    expect(result[0].job_title).toBe("CTO");
    expect(result[0].website).toBe("https://techcorp.example.com");
    expect(result[0].phones).toHaveLength(1);
    expect(result[0].phones[0].phone).toBe("+34600112233");
    expect(result[0].emails).toHaveLength(1);
    expect(result[0].emails[0].email).toBe("juan.perez@techcorp.example.com");
  });

  it("should parse multiple vCards correctly", () => {
    const vcardText = `
BEGIN:VCARD
FN:Juan Pérez
N:Pérez;Juan;;;
END:VCARD
BEGIN:VCARD
FN:María Gómez
N:Gómez;María;;;
END:VCARD
    `.trim();

    const result = parseVCF(vcardText);

    expect(result).toHaveLength(2);
    expect(result[0].display_name).toBe("Juan Pérez");
    expect(result[1].display_name).toBe("María Gómez");
  });

  it("should ignore invalid cards", () => {
    const vcardText = `
INVALID DATA
BEGIN:VCARD
FN:Juan Pérez
END:VCARD
    `.trim();

    const result = parseVCF(vcardText);
    expect(result).toHaveLength(1);
    expect(result[0].display_name).toBe("Juan Pérez");
  });
});
