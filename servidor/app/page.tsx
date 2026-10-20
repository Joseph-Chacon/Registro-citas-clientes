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

  return <main className="min-h-screen bg-[#f8f7f5] text-[#272321]">
    <header className="border-b border-[#e9e3de] bg-white/90 px-5 py-4 backdrop-blur sm:px-10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#6e4b6d] text-white"><MapPin size={20} /></div><div><p className="text-sm font-bold">Agenda Local</p><p className="text-xs text-stone-500">Citas que sí llegan a destino</p></div></div>
      <div className="rounded-xl bg-stone-100 p-1 text-sm font-medium"><button onClick={() => setVista("cliente")} className={`rounded-lg px-3 py-2 ${vista === "cliente" ? "bg-white shadow-sm" : "text-stone-500"}`}>Vista cliente</button><button onClick={() => setVista("admin")} className={`rounded-lg px-3 py-2 ${vista === "admin" ? "bg-white shadow-sm" : "text-stone-500"}`}>Administración</button></div>
    </div></header>
    {vista === "admin" ? <section className="mx-auto max-w-3xl px-5 py-12 sm:py-16">
      <p className="mb-2 text-sm font-semibold text-[#8b5f88]">CONFIGURACIÓN DEL NEGOCIO</p><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">¿Dónde atenderás a tus clientes?</h1><p className="mt-3 max-w-2xl text-stone-600">Agrega una dirección y, si quieres mayor precisión, pega el enlace del punto exacto de Google Maps o Apple Maps.</p>
      <form onSubmit={guardar} className="mt-8 rounded-3xl border border-[#e9e3de] bg-white p-6 shadow-sm sm:p-8">
        <label className="block text-sm font-semibold" htmlFor="direccion">Dirección o nombre del lugar</label><input id="direccion" value={borrador.ubicacion} onChange={(e) => setBorrador({ ...borrador, ubicacion: e.target.value })} placeholder="Ej. Barrio Escalante, San José" className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none ring-[#8b5f88] focus:ring-2" />
        <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={abrirSelector} className="inline-flex items-center gap-2 rounded-xl bg-[#f2ebf1] px-4 py-2.5 text-sm font-semibold text-[#633f61]"><Navigation size={16} /> Buscar en Google Maps</button><span className="text-xs text-stone-500">Busca el sitio, copia su enlace y pégalo abajo.</span></div>
        <label className="mt-7 block text-sm font-semibold" htmlFor="url-mapa">Enlace del punto en Maps <span className="font-normal text-stone-500">(opcional)</span></label><input id="url-mapa" type="url" value={borrador.url_mapa} onChange={(e) => setBorrador({ ...borrador, url_mapa: e.target.value })} placeholder="https://maps.google.com/..." className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-3 outline-none ring-[#8b5f88] focus:ring-2" /><p className="mt-2 text-xs leading-5 text-stone-500">Si no agregas un enlace, abriremos Google Maps usando la dirección que escribiste.</p>
        <div className="mt-8 flex items-center gap-4 border-t border-stone-100 pt-6"><button disabled={guardando} className="inline-flex items-center gap-2 rounded-xl bg-[#6e4b6d] px-5 py-3 text-sm font-bold text-white disabled:opacity-60"><Save size={17} />{guardando ? "Guardando…" : "Guardar ubicación"}</button>{mensaje && <p className="text-sm text-[#526c4e]">{mensaje}</p>}</div>
      </form>
    </section> : <section className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-10 sm:py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
      <div><p className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eee6ed] px-3 py-1.5 text-xs font-bold tracking-wide text-[#6e4b6d]"><Check size={14} /> RESERVA CONFIRMADA</p><h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Tu cita en {empresa.nombre} está lista.</h1><p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">Te esperamos. Guarda esta ubicación para llegar fácil y a tiempo.</p>
        <div className="mt-8 rounded-3xl border border-[#e6ddd7] bg-white p-6 shadow-[0_14px_40px_rgba(71,48,63,.08)]"><div className="flex gap-4"><div className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f1eaf0] text-[#6e4b6d]"><MapPin size={22} /></div><div><p className="font-bold">¿Dónde es tu cita?</p><p className="mt-1 leading-6 text-stone-600">{empresa.ubicacion || "La ubicación será confirmada por el negocio."}</p></div></div>{empresa.ubicacion && <a href={enlaceMaps} target="_blank" rel="noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6e4b6d] px-5 py-3.5 font-bold text-white transition hover:bg-[#593a58]"><Navigation size={18} /> Abrir indicaciones en Maps <ExternalLink size={16} /></a>}</div>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border border-[#ded3cb] bg-[#ddd6d0] p-5 shadow-xl"><div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px), linear-gradient(135deg, #dad0c8, #b6c0b5)", backgroundSize: "14px 14px, 100% 100%" }} /><div className="relative grid min-h-80 place-items-center rounded-3xl border border-white/60 bg-white/25 text-center backdrop-blur-[1px]"><div className="rounded-2xl bg-white px-6 py-5 shadow-lg"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#6e4b6d] text-white shadow-[0_0_0_8px_rgba(110,75,109,.18)]"><MapPin size={27} /></div><p className="mt-4 font-bold">{empresa.nombre}</p><p className="mt-1 max-w-48 text-sm text-stone-600">{empresa.ubicacion}</p><a href={enlaceMaps} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-[#6e4b6d]">Ver en Maps <ExternalLink size={14} /></a></div></div><span className="absolute bottom-7 left-7 rounded-lg bg-white/90 px-3 py-2 text-xs font-bold text-stone-600">Ubicación de tu cita</span></div>
    </section>}
    <footer className="border-t border-[#e9e3de] px-5 py-5 text-center text-xs text-stone-500">La ubicación la define el negocio. Confirma la dirección antes de salir.</footer>
  </main>;
}
