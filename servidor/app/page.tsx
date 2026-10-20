"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, MapPin, Navigation, Save } from "lucide-react";

type Empresa = { nombre: string; ubicacion: string; url_mapa: string; identificador_publico: string };
const ejemplo: Empresa = { nombre: "Studio Lila", ubicacion: "Barrio Escalante, San José, Costa Rica", url_mapa: "", identificador_publico: "studio-lila" };
const urlDeMaps = (empresa: Empresa) => empresa.url_mapa || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(empresa.ubicacion)}`;

export default function Home() {
  const [vista, setVista] = useState<"cliente" | "admin">("cliente");
  const [empresa, setEmpresa] = useState<Empresa>(ejemplo);
  const [borrador, setBorrador] = useState<Empresa>(ejemplo);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const guardada = window.localStorage.getItem("agenda-empresa");
    if (!guardada) return;
    try { const datos = JSON.parse(guardada) as Empresa; setEmpresa(datos); setBorrador(datos); }
    catch { window.localStorage.removeItem("agenda-empresa"); }
  }, []);

  useEffect(() => {
    const ruta = vista === "admin" ? "/api/panel/empresa" : `/api/publico/${empresa.identificador_publico}`;
    fetch(ruta, { credentials: "include" })
      .then(async (respuesta) => respuesta.ok ? (await respuesta.json()) as { empresa: Partial<Empresa> } : null)
      .then((cuerpo) => {
        if (!cuerpo?.empresa) return;
        const actualizada = { ...empresa, ...cuerpo.empresa };
        setEmpresa(actualizada);
        if (vista === "admin") setBorrador(actualizada);
      })
      .catch(() => undefined);
  // Solo se vuelve a consultar al cambiar entre el panel y la página pública.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vista]);

  const enlaceMaps = useMemo(() => urlDeMaps(empresa), [empresa]);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const datos = { ...borrador, ubicacion: borrador.ubicacion.trim(), url_mapa: borrador.url_mapa.trim() };
    if (!datos.ubicacion) { setMensaje("Escribe la dirección o el nombre del lugar para que tus clientes puedan abrir Maps."); return; }
    setGuardando(true); setMensaje("");
    try {
      const respuesta = await fetch("/api/panel/empresa", { method: "PUT", headers: { "content-type": "application/json" }, credentials: "include", body: JSON.stringify(datos) });
      if (respuesta.ok) Object.assign(datos, (await respuesta.json() as { empresa: Partial<Empresa> }).empresa);
    } catch { /* El demo conserva los datos en el navegador si el API no está disponible. */ }
    window.localStorage.setItem("agenda-empresa", JSON.stringify(datos));
    setEmpresa(datos); setBorrador(datos); setGuardando(false); setMensaje("Ubicación guardada. Así la verán tus clientes.");
  }

  function abrirSelector() {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(borrador.ubicacion || "Costa Rica")}`, "_blank", "noopener,noreferrer");
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card px-5 py-4 sm:px-10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><MapPin size={18} /></div><div><p className="text-sm font-semibold">Agenda</p><p className="text-xs text-muted-foreground">Gestión de ubicaciones</p></div></div>
      <div className="rounded-md border border-border bg-muted p-1 text-sm font-medium"><button onClick={() => setVista("cliente")} className={`rounded-sm px-3 py-2 transition-colors ${vista === "cliente" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Vista cliente</button><button onClick={() => setVista("admin")} className={`rounded-sm px-3 py-2 transition-colors ${vista === "admin" ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Administración</button></div>
    </div></header>
    {vista === "admin" ? <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">Configuración</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Ubicación para tus clientes</h1><p className="mt-3 max-w-2xl text-muted-foreground">Agrega una dirección y, si quieres mayor precisión, pega el enlace del punto exacto de Google Maps o Apple Maps.</p>
      <form onSubmit={guardar} className="mt-8 rounded-lg border border-border bg-card p-6 sm:p-8">
        <label className="block text-sm font-medium" htmlFor="direccion">Dirección o nombre del lugar</label><input id="direccion" value={borrador.ubicacion} onChange={(e) => setBorrador({ ...borrador, ubicacion: e.target.value })} placeholder="Ej. Barrio Escalante, San José" className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 outline-none ring-ring focus:ring-2" />
        <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={abrirSelector} className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"><Navigation size={16} /> Buscar en Google Maps</button><span className="text-xs text-muted-foreground">Busca el sitio, copia su enlace y pégalo abajo.</span></div>
        <label className="mt-7 block text-sm font-medium" htmlFor="url-mapa">Enlace del punto en Maps <span className="font-normal text-muted-foreground">(opcional)</span></label><input id="url-mapa" type="url" value={borrador.url_mapa} onChange={(e) => setBorrador({ ...borrador, url_mapa: e.target.value })} placeholder="https://maps.google.com/..." className="mt-2 w-full rounded-md border border-input bg-background px-4 py-3 outline-none ring-ring focus:ring-2" /><p className="mt-2 text-xs leading-5 text-muted-foreground">Si no agregas un enlace, abriremos Google Maps usando la dirección que escribiste.</p>
        <div className="mt-8 flex items-center gap-4 border-t border-border pt-6"><button disabled={guardando} className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-[var(--brand-strong)] disabled:opacity-60"><Save size={17} />{guardando ? "Guardando…" : "Guardar ubicación"}</button>{mensaje && <p className="text-sm text-primary">{mensaje}</p>}</div>
      </form>
    </section> : <section className="mx-auto grid max-w-5xl gap-8 px-5 py-12 sm:px-10 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
      <div><p className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold tracking-wide text-accent-foreground"><Check size={14} /> RESERVA CONFIRMADA</p><h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Tu cita en {empresa.nombre} está lista.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Te esperamos. Guarda esta ubicación para llegar fácil y a tiempo.</p></div>
      <aside className="rounded-lg border border-border bg-card p-6 sm:p-7"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground"><MapPin size={20} /></div><div><p className="font-semibold">Ubicación de tu cita</p><p className="mt-2 leading-6 text-muted-foreground">{empresa.ubicacion || "La ubicación será confirmada por el negocio."}</p></div></div>{empresa.ubicacion && <a href={enlaceMaps} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-3.5 font-semibold text-primary-foreground transition-colors hover:bg-[var(--brand-strong)]"><Navigation size={18} /> Abrir indicaciones en Maps <ExternalLink size={16} /></a>}</aside>
    </section>}
    <footer className="border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">La ubicación la define el negocio. Confirma la dirección antes de salir.</footer>
  </main>;
}
