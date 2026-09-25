# CCL Tech Store

Tienda pública en React + Vite y administración privada con API Express, SQLite y almacenamiento local de imágenes. No hay cuentas de clientes.

## Desarrollo local

Requiere Node.js 24 y npm. Desde la raíz del proyecto:

```powershell
npm install
npm run admin:create
npm run dev
```

La tienda abre en `http://127.0.0.1:5173/` y el panel en `http://127.0.0.1:5173/admin`. `admin:create` pide usuario y contraseña en la terminal; no existe una contraseña predeterminada. `npm run dev` inicia Vite y la API juntos. Vite envía `/api` y `/media` al servidor local en el puerto 3001. La base de datos y las imágenes subidas se guardan en `data/`, fuera de Git.

Para verificar cambios:

```powershell
npm test
npm run build
```

## Cómo se organiza

| Parte | Ubicación | Responsabilidad |
| --- | --- | --- |
| Tienda pública | `src/App.jsx`, `src/PCBuilder.jsx` | Navegación, catálogo, carrito y configurador de PC |
| Panel privado | `src/admin/` | Inicio de sesión, resumen, productos, categorías y editor |
| Cliente HTTP | `src/api.js` | Peticiones al catálogo y a la API autenticada |
| API | `server/api.js` | Rutas públicas y privadas, validación y procesamiento de imágenes |
| Persistencia | `server/store.js` | SQLite, consultas y operaciones de catálogo |
| Seguridad | `server/auth.js`, `server/validation.js` | Sesiones, contraseñas, CSRF y reglas de datos |
| Datos iniciales | `src/catalog.js`, `src/builderInventory.js` | Se importan una sola vez cuando se crea la base de datos |

Los cambios del panel se reflejan al recargar la tienda pública. Cambiar el nombre de una categoría no afecta el configurador de PC porque este utiliza identificadores estables. Los productos nuevos de las ocho categorías del configurador necesitan datos de compatibilidad antes de publicarse; el servidor los valida.

Las proyecciones de FPS no se escriben en el panel: se calculan para CPU y GPU que tienen índices de referencia en el catálogo inicial. Un modelo nuevo sin referencia no muestra FPS hasta incorporar datos medidos y revisados. Estas cifras son orientativas, no garantías de rendimiento.

El catálogo público solo devuelve productos publicados. El panel usa una sesión de servidor en una cookie HttpOnly, SameSite=Strict y con vencimiento de 12 horas; las modificaciones requieren un token CSRF. Las imágenes se verifican y convierten a WebP antes de guardarse. Las contraseñas usan scrypt. No se debe exponer el puerto 3001 directamente a Internet.

## Producción

Construye la aplicación y sirve la API detrás de un proxy HTTPS en el **mismo dominio**:

```powershell
npm ci
npm run build
$env:APP_ORIGIN = 'https://tu-dominio.com'
$env:DATA_DIR = 'C:\ruta\persistente\ccl-data'
npm run admin:create
npm start
```

El servidor escucha en `127.0.0.1:3001` y sirve `dist/`, `/api` y `/media`. Configura el proxy para enviar todo el dominio al puerto 3001, conservar el encabezado `Host`, transmitir la IP real mediante `X-Forwarded-For` y usar HTTPS. `APP_ORIGIN` debe ser exactamente el origen HTTPS público, sin barra final. Si cambias `PORT`, ajusta el proxy. Limita el acceso al servidor y mantén Node y dependencias actualizados. Para exposición pública conviene añadir MFA al acceso administrador y realizar una revisión de seguridad independiente.

Haz copias de seguridad de `DATA_DIR`, que contiene `store.sqlite` y `uploads/`. Para una copia simple, detén el servicio antes de copiar toda la carpeta; SQLite utiliza WAL y copiar solo el archivo `.sqlite` mientras está activo puede producir una copia incompleta. Nunca publiques el contenido de `DATA_DIR` como carpeta estática.

## Alcance actual

El panel mantiene productos, categorías, precios, existencias, visibilidad, imágenes, variantes, especificaciones y datos de compatibilidad. Los banners editoriales y las tres PC armadas de portada siguen siendo contenido fijo de la interfaz; no forman parte del catálogo administrable. El carrito sigue siendo local al navegador y el pedido se confirma mediante WhatsApp, como antes. No hay pagos en línea ni cuentas de clientes.
