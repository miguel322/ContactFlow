import { test, expect } from "@playwright/test";

test.describe("ContactFlow End-to-End User Journey", () => {
  const testEmail = `user-${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const testName = "QA Tester Senior";
  const contactName = "Juan Carlos Valedor";

  test("should complete the full registration, onboarding, contact CRUD, and archiving flow", async ({ page }) => {
    // 1. Register a new user
    await page.goto("/register");
    await page.fill('input[id="name"]', testName);
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for the success banner and direct to login
    await expect(page.locator("text=Registro exitoso")).toBeVisible();
    
    // Bypass email confirmation for tests by directly logging in
    await page.goto("/login");
    await page.fill('input[id="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.click('button[type="submit"]');

    // 2. Onboarding Flow
    await page.waitForURL("**/onboarding");
    await page.fill('input[id="orgName"]', "NexusCorp Quality");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard");
    await expect(page.locator("text=NexusCorp Quality")).toBeVisible();

    // 3. Navigate to contacts creation
    await page.goto("/contacts/new");
    await page.fill('input[name="first_name"]', "Juan Carlos");
    await page.fill('input[name="last_name"]', "Valedor");
    await page.fill('input[name="job_title"]', "Director QA");

    // 4. Add phone and email fields dynamically
    await page.click("text=Añadir teléfono");
    await page.fill('input[name="phones.0.phone"]', "+34600000001");
    
    await page.click("text=Añadir correo");
    await page.fill('input[name="emails.0.email"]', "valedor@example.com");

    await page.click('button[type="submit"]');

    // Wait for redirect to details page
    await page.waitForURL(/\/contacts\/[a-f0-9-]+/);
    await expect(page.locator("h1")).toContainText(contactName);

    // 5. Log a call interaction
    await page.click('button:has-text("Interacciones")');
    await page.selectOption("select", { label: "Llamada" });
    await page.fill('textarea[placeholder*="Escribe un breve resumen"]', "Conversación de prueba E2E. Acepta propuesta.");
    await page.click('button:has-text("Registrar")');
    
    // Verify interaction timeline update
    await expect(page.locator("text=Conversación de prueba E2E")).toBeVisible();

    // 6. Schedule a task reminder
    await page.click('button:has-text("Recordatorios")');
    await page.fill('input[placeholder*="Ej. Enviar cotización"]', "Seguimiento comercial E2E");
    // Format date input
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().substring(0, 16);
    await page.fill('input[type="datetime-local"]', dateString);
    await page.click('button:has-text("Programar")');

    // Verify task is added
    await expect(page.locator("text=Seguimiento comercial E2E")).toBeVisible();

    // 7. Search contact in table
    await page.goto("/contacts");
    await page.fill('input[placeholder*="Buscar contactos"]', "Juan Carlos");
    await page.click("text=Aplicar Filtros");

    // Verify contact row displays
    await expect(page.locator(`text=${contactName}`)).toBeVisible();

    // 8. Select and export contact
    await page.click('input[type="checkbox"] >> nth=1'); // select contact row checkbox
    const downloadPromise = page.waitForEvent("download");
    await page.click('button:has-text("Exportar CSV")');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("contactflow_export");

    // 9. Go to details and archive contact
    await page.click(`text=${contactName}`);
    await page.click('button:has-text("Archivar")');

    // Verify archived state badge
    await expect(page.locator("text=archived")).toBeVisible();
  });
});
