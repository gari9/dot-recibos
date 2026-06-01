<div align="center">

# Recibos by dot

### Recibos y presupuestos profesionales en segundos, desde el celular

**Una app de [DOT](https://instagram.com/dot.sfco) · `dot•`**

![status](https://img.shields.io/badge/estado-MVP_funcional-0087D4)
![platform](https://img.shields.io/badge/plataforma-Web_%2B_Android-25262B)
![stack](https://img.shields.io/badge/stack-React_+_TypeScript_+_Vite-0087D4)
![target](https://img.shields.io/badge/para-monotributistas_y_comercios-303F52)

</div>

---

## 📖 Qué es

**Recibos by dot** permite a profesionales independientes, monotributistas y comercios chicos generar recibos y presupuestos prolijos en segundos y enviarlos por WhatsApp. Cargás tus datos una sola vez, armás el comprobante con sus ítems, y la app calcula el total y lo deja listo para compartir.

## 🎯 El problema que resuelve

Un monotributista, un plomero, una manicura o un comercio chico arman sus recibos y presupuestos a mano, en un cuaderno o copiando un Word. Es lento, poco profesional y fácil de perder. Recibos by dot convierte ese trámite en algo de 30 segundos, con una presentación que da confianza al cliente y un historial ordenado de todo lo emitido.

> ⚠️ **Importante:** no es facturación electrónica fiscal (AFIP). Es una herramienta para generar recibos y presupuestos comerciales.

## ✨ Funcionalidades

- **Datos del emisor** que se guardan para todos los comprobantes futuros.
- **Recibo o presupuesto:** elegís el tipo con un toque.
- **Ítems dinámicos:** descripción, cantidad y precio, con **total calculado automáticamente**.
- **Envío por WhatsApp** con el comprobante formateado y numerado.
- **Historial** de todos los comprobantes emitidos, con número correlativo.
- **Persistencia local** y funcionamiento offline. Sin cuenta, sin nube.

## 🖥️ Capturas

> _(Próximamente: GIF de demo y capturas de pantalla.)_

Identidad visual **Tech-Noir** de DOT: fondo oscuro, acento azul cian (`#0087D4`), formularios claros y jerarquía visual cuidada.

## 🛠️ Stack técnico

| Capa | Tecnología | Por qué |
|------|------------|---------|
| Framework | [React 19](https://react.dev) + TypeScript | Tipado seguro, ideal para lógica de cálculo |
| Build | [Vite](https://vitejs.dev) | Desarrollo y build rápidos |
| Estilos | Sistema de diseño CSS propio (tokens DOT) | Estética de marca consistente |
| Persistencia | LocalStorage | Local-first, los datos del negocio no salen del dispositivo |
| Mobile | [Capacitor](https://capacitorjs.com) | App nativa Android/iOS |

## 🏗️ Arquitectura

SPA **100 % cliente**. El cálculo de totales y la numeración de comprobantes son lógica pura del lado del cliente:

```
Usuario → React (formulario + cálculo + numeración) → LocalStorage
                          │
                          └─→ Capacitor → APK Android
```

## 📈 Escalabilidad

- **Exportación a PDF (próximo):** generar el comprobante como PDF descargable/imprimible con [jsPDF](https://github.com/parallax/jsPDF) o [pdf-lib](https://pdf-lib.js.org), manteniendo todo en el cliente.
- **Logo y personalización:** el modelo de datos del emisor está preparado para sumar logo y branding propio.
- **Multiplataforma:** misma base para web y Android/iOS.
- **Backend opcional (futuro):** sincronización de clientes y comprobantes, reportes de facturación, y eventual integración con facturación electrónica AFIP vía API.
- **Multi-usuario / multi-negocio:** la estructura permite escalar a varios emisores en una misma cuenta.

## 🚀 Instalación y uso

### Requisitos
- [Node.js](https://nodejs.org) 20 o superior

### Desarrollo local
```bash
git clone https://github.com/gari9/dot-recibos.git
cd dot-recibos
npm install
npm run dev
```

### Build de producción
```bash
npm run build
npm run preview
```

### App Android (Capacitor)
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npm run build
npx cap add android
npx cap sync android
npx cap open android
```

## 🗺️ Roadmap

- [x] MVP: emisor, recibo/presupuesto, ítems, total, historial, WhatsApp
- [ ] Exportar comprobante a PDF
- [ ] Logo del negocio en el comprobante
- [ ] Numeración personalizable
- [ ] Backup / exportación de datos
- [ ] Sincronización en la nube

## 🏢 Sobre DOT

Recibos by dot es parte del ecosistema de aplicaciones de **DOT**, un estudio de software que construye productos con identidad de marca unificada, pensados para resolver problemas reales de pymes y profesionales.

📷 Instagram: [@dot.sfco](https://instagram.com/dot.sfco)

## 📄 Licencia

Software propietario de DOT. Todos los derechos reservados.

---

<div align="center">
Hecho con cariño por <b>dot•</b>
</div>
