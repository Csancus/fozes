import Link from "next/link";
import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";
import {
  Wallet,
  Plus,
  Table2,
  ImagePlus,
  Repeat,
  Tag,
  CreditCard,
  Users,
  FolderKanban,
  Layers,
  TrendingUp,
  LayoutDashboard,
  ListChecks,
  Sparkles,
  Lightbulb,
  PencilLine,
  SlidersHorizontal,
} from "lucide-react";

export default async function KoltsegekSugoPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-10 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Hogyan működik a Költségkezelő"
        subtitle="Tömör leírás mindenről"
        back="/koltsegek"
      />

      <section className="mt-5 rounded-2xl bg-[var(--color-primary-soft)] p-4">
        <p className="text-sm leading-relaxed text-[var(--color-foreground)]">
          <strong>A lényeg:</strong> minden kiadást és bevételt egy-egy
          <em> tételként</em> rögzítesz. A tétel legfontosabb adata az összeg, a
          bolt/kitől-kinek, és a kategória — a többi (kártya, ki költötte,
          projekt, csoport) opcionális, de ezekre tudsz később szűrni és
          kimutatást nézni. Ha csak a kiadásaidat akarod látni, elég az összeg +
          kategória.
        </p>
      </section>

      <Sec icon={Plus} title="Hogyan viszel fel tételt">
        <Row
          icon={Plus}
          title="Új tétel"
          href="/koltsegek/uj"
          text="Egyesével, minden mezővel. Itt tudsz kiadás és bevétel közt váltani a tetején."
        />
        <Row
          icon={Table2}
          title="Gyors táblázat"
          href="/koltsegek/gyors"
          text="Több tétel egyszerre, soronként. „Sor az előző adataival” gombbal a hasonló tételek másodpercek alatt megvannak."
        />
        <Row
          icon={ImagePlus}
          title="Kép alapján"
          href="/koltsegek/kep"
          text="Bank-app képernyőképéből vagy blokkfotóból olvassa ki a tételeket (a telefonon fut, nem küld sehova adatot)."
        />
        <Row
          icon={Repeat}
          title="Ismétlődő tételek"
          href="/koltsegek/ismetlodo"
          text="Havi fix tételek (albérlet, előfizetés). A megadott napon automatikusan létrejönnek — akkor is, ha napokig nem nyitod meg az appot: megnyitáskor pótolja a kimaradt hónapokat."
        />
      </Sec>

      <Sec icon={Tag} title="Mit kérdez egy tételnél">
        <Def term="Összeg és dátum" text="A kettő kötelező — minden más elhagyható." />
        <Def
          term="Bolt / kitől"
          text="Pl. Lidl, Shell, Spotify. Ha egyszer kategóriát rendelsz hozzá, legközelebb magától kitölti."
        />
        <Def term="Kategória" text="Mire ment el (Élelmiszer, Közlekedés…). Új kategóriát a tétel felvitele közben is tudsz létrehozni." />
        <Def term="Miből fizetted" text="Melyik kártya / számla / készpénz. Ebből jön a számlaegyenleg is." />
        <Def term="Ki költötte" text="Családtagonkénti bontáshoz." />
        <Def
          term="Projekt és cél"
          text="Egy nagyobb ügy költései együtt (pl. Autóvásárlás, Olaszország-út). A projektek célok alá rendezhetők, és a Teendőkkel közösek."
        />
        <Def
          term="Csoport"
          text="Kiadást ÉS bevételt is tartalmazhat, így látod, kioltják-e egymást (pl. „Albérlet kiadása és bevétele”)."
        />
        <Def
          term="Jelleg"
          text="Havi átlagos (visszatérő, a szokásos élet) vagy Eseti projekt (egyszeri nagy tétel). Az áttekintésben külön szűrhető, hogy ne torzítsa a havi átlagot."
        />
        <Def
          term="Felülvizsgálat"
          text="Bepipálva a tétel felkerül a Teendők listára — ha később utána kell nézni (pl. nem biztos az összeg)."
        />
      </Sec>

      <Sec icon={TrendingUp} title="Bevétel">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ugyanaz az űrlap: felül kapcsold át <strong>Bevétel</strong>-re. Ilyenkor
          bevétel-kategóriákat kínál (Fizetés, Bónusz…), és azt kérdezi, hová
          érkezett. A bevételek külön szekcióban és az egyenleg-kártyán jelennek
          meg, a kiadás-kimutatásokat nem keverik össze.
        </p>
      </Sec>

      <Sec icon={LayoutDashboard} title="Hol nézed meg">
        <Row
          icon={Wallet}
          title="Költségkezelés"
          href="/koltsegek"
          text="A napi képernyő: rögzítés, legutóbbi tételek, szűrők."
        />
        <Row
          icon={LayoutDashboard}
          title="Áttekintés"
          href="/koltsegek/attekintes"
          text="12 hónap trendje, egyenleg és havi átlag, legnagyobb kategóriák és tételek."
        />
        <Row
          icon={Layers}
          title="Csoportok"
          href="/koltsegek/csoportok"
          text="Egy csoport bevételei és kiadásai egymás mellett, havi nettó grafikonnal."
        />
        <Row
          icon={ListChecks}
          title="Teendők"
          href="/koltsegek/teendok"
          text="A felülvizsgálatra jelölt tételek, amíg le nem okézod őket."
        />
        <Row
          icon={PencilLine}
          title="Táblázat"
          href="/koltsegek/tabla"
          text="A meglévő tételek tömeges javítása — csak a módosított sorok mentődnek, a törlés visszavonható."
        />
      </Sec>

      <Sec icon={CreditCard} title="Számlaegyenlegek">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ha megadod, mennyi van most egy kártyán/számlán (a beállító
          varázslóban, amit a Beállításokból bármikor újraindíthatsz), az app
          onnantól vezeti az állását:
          <strong className="text-[var(--color-foreground)]">
            {" "}
            kezdő összeg + ide érkezett bevételek − innen fizetett kiadások
          </strong>
          . A megadás előtti dátumú tételek nem számítanak bele. Ha nem adsz meg
          semmit, ez a rész egyszerűen nem jelenik meg — a Költségkezelő tiszta
          kiadás-nyilvántartóként is teljes értékű.
        </p>
      </Sec>

      <Sec icon={Sparkles} title="Amit magától csinál">
        <Def term="Bolt → kategória" text="Megjegyzi, melyik bolthoz milyen kategóriát választottál, és legközelebb kitölti." />
        <Def term="Duplikáció-figyelés" text="Ha ugyanaz a bolt + összeg + nap már szerepel, rákérdez, mielőtt kétszer rögzítenéd." />
        <Def term="Ismétlődők pótlása" text="A havi szabályokból megnyitáskor létrehozza a hiányzó hónapokat is." />
        <Def term="Boltok listája" text="Minden rögzített boltot megjegyez, így a következő tételnél már csak választani kell." />
      </Sec>

      <Sec icon={SlidersHorizontal} title="Beállítások">
        <Row
          icon={SlidersHorizontal}
          title="Kategóriák · kártyák · személyek · boltok · csoportok"
          href="/koltsegek/beallitasok"
          text="Mindegyik átnevezhető, színezhető, törölhető. Az alap kategóriák egy gombbal visszaállíthatók."
        />
        <Row
          icon={FolderKanban}
          title="Célok és projektek"
          href="/beallitasok"
          text="Ezek a Költségek és a Teendők között közösek, ezért külön, globális beállításban laknak."
        />
        <Row
          icon={Users}
          title="Család"
          href="/csalad"
          text="Meghívó a háztartásba — több eszközről, több emberrel közösen vezethető ugyanaz a nyilvántartás."
        />
      </Sec>

      <Sec icon={Lightbulb} title="Tippek">
        <ul className="space-y-2 text-sm text-[var(--color-muted-foreground)] list-disc pl-5">
          <li>
            Kezdd egyszerűen: összeg + kategória. A kártyát, személyt, projektet
            nyugodtan hagyd üresen, amíg nincs rá szükséged.
          </li>
          <li>
            Heti egyszer nyisd meg a gyors táblázatot, és vidd fel a hét
            tételeit — gyorsabb, mint egyesével.
          </li>
          <li>
            Nagy, egyszeri kiadásnál (autó, nyaralás) állítsd a jelleget
            <em> Eseti projekt</em>-re, így nem torzítja a havi átlagot.
          </li>
          <li>
            A varázslót bármikor újraindíthatod a Beállításokban — a meglévő
            adataid megmaradnak.
          </li>
        </ul>
      </Sec>

      <div className="mt-8 grid gap-2">
        <Button href="/koltsegek/uj" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Új tétel rögzítése
        </Button>
        <Button href="/koltsegek" variant="secondary" size="lg">
          Vissza a Költségkezelőre
        </Button>
      </div>
    </main>
  );
}

function Sec({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-[15px] font-bold">
        <span className="w-8 h-8 rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Row({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 hover:border-[var(--color-primary)]/40 transition"
    >
      <span className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
        <Icon className="w-4.5 h-4.5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-[13px] text-[var(--color-muted-foreground)] mt-0.5">
          {text}
        </span>
      </span>
    </Link>
  );
}

function Def({ term, text }: { term: string; text: string }) {
  return (
    <p className="text-[13px] leading-relaxed">
      <span className="font-semibold text-[var(--color-foreground)]">
        {term}:
      </span>{" "}
      <span className="text-[var(--color-muted-foreground)]">{text}</span>
    </p>
  );
}
