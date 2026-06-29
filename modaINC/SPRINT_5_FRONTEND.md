# Sprint 5: Módulo de Confección, Entrega e Historial - modaINC

Este documento contiene la documentación oficial para la entrega del **Sprint 5 (Mapeo Frontend)** de la plataforma **modaINC**.

---

## 📋 Historias de Usuario Desarrolladas

### HU-15: Seguimiento del Estado del Pedido
* **Interfaz de Seguimiento:** Diseñada para que tanto fabricantes como clientes observen visualmente el progreso.
* **Barra de Progreso:** Muestra el porcentaje dinámico de avance de acuerdo al estado actual (ej. Pagado: 35%, Confeccionando: 60%, Listo: 85%, Entregado: 100%).
* **Línea de Tiempo (Timeline):** Registra cada cambio de estado, la fecha y hora, una descripción/observación y el autor del cambio.
* **Actualización del Fabricante:** El fabricante cuenta con un formulario interactivo para avanzar el estado y añadir observaciones. Cuenta con una ventana de confirmación previa a la actualización.

### HU-16: Notificaciones Automáticas
* **Centro de Notificaciones:** Panel específico (`'notifications'`) para que los usuarios consulten alertas de eventos clave de su pedido (ej. cambio de estado, mensajes nuevos, entrega programada).
* **Menú Desplegable (Header Bell):** Campana en la barra superior con contador en tiempo real de notificaciones no leídas y previsualización de las últimas 5 notificaciones.
* **Acciones Rápidas:** Botón para "Marcar todo como leído" y enlaces de navegación directa al detalle del pedido.

### HU-17: Coordinación de Entrega
* **Registro de Datos por Fabricante:** Formulario interactivo en el detalle del pedido para registrar el tipo de entrega (Envío postal, retiro en taller, etc.), costo de entrega, fechas estimadas de envío/entrega, número de seguimiento y datos de contacto del destinatario.
* **Mapa de Entrega:** Simulación interactiva con coordenadas de entrega para envíos postales utilizando Leaflet.
* **Recepción del Cliente:** Botón de confirmación de recepción en la vista de cliente que actualiza el estado a `'entregado'`.

### HU-18: Calificación del Fabricante
* **Formulario de Calificación:** Disponible únicamente para clientes cuando el pedido ha sido entregado.
* **Parámetros de Calificación:** Calidad de prenda, trato/comunicación y tiempo de entrega (escala de 1 a 5 estrellas).
* **Validación de Comentario:** Restricción estricta de longitud de comentario (entre 10 y 300 caracteres).
* **Lightbox de Imágenes:** Los clientes pueden adjuntar URLs de imágenes y abrirlas en una previsualización ampliada (Lightbox) en el perfil público.
* **Finalización del Pedido:** Al publicar la calificación, el estado del pedido pasa automáticamente a `'finalizado'`.

### HU-19: Historial de Pedidos y Transacciones
* **Historial Detallado:** Pestaña doble para consultar el historial de pedidos y el historial de transacciones financieras.
* **Buscador y Filtros:** Permite buscar por texto libre (prenda, fabricante, cliente, código) y filtrar por estado de pago, estado de entrega, rango de montos y fechas.
* **Panel de Resumen Financiero:** Tarjetas ejecutivas con métricas clave en tiempo real:
  - Pedidos totales.
  - Pedidos activos.
  - Pedidos finalizados.
  - Total gastado (Clientes) o Total Recibido (Fabricantes).

---

## 📂 Archivos Añadidos

### Componentes y Páginas (`src/components/sprint5/`)
1. [OrderDetailPage.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/OrderDetailPage.jsx) - Pantalla de seguimiento, timeline, mapa y calificaciones.
2. [HistoryPage.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/HistoryPage.jsx) - Panel financiero y listados de pedidos/transacciones.
3. [NotificationsPage.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/NotificationsPage.jsx) - Centro de notificaciones completo.
4. [NotificationBell.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/NotificationBell.jsx) - Icono y campana indicadora.
5. [NotificationDropdown.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/NotificationDropdown.jsx) - Desplegable rápido de notificaciones.
6. [ManufacturerRatings.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/ManufacturerRatings.jsx) - Panel de valoraciones con promedio y filtros.
7. [RatingStars.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/src/components/sprint5/RatingStars.jsx) - Renderizador e input táctil de estrellas.

### Archivo de Pruebas
* [tests/sprint5.userStories.test.jsx](file:///c:/Users/diana/OneDrive/Documents/ADMP3/modaINC/tests/sprint5.userStories.test.jsx) - Pruebas de integración automatizadas para las HU-15 a HU-19.

---

## 🚀 Instrucciones para Ejecutar y Validar

### 1. Iniciar Servidor de Desarrollo
Para interactuar visualmente con la plataforma, ejecuta en la terminal:
```bash
npm run dev
```

### 2. Ejecutar Pruebas Automatizadas
Para verificar que todas las funcionalidades anteriores y las de este sprint pasan correctamente:
```bash
npm run test:run
```
*(Se ejecutarán las 37 pruebas del proyecto y todas pasarán exitosamente).*

### 3. Compilación de Producción
Para verificar la compilación estática de Vite:
```bash
npm run build
```
*(Generará la carpeta `dist` con los bundles optimizados sin advertencias ni errores).*
