"use client";

import type { ReactNode } from "react";
import { CreditCard, Layers, UserRound } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { useNamedCreator } from "./useCategoryCreator";
import { createGroupInline, createPaymentMethodInline, createPersonInline } from "./actions";

type Item = { id: string; name: string; color?: string };
type Kind = "payment" | "person" | "group";

const TEXT: Record<
  Kind,
  { title: string; createLabel: string; placeholder: string; hint: string; icon: ReactNode; aria: string }
> = {
  payment: {
    title: "Új fizetési mód",
    createLabel: "Új fizetési mód…",
    placeholder: "pl. Revolut, OTP kártya, Készpénz",
    hint: "Típust, színt, kezdő egyenleget később a Beállításokban állíthatsz be.",
    icon: <CreditCard className="w-4.5 h-4.5" />,
    aria: "Fizetés",
  },
  person: {
    title: "Új személy",
    createLabel: "Új személy…",
    placeholder: "pl. Anna, Közös, Gyerekek",
    hint: "Színt később a Beállításokban állíthatsz be.",
    icon: <UserRound className="w-4.5 h-4.5" />,
    aria: "Ki(nek)",
  },
  group: {
    title: "Új csoport",
    createLabel: "Új csoport…",
    placeholder: "pl. Horvát nyaralás, Lakásfelújítás",
    hint: "Színt később a Beállításokban állíthatsz be.",
    icon: <Layers className="w-4.5 h-4.5" />,
    aria: "Csoport",
  },
};

const CREATE: Record<Kind, (name: string) => Promise<Item | null>> = {
  payment: createPaymentMethodInline,
  person: createPersonInline,
  group: createGroupInline,
};

// Story 10.15 – legördülő „+ Új …” sorral fizetési módhoz, ki(nek)-hez és csoporthoz (mint a ProjectSelect).
export function CreatableSelect<T extends Item>({
  kind,
  items,
  value,
  onChange,
  onCreated,
  disabled,
  className,
}: {
  kind: Kind;
  items: T[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (item: T) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = TEXT[kind];
  const { open, modal } = useNamedCreator<T>(CREATE[kind] as (name: string) => Promise<T | null>, t);

  async function create() {
    const it = await open();
    if (it) {
      onCreated(it);
      onChange(it.id);
    }
  }

  return (
    <>
      {modal}
      <Dropdown
        value={value}
        options={items.map((i) => ({ value: i.id, label: i.name, color: i.color }))}
        onChange={onChange}
        createLabel={t.createLabel}
        onCreate={create}
        disabled={disabled}
        ariaLabel={t.aria}
        className={className}
      />
    </>
  );
}
