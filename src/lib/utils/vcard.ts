export interface MappedContact {
  display_name: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  job_title?: string;
  website?: string;
  source?: string;
  phones: Array<{ phone: string; type: "work" | "home" | "mobile" | "other"; is_primary: boolean }>;
  emails: Array<{ email: string; type: "work" | "personal" | "other"; is_primary: boolean }>;
}

export function parseVCF(text: string): MappedContact[] {
  const cards = text.split("BEGIN:VCARD");
  const contacts: MappedContact[] = [];

  cards.forEach((card) => {
    if (!card.includes("END:VCARD")) return;
    const lines = card.split(/\r?\n/);
    const contact: any = { phones: [], emails: [] };

    lines.forEach((line) => {
      const clean = line.trim();
      if (clean.startsWith("FN:")) {
        contact.display_name = clean.substring(3).trim();
      } else if (clean.startsWith("N:")) {
        const parts = clean.substring(2).split(";");
        contact.last_name = parts[0] || "";
        contact.first_name = parts[1] || "";
      } else if (clean.startsWith("ORG:")) {
        contact.company_name = clean.substring(4).trim();
      } else if (clean.startsWith("TITLE:")) {
        contact.job_title = clean.substring(6).trim();
      } else if (clean.startsWith("URL:")) {
        contact.website = clean.substring(4).trim();
      } else if (clean.startsWith("TEL;")) {
        const phone = clean.split(":").pop() || "";
        contact.phones.push({ phone, type: "work", is_primary: contact.phones.length === 0 });
      } else if (clean.startsWith("EMAIL;")) {
        const email = clean.split(":").pop() || "";
        contact.emails.push({ email, type: "work", is_primary: contact.emails.length === 0 });
      }
    });

    if (contact.display_name) {
      contacts.push(contact);
    }
  });

  return contacts;
}
