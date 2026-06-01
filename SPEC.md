# Recibos by dot — Spec

> Estado: 📝 planeada (no iniciada). Origen: idea nueva DOT (encaja con red Macoser / pymes y monotributistas).

## Una frase
Generá recibos y presupuestos prolijos en PDF desde el celular y compartilos por WhatsApp.

## Problema
Monotributistas, oficios y comercios chicos arman recibos/presupuestos a mano o en Word. Lento y poco profesional.

## Usuario
Monotributistas, oficios, comercios chicos, vendedores. B2C/B2B chico, Argentina.

## Objetivos (MVP)
1. Cargar datos del emisor una vez (nombre, logo opcional, datos de contacto).
2. Crear un recibo/presupuesto: cliente, ítems (descripción, cantidad, precio), total automático.
3. Generar PDF prolijo con estética DOT.
4. Compartir por WhatsApp / guardar.
5. Historial de comprobantes. Persistencia local. Mobile-first, Capacitor-ready.

## No-objetivos (por ahora)
- Sin factura fiscal AFIP (no es facturación electrónica; es recibo/presupuesto). Sin cuentas ni nube. Sin cobros online.

## Criterios de aceptación
- Puedo cargar emisor, crear un comprobante con ítems y total correcto.
- Genera un PDF compartible.
- Historial persiste. Estética DOT, mobile. `tsc` limpio.

## Stack
React + TS + Vite + diseño CSS DOT. Generación PDF en cliente (jsPDF/pdf-lib). LocalStorage. `appId: com.dot.recibos`.

## Monetización (placeholder)
Freemium: N comprobantes/mes gratis, ilimitado + sin marca de agua pago.

## El "wow"
De cargar ítems a PDF profesional compartido por WhatsApp en segundos.
