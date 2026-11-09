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
