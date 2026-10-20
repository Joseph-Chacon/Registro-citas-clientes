import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const empresas = sqliteTable("empresas", {
  idEmpresa: text("id_empresa").primaryKey(),
  nombre: text("nombre").notNull(),
  identificadorPublico: text("identificador_publico").notNull().unique(),
  ubicacion: text("ubicacion"),
  urlMapa: text("url_mapa"),
  telefono: text("telefono"),
  zonaHoraria: text("zona_horaria").notNull().default("America/Costa_Rica"),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  creadoEn: text("creado_en").notNull(),
});

export const servicios = sqliteTable("servicios", {
  idServicio: text("id_servicio").primaryKey(),
  idEmpresa: text("id_empresa").notNull().references(() => empresas.idEmpresa),
  nombre: text("nombre").notNull(),
  precioCentavos: integer("precio_centavos").notNull(),
  duracionMinutos: integer("duracion_minutos").notNull(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const clientes = sqliteTable("clientes", {
  idCliente: text("id_cliente").primaryKey(),
  idEmpresa: text("id_empresa").notNull().references(() => empresas.idEmpresa),
  nombre: text("nombre").notNull(),
  telefono: text("telefono").notNull(),
  creadoEn: text("creado_en").notNull(),
}, (table) => [uniqueIndex("indice_clientes_empresa_telefono").on(table.idEmpresa, table.telefono)]);

export const citas = sqliteTable("citas", {
  idCita: text("id_cita").primaryKey(),
  idEmpresa: text("id_empresa").notNull().references(() => empresas.idEmpresa),
  idCliente: text("id_cliente").notNull().references(() => clientes.idCliente),
  idServicio: text("id_servicio").notNull().references(() => servicios.idServicio),
  fechaHoraInicio: text("fecha_hora_inicio").notNull(),
  fechaHoraFin: text("fecha_hora_fin").notNull(),
  precioCentavos: integer("precio_centavos").notNull(),
  estado: text("estado").notNull().default("pendiente"),
  creadoEn: text("creado_en").notNull(),
});
