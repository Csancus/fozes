import { describe, expect, it } from "vitest";
import { createRecurring, runDueRecurring, listExpenses } from "@/lib/data";

describe("Story 10.16 – runDueRecurring párhuzamosan", () => {
  it("AC2: két egyszerre futó oldalbetöltés sem generálja kétszer ugyanazt a hónapot", async () => {
    const hh = "hh-rec-par";
    await createRecurring(hh, {
      amount: 100000,
      merchant: "Albérlet",
      categoryId: null,
      paymentMethodId: null,
      personId: null,
      projectId: null,
      note: "",
      dayOfMonth: 1,
      active: true,
      lastRunPeriod: null,
    } as Parameters<typeof createRecurring>[1]);
    const [a, b] = await Promise.all([runDueRecurring(hh), runDueRecurring(hh)]);
    const list = await listExpenses(hh);
    expect(a + b).toBe(list.length);
    expect(list.length).toBe(1);
    expect(await runDueRecurring(hh)).toBe(0);
  });
});
