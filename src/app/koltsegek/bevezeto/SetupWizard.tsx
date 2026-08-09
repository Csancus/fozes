"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { catColor, CAT_HEX, catIcon, payIcon } from "@/lib/expense-visuals";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import type {
  ExpenseCategory,
  IncomeCategory,
  PaymentKind,
  PaymentMethod,
  Person,
} from "@/lib/types";
import { PAYMENT_KIND_LABEL } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  Plus,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

const PALETTE = [
  "sky",
  "emerald",
  "violet",
  "amber",
  "rose",
  "indigo",
  "teal",
  "orange",
  "pink",
  "cyan",
];
const colorAt = (i: number) => PALETTE[i % PALETTE.length];

type AccountRow = {
  id?: string;
  name: string;
  kind: PaymentKind;
  last4: string;
  color: string;
  openingBalance: string;
  forIncome: boolean;
};
type PersonRow = { id?: string; name: string; color: string };
type CatRow = {
  id?: string;
  name: string;
  color: string;
  icon: string;
  keep: boolean;
};

const ACCOUNT_SUGGESTIONS: { name: string; kind: PaymentKind }[] = [
  { name: "Bankkártya", kind: "card" },
  { name: "Bankszámla", kind: "transfer" },
  { name: "Megtakarítás", kind: "transfer" },
  { name: "Céges kártya", kind: "card" },
];

const STEPS = [
  "Bevezető",
  "Számlák",
  "Bevétel",
  "Egyenlegek",
  "Kik költenek",
  "Kategóriák",
  "Kész",
];

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

export function SetupWizard({
  saveAction,
  skipAction,
  paymentMethods,
  persons,
  categories,
  incomeCategories,
  members,
}: {
  saveAction: (fd: FormData) => void | Promise<void>;
  skipAction: () => void | Promise<void>;
  paymentMethods: PaymentMethod[];
  persons: Person[];
  categories: ExpenseCategory[];
  incomeCategories: IncomeCategory[];
  members: { id: string; name: string }[];
}) {
  const [step, setStep] = useState(0);

  const [accounts, setAccounts] = useState<AccountRow[]>(() =>
    paymentMethods.map((p) => ({
      id: p.id,
      name: p.name,
      kind: p.kind,
      last4: p.last4 ?? "",
      color: p.color,
      openingBalance: p.openingBalance ? String(p.openingBalance) : "",
      forIncome: p.forIncome,
    }))
  );
  const [people, setPeople] = useState<PersonRow[]>(() =>
    persons.map((p) => ({ id: p.id, name: p.name, color: p.color }))
  );
  const [cats, setCats] = useState<CatRow[]>(() =>
    categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      keep: true,
    }))
  );
  const [incCats, setIncCats] = useState<CatRow[]>(() =>
    incomeCategories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      icon: c.icon,
      keep: true,
    }))
  );

  const namedAccounts = accounts.filter((a) => a.name.trim());
  const balanceTotal = namedAccounts.reduce(
    (s, a) => s + (Number(a.openingBalance) || 0),
    0
  );

  const payload = useMemo(
    () => ({
      accounts: namedAccounts.map((a) => ({
        id: a.id,
        name: a.name.trim(),
        kind: a.kind,
        last4: a.last4,
        color: a.color,
        openingBalance: Number(a.openingBalance) || 0,
        forIncome: a.forIncome,
      })),
      persons: people
        .filter((p) => p.name.trim())
        .map((p) => ({ id: p.id, name: p.name.trim(), color: p.color })),
      categories: {
        keepIds: cats.filter((c) => c.id && c.keep).map((c) => c.id as string),
        added: cats
          .filter((c) => !c.id && c.name.trim())
          .map((c) => ({ name: c.name.trim(), color: c.color, icon: c.icon })),
      },
      incomeCategories: {
        keepIds: incCats.filter((c) => c.id && c.keep).map((c) => c.id as string),
        added: incCats
          .filter((c) => !c.id && c.name.trim())
          .map((c) => ({ name: c.name.trim(), color: c.color, icon: c.icon })),
      },
    }),
    [namedAccounts, people, cats, incCats]
  );

  const last = STEPS.length - 1;
  const go = (n: number) => {
    setStep(Math.max(0, Math.min(last, n)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  return (
    <div>
      {/* Fejléc: lépés-jelző + kihagyás */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition",
                  i <= step
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-muted)]"
                )}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-[var(--color-muted-foreground)]">
            {step + 1}/{STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <form action={skipAction}>
          <button
            type="submit"
            className="text-xs font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] underline underline-offset-2"
          >
            Kihagyom
          </button>
        </form>
      </div>

      <div className="mt-6">
        {step === 0 && <IntroStep />}

        {step === 1 && (
          <Step
            icon={CreditCard}
            title="Miről költesz?"
            lead="Vedd fel a kártyáidat, számláidat, a készpénzt. Minden tételnél ki tudod majd választani, melyikről ment el a pénz. Bármikor bővíthető."
          >
            <div className="space-y-2">
              {accounts.map((a, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: CAT_HEX[a.color] ?? "#71717a" }}
                    >
                      {(() => {
                        const Icon = payIcon(a.kind);
                        return <Icon className="w-4.5 h-4.5" />;
                      })()}
                    </span>
                    <Input
                      value={a.name}
                      onChange={(e) =>
                        setAccounts((cur) =>
                          cur.map((x, j) =>
                            j === i ? { ...x, name: e.target.value } : x
                          )
                        )
                      }
                      placeholder="pl. OTP bankkártya"
                      className="h-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setAccounts((cur) => cur.filter((_, j) => j !== i))
                      }
                      className="h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10 shrink-0"
                      aria-label="Törlés"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 pl-11">
                    {(["card", "transfer", "cash"] as PaymentKind[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() =>
                          setAccounts((cur) =>
                            cur.map((x, j) => (j === i ? { ...x, kind: k } : x))
                          )
                        }
                        className={cn(
                          "h-8 px-2.5 rounded-lg text-[12px] font-medium border transition",
                          a.kind === k
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                            : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                        )}
                      >
                        {PAYMENT_KIND_LABEL[k]}
                      </button>
                    ))}
                    {a.kind === "card" && (
                      <Input
                        value={a.last4}
                        onChange={(e) =>
                          setAccounts((cur) =>
                            cur.map((x, j) =>
                              j === i
                                ? {
                                    ...x,
                                    last4: e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 4),
                                  }
                                : x
                            )
                          )
                        }
                        placeholder="utolsó 4"
                        inputMode="numeric"
                        className="h-8 w-24 text-[12px]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {ACCOUNT_SUGGESTIONS.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() =>
                    setAccounts((cur) => [
                      ...cur,
                      {
                        name: s.name,
                        kind: s.kind,
                        last4: "",
                        color: colorAt(cur.length),
                        openingBalance: "",
                        forIncome: false,
                      },
                    ])
                  }
                  className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-[var(--color-border)] text-[13px] font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition"
                >
                  <Plus className="w-4 h-4" /> {s.name}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAccounts((cur) => [
                    ...cur,
                    {
                      name: "",
                      kind: "card",
                      last4: "",
                      color: colorAt(cur.length),
                      openingBalance: "",
                      forIncome: false,
                    },
                  ])
                }
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-[var(--color-border)] text-[13px] font-medium hover:bg-[var(--color-muted)] transition"
              >
                <Plus className="w-4 h-4" /> Üres sor
              </button>
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step
            icon={TrendingUp}
            title="Hová érkezik a bevétel?"
            lead="Jelöld be, melyik számlára jön a fizetés vagy egyéb bevétel. A bevétel rögzítésénél ezt fogja felajánlani az app."
          >
            {namedAccounts.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Előbb vegyél fel legalább egy számlát az előző lépésben.
              </p>
            ) : (
              <div className="space-y-2">
                {accounts.map((a, i) =>
                  a.name.trim() ? (
                    <label
                      key={i}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={a.forIncome}
                        onChange={(e) =>
                          setAccounts((cur) =>
                            cur.map((x, j) =>
                              j === i
                                ? { ...x, forIncome: e.target.checked }
                                : x
                            )
                          )
                        }
                        className="h-4 w-4 accent-[var(--color-primary)]"
                      />
                      <span
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                        style={{ background: CAT_HEX[a.color] ?? "#71717a" }}
                      >
                        {(() => {
                          const Icon = payIcon(a.kind);
                          return <Icon className="w-4.5 h-4.5" />;
                        })()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium truncate">
                          {a.name}
                          {a.last4 && (
                            <span className="opacity-60 tabular-nums">
                              {" "}
                              ··{a.last4}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-[var(--color-muted-foreground)]">
                          {PAYMENT_KIND_LABEL[a.kind]}
                        </span>
                      </span>
                    </label>
                  ) : null
                )}
              </div>
            )}
          </Step>
        )}

        {step === 3 && (
          <Step
            icon={Wallet}
            title="Mennyi van most rajtuk?"
            lead="Ha megadod a mai egyenleget, az app onnantól vezeti a számláid állását (kezdő összeg + bevételek − kiadások)."
          >
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] p-3 text-xs text-[var(--color-muted-foreground)]">
              Ez nem kötelező: üresen hagyva a Költségkezelő tisztán
              <strong className="text-[var(--color-foreground)]">
                {" "}
                kiadás-nyilvántartóként{" "}
              </strong>
              működik. Az egyenlegeket később is megadhatod: Beállítások →
              Beállító varázsló.
            </div>
            <div className="mt-3 space-y-2">
              {namedAccounts.length === 0 && (
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Nincs felvett számla.
                </p>
              )}
              {accounts.map((a, i) =>
                a.name.trim() ? (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
                  >
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ background: CAT_HEX[a.color] ?? "#71717a" }}
                    >
                      {(() => {
                        const Icon = payIcon(a.kind);
                        return <Icon className="w-4.5 h-4.5" />;
                      })()}
                    </span>
                    <span className="flex-1 min-w-0 text-sm font-medium truncate">
                      {a.name}
                    </span>
                    <Input
                      value={a.openingBalance}
                      onChange={(e) =>
                        setAccounts((cur) =>
                          cur.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  openingBalance: e.target.value.replace(
                                    /[^\d-]/g,
                                    ""
                                  ),
                                }
                              : x
                          )
                        )
                      }
                      placeholder="0"
                      inputMode="numeric"
                      className="h-10 w-32 text-right tabular-nums"
                    />
                    <span className="text-sm text-[var(--color-muted-foreground)]">
                      Ft
                    </span>
                  </div>
                ) : null
              )}
            </div>
            {balanceTotal !== 0 && (
              <p className="mt-3 text-sm font-medium">
                Összesen: {fmtFt(balanceTotal)}
              </p>
            )}
          </Step>
        )}

        {step === 4 && (
          <Step
            icon={Users}
            title="Ki költ a családban?"
            lead="Vedd fel azokat, akiknek külön szeretnéd látni a kiadásait. Minden tételhez hozzárendelhető, hogy ki költötte."
          >
            <div className="space-y-2">
              {people.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
                    style={{ background: CAT_HEX[p.color] ?? "#71717a" }}
                  >
                    {p.name.trim().slice(0, 2).toUpperCase() || "?"}
                  </span>
                  <Input
                    value={p.name}
                    onChange={(e) =>
                      setPeople((cur) =>
                        cur.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x
                        )
                      )
                    }
                    placeholder="Név"
                    className="h-10"
                  />
                  <button
                    type="button"
                    onClick={() => setPeople((cur) => cur.filter((_, j) => j !== i))}
                    className="h-9 w-9 rounded-xl flex items-center justify-center text-red-600 hover:bg-red-500/10 shrink-0"
                    aria-label="Törlés"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {members
                .filter(
                  (m) =>
                    !people.some(
                      (p) => p.name.trim().toLowerCase() === m.name.toLowerCase()
                    )
                )
                .map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setPeople((cur) => [
                        ...cur,
                        { name: m.name, color: colorAt(cur.length) },
                      ])
                    }
                    className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-dashed border-[var(--color-border)] text-[13px] font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition"
                  >
                    <Plus className="w-4 h-4" /> {m.name}
                  </button>
                ))}
              <button
                type="button"
                onClick={() =>
                  setPeople((cur) => [
                    ...cur,
                    { name: "", color: colorAt(cur.length) },
                  ])
                }
                className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-[var(--color-border)] text-[13px] font-medium hover:bg-[var(--color-muted)] transition"
              >
                <Plus className="w-4 h-4" /> Új személy
              </button>
            </div>
          </Step>
        )}

        {step === 5 && (
          <Step
            icon={Tag}
            title="Kategóriák"
            lead="Ezekbe soroljuk a tételeket. Kapcsold ki, amire nincs szükséged, és vegyél fel sajátot. Később is bármikor módosítható."
          >
            <CategoryPicker
              label="Kiadás-kategóriák"
              rows={cats}
              setRows={setCats}
              placeholder="pl. Autó, Gyerekek, Kisállat"
            />
            <div className="mt-6">
              <CategoryPicker
                label="Bevétel-kategóriák"
                rows={incCats}
                setRows={setIncCats}
                placeholder="pl. Albérlet-bevétel, Osztalék"
              />
            </div>
          </Step>
        )}

        {step === 6 && (
          <Step
            icon={CheckCircle2}
            title="Minden megvan"
            lead="Ezt mented el most. Bármelyik később módosítható a Beállításokban."
          >
            <ul className="space-y-2 text-sm">
              <SummaryRow
                icon={CreditCard}
                label="Számlák, kártyák"
                value={
                  namedAccounts.length
                    ? namedAccounts.map((a) => a.name).join(", ")
                    : "nincs"
                }
              />
              <SummaryRow
                icon={TrendingUp}
                label="Bevétel ide érkezik"
                value={
                  namedAccounts.filter((a) => a.forIncome).length
                    ? namedAccounts
                        .filter((a) => a.forIncome)
                        .map((a) => a.name)
                        .join(", ")
                    : "nincs megjelölve"
                }
              />
              <SummaryRow
                icon={Wallet}
                label="Kezdő egyenleg"
                value={
                  balanceTotal !== 0
                    ? `${fmtFt(balanceTotal)} összesen`
                    : "nem adtad meg (csak kiadás-követés)"
                }
              />
              <SummaryRow
                icon={Users}
                label="Ki költ"
                value={
                  people.filter((p) => p.name.trim()).length
                    ? people
                        .filter((p) => p.name.trim())
                        .map((p) => p.name)
                        .join(", ")
                    : "nincs (nem kötelező)"
                }
              />
              <SummaryRow
                icon={Tag}
                label="Kategóriák"
                value={`${cats.filter((c) => c.keep || !c.id).filter((c) => c.name.trim()).length} kiadás · ${incCats.filter((c) => c.keep || !c.id).filter((c) => c.name.trim()).length} bevétel`}
              />
            </ul>

            <form action={saveAction} className="mt-6">
              <input
                type="hidden"
                name="payload"
                value={JSON.stringify(payload)}
              />
              <SubmitButton size="lg" fullWidth>
                Mentés és indulás
              </SubmitButton>
            </form>

            <Button
              href="/koltsegek/sugo"
              variant="ghost"
              fullWidth
              className="mt-2"
              leftIcon={<HelpCircle className="w-4 h-4" />}
            >
              Előbb inkább elolvasom, hogyan működik
            </Button>
          </Step>
        )}
      </div>

      {/* Léptetés */}
      {step < last && (
        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => go(step - 1)}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Vissza
            </Button>
          )}
          <Button
            type="button"
            size="lg"
            className="flex-1"
            onClick={() => go(step + 1)}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            {step === 0 ? "Kezdjük" : "Tovább"}
          </Button>
        </div>
      )}
      {step === last && (
        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => go(step - 1)}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Vissza
          </Button>
        </div>
      )}
    </div>
  );
}

function IntroStep() {
  return (
    <div>
      <div className="w-14 h-14 rounded-2xl brand-gradient text-white flex items-center justify-center shadow-sm">
        <Sparkles className="w-7 h-7" />
      </div>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Állítsuk be a Költségkezelőt
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        Pár kérdés, kb. egy perc — utána minden tétel felvitele két koppintás.
        Semmi nem végleges, mindent tudsz később módosítani.
      </p>
      <ul className="mt-5 space-y-2.5">
        <IntroRow icon={CreditCard} text="Milyen kártyáidról, számláidról költesz" />
        <IntroRow icon={TrendingUp} text="Melyik számlára érkezik a bevétel" />
        <IntroRow icon={Banknote} text="Mennyi van most a számlákon (nem kötelező)" />
        <IntroRow icon={Users} text="Kik költenek a családban" />
        <IntroRow icon={Tag} text="Milyen kategóriákat használsz" />
      </ul>
    </div>
  );
}

function IntroRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </span>
      <span className="text-sm">{text}</span>
    </li>
  );
}

function Step({
  icon: Icon,
  title,
  lead,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3">
        <span className="w-11 h-11 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" />
        </span>
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
      </div>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{lead}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <Icon className="w-4 h-4 mt-0.5 text-[var(--color-muted-foreground)] shrink-0" />
      <span className="flex-1 min-w-0">
        <span className="block text-xs text-[var(--color-muted-foreground)]">
          {label}
        </span>
        <span className="block font-medium break-words">{value}</span>
      </span>
    </li>
  );
}

function CategoryPicker({
  label,
  rows,
  setRows,
  placeholder,
}: {
  label: string;
  rows: CatRow[];
  setRows: React.Dispatch<React.SetStateAction<CatRow[]>>;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const name = draft.trim();
    if (!name) return;
    setRows((cur) => [
      ...cur,
      { name, color: colorAt(cur.length), icon: "tag", keep: true },
    ]);
    setDraft("");
  }

  return (
    <div>
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {rows.map((c, i) => {
          const col = catColor(c.color);
          const Icon = catIcon(c.icon);
          const on = c.keep;
          return (
            <button
              key={c.id ?? `new-${i}`}
              type="button"
              onClick={() =>
                c.id
                  ? setRows((cur) =>
                      cur.map((x, j) => (j === i ? { ...x, keep: !x.keep } : x))
                    )
                  : setRows((cur) => cur.filter((_, j) => j !== i))
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                on
                  ? cn(col.soft, col.text, "border-transparent")
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] line-through opacity-60"
              )}
              title={c.id ? "Ki/be kapcsolás" : "Eltávolítás"}
            >
              <Icon className="w-4 h-4" />
              {c.name}
              {!c.id && <X className="w-3.5 h-3.5" />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="h-10"
        />
        <Button type="button" variant="secondary" onClick={add}>
          Hozzáad
        </Button>
      </div>
    </div>
  );
}
