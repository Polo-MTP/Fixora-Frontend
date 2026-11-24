# FrontendFixora

## Rutas y sesión

Requiere Node.js 22.22.3 o superior (o 24.15.0 o superior) y pnpm 10.27.0. Con la API local
en `http://localhost:3001`, ejecuta `pnpm install` y `pnpm start`. El servidor de
Angular reenvía `/api` a la API mediante `proxy.conf.json`. En un despliegue, el
servidor web debe reenviar `/api` a la API.

`/login` inicia sesión. `/inicio` requiere una sesión válida. Las rutas `/cliente`,
`/proveedor`, `/gerente`, `/empleado`, `/administrador` y `/soporte` requieren el
rol correspondiente. Los guards consultan `GET /api/me` para comprobar el rol
actual. El interceptor añade el Bearer a las llamadas `/api` y, si recibe 401,
renueva los tokens una vez mediante `POST /api/auth/refresh`. Un 403 no se renueva.
Los tokens se conservan en `sessionStorage` hasta cerrar la pestaña o salir.

Las claves de correo, JWT y base de datos son exclusivas del servidor y no deben
añadirse al proyecto Angular.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.0.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

## Commits

Los commits siguen Conventional Commits con el ID de la tarea de Plane:

```txt
<tipo>(<ámbito>): <descripción> (FRONTENDAN-XX)
```

El hook `.githooks/commit-msg` rechaza los mensajes que no cumplen el formato. Se activa solo con `pnpm install`; para activarlo a mano:

```bash
git config core.hooksPath .githooks
```

Cada pull request pasa además por el workflow `Conventional Commits`, que revisa el nombre de la rama, el título del PR y los commits.

## Landing pública

La ruta `/` muestra la landing pública de Fixora. Incluye la presentación del
servicio, las categorías principales y una explicación del flujo para solicitar
ayuda.

Los botones “Quiero ser proveedor” llevan a `/registro-proveedor`, el punto de
entrada al registro de proveedores.

## Pruebas unitarias

En PowerShell, ejecuta todas las pruebas unitarias sin modo interactivo:

```powershell
pnpm.cmd test --watch=false

## Login web — FRONTENDAN-3
La ruta /login envía el correo y la contraseña a POST /api/auth/login.
Durante la solicitud, el formulario muestra el estado de carga y presenta los
errores de autenticación que devuelve la API.

Cuando el login es exitoso, el Frontend conserva los tokens en sessionStorage
y redirige según el rol, por ejemplo, a /administrador o /soporte. Solo
conserva un returnUrl cuando corresponde al rol autenticado o a la ruta
general /inicio.

Para un proveedor cuyo estado sea POR_APROBAR, el Backend responde con un
login exitoso y tokens con alcance limitado supplier_application. El Frontend
conserva esa sesión y redirige a /estado-solicitud. El acceso limitado lo
controla el Backend; no habilita las demás rutas protegidas.

/estado-solicitud es provisional. La vista detallada del estado y el reenvío
de documentos corresponden al Sprint 3.

El tipo de respuesta del login reserva la variante
nextStep: "third-factor" con un challengeId. El Frontend conserva ese
identificador como punto de extensión; el desafío todavía no está implementado
y la API actual no devuelve esa variante.

## Panel de administración — FRONTENDAN-7
La ruta /administrador muestra el dashboard visual de administración. Sus
métricas y ejemplos son ilustrativos; no representan datos consultados a la API.

La bandeja de verificaciones está en /administrador/verificaciones y el
desglose de una solicitud en
/administrador/verificaciones/:id. Ambas rutas requieren el rol
administrador.

La bandeja consulta GET /api/admin/supplier-applications y permite filtrar
por estado y buscar solicitudes. La API actual admite estado, búsqueda,
paginación y límite; los filtros por tipo y fecha quedan pendientes de soporte
en la API.

El desglose consulta la solicitud y permite obtener una URL temporal para
previsualizar documentos, revisar documentos y enviar la resolución de la
solicitud mediante los endpoints de administración de la API.

## Locales en el registro de proveedores (FRONTENDAN-6)

En `/registro-proveedor`, el paso **Locales** aparece después de **Datos del
negocio** y antes de **Documentos requeridos**. Un proveedor independiente
registra un local. La opción **Con sucursales** permite agregar y quitar locales,
con un mínimo de uno.

Cada local tiene una dirección capturada a mano y un punto independiente en el
mapa de Leaflet. El punto se selecciona con un clic o con **Marcar el centro del
mapa**. El marcador indica la ubicación seleccionada. Las coordenadas se
conservan en el borrador de sesión y se incluyen en los datos del local.

Para continuar, cada local necesita una dirección completa, un punto en el mapa,
al menos un horario válido y una categoría activa con precio base mayor a cero.
El catálogo se obtiene mediante `GET /api/categories`. Una categoría puede tener
precios distintos en locales diferentes.

`provider-branches.ts` valida los datos y prepara el arreglo `branches` de
`POST /api/supplier-applications`. El envío final de la solicitud y la
persistencia de los locales en Backend están pendientes de integración.

Las pruebas unitarias cubren las validaciones de locales, el armado de
`branches`, el límite para proveedores independientes y el avance a Documentos.

## Empleados y confirmación del registro (FRONTENDAN-8)

En `/registro-proveedor`, **Empleados (opcional)** aparece después de **Locales**
y antes de **Documentos requeridos**. El proveedor puede omitir el paso o agregar
personas con rol Empleado o Gerente a cada sucursal. El asistente valida los
datos de cada persona y evita repetir correos entre sucursales o usar el correo
del proveedor para una cuenta adicional. Las contraseñas de empleados permanecen
en memoria durante el registro.

El Frontend prepara los empleados en `branches[].employees` para el envío.
La pantalla **Recibimos tu solicitud** está preparada para mostrar el folio
cuando `POST /api/supplier-applications` confirme el alta.

### Pruebas unitarias

Desde la carpeta del Frontend, en PowerShell:

```powershell
pnpm.cmd test --watch=false
```

Las pruebas del asistente cubren el avance sin empleados, la separación del
personal por sucursal, el rechazo de correos duplicados y el estado temporal
de la casilla de autoasignación.