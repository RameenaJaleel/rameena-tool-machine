/**
 * Tool machine: click a tile (or use the keypad: a letter, then a number) and the display,
 * keypad, tray and receipt all react: the tool drops into the tray, its slot empties, the
 * rest of the machine dims, and a receipt prints. Arrow keys move between tiles.
 * All the elements it updates are real markup in Stack.astro (so the scoped styles apply).
 */
export function initStack() {
  const root = document.querySelector<HTMLElement>("[data-stack]");
  if (!root) return;
  const tiles = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-code]"));
  const keys = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-key]"));
  const q = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const nameEl = q("[data-dname]"), subEl = q("[data-dsub]");
  const paper = q("[data-receipt]"), rOrder = q("[data-rorder]"), rName = q("[data-rname]"), rDesc = q("[data-rdesc]");
  const hint = q("[data-hint]"), drop = q("[data-drop]"), dimg = q<HTMLImageElement>("[data-dimg]");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const byCode = new Map(tiles.map((t) => [t.dataset.code!, t]));
  const idle = { name: nameEl.textContent || "PICK A TOOL", sub: subEl.textContent || "" };
  let row = "", col = "", cur: HTMLButtonElement | null = null;

  const lightKeys = () => keys.forEach((k) => k.classList.toggle("lit", k.dataset.key === row || k.dataset.key === col));
  const restart = (el: HTMLElement, cls: string) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

  const clearPick = () => {
    tiles.forEach((x) => { x.closest(".cell")?.classList.remove("pick"); x.setAttribute("aria-pressed", "false"); });
    root.classList.remove("has-pick");
    drop.hidden = true; hint.hidden = false;
    paper.classList.remove("out"); paper.hidden = true;
  };

  const select = (t: HTMLButtonElement | null) => {
    cur = t;
    clearPick();
    if (!t) {
      nameEl.textContent = idle.name; subEl.textContent = idle.sub;
      row = ""; col = ""; lightKeys(); return;
    }
    const code = t.dataset.code!, name = t.dataset.name || "";
    row = code[0]; col = code.slice(1); lightKeys();
    t.closest(".cell")?.classList.add("pick");
    t.setAttribute("aria-pressed", "true");
    root.classList.add("has-pick");
    nameEl.textContent = `${code} · ${name.toUpperCase()}`;
    subEl.textContent = t.dataset.group || "";

    // tray: the tool drops in
    dimg.src = t.querySelector("img")?.getAttribute("src") || "";
    hint.hidden = true; drop.hidden = false;
    if (!reduce) restart(drop, "fall");

    // receipt: prints out of the slot
    rOrder.textContent = `ORDER ${code}`;
    rName.textContent = name;
    rDesc.textContent = t.dataset.desc || "";
    paper.hidden = false;
    if (reduce) paper.classList.add("out");
    else { paper.classList.remove("out"); void paper.offsetWidth; requestAnimationFrame(() => paper.classList.add("out")); }
  };

  tiles.forEach((t) => t.addEventListener("click", () => select(cur === t ? null : t)));

  keys.forEach((k) =>
    k.addEventListener("click", () => {
      const v = k.dataset.key!;
      if (v === "x") return select(null);
      if (v === "ok") { if (cur) cur.focus(); return; }
      if (/[A-D]/.test(v)) row = v; else col = v;
      lightKeys();
      if (row && col) {
        const t = byCode.get(row + col) || null;
        if (t) select(t);
        else {
          const keepRow = row, keepCol = col;
          clearPick(); cur = null;
          nameEl.textContent = `${keepRow}${keepCol} · EMPTY`; subEl.textContent = "coming soon";
          row = keepRow; col = keepCol; lightKeys();
        }
      }
    })
  );

  root.addEventListener("keydown", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-code]");
    if (!t) return;
    const r = "ABCD".indexOf(t.dataset.code![0]), c = parseInt(t.dataset.code!.slice(1), 10);
    let nr = r, nc = c;
    if (e.key === "ArrowRight") nc++; else if (e.key === "ArrowLeft") nc--; else if (e.key === "ArrowDown") nr++; else if (e.key === "ArrowUp") nr--; else return;
    const next = byCode.get("ABCD"[nr] + nc);
    if (next) { e.preventDefault(); next.focus(); }
  });
  select(null);
}
