# MISIÓN 404 · Versión de aula sincronizada con la HDC

La versión **`mision-404-prototipo/v2/` de GitHub Pages es un prototipo sin sincronización**.

La versión de aula está aquí:

- `Code.gs`: servidor de Google Apps Script con control de sesiones, operaciones atómicas por célula, reloj docente y registro de eventos.
- `Index.html`: juego y panel docente, servido desde Apps Script con `google.script.run`.
- HDC privada: [MD · MISIÓN 404 · Registro, accesos y evaluación](https://docs.google.com/spreadsheets/d/17DlGd_smFvJ5wJ6z3lc34DlNZOVOH4is2f83mbESEvI/edit).

## 1. Instalación con la cuenta Ágil Centros

1. Abre la [HDC de MISIÓN 404](https://docs.google.com/spreadsheets/d/17DlGd_smFvJ5wJ6z3lc34DlNZOVOH4is2f83mbESEvI/edit) con **fran.zorrilla@agilcentros.es** y elige **Extensiones → Apps Script**. Esto crea un proyecto asociado a la HDC.
2. Ponle de nombre **MISIÓN 404 · Servidor de aula**. Si ya tiene un proyecto con código propio, no sobrescribas ese código: usa un proyecto Apps Script independiente.
3. Sustituye todo el contenido de `Code.gs` por el código de [Code.gs](./Code.gs).
4. En el menú izquierdo pulsa **+** → **HTML**, crea un archivo llamado **Index** y pega TODO el contenido de [Index.html](./Index.html). No añadas etiquetas HTML adicionales.
5. En **Configuración del proyecto → Propiedades del script**, añade:
   - **Propiedad:** `MISION404_ADMIN_PIN`
   - **Valor:** una clave docente aleatoria de **al menos 16 caracteres**. Debe ser secreta, distinta de los códigos de alumnos y no debe subirse a GitHub.
6. Pulsa **Implementar / Deploy → Nueva implementación → Aplicación web**. Ejecutar como **Yo (propietario)**. Acceso: **usuarios de Ágil Centros**, si todos los alumnos tienen cuentas del dominio y la opción está disponible; de lo contrario, **Cualquier usuario**, con autenticación por códigos individuales y clave docente.
7. Autoriza el acceso a Google Sheets cuando Google lo solicite. Comparte con el alumnado la URL terminada en **`/exec`**, **no** la página de GitHub Pages ni la URL de desarrollo `/dev`.
8. Para incrustarlo en Google Sites, inserta esa misma URL de Apps Script como contenido web.

**La primera conexión del docente** creará cuatro códigos de autorización aleatorios. Estarán visibles solo en el panel de Dirección y se guardarán en la pestaña `08_Sync_control` de la HDC privada.

## 2. La HDC ya está preparada

Las pestañas existentes no se han eliminado ni sustituido:

- `01_Accesos`: los doce códigos personales originales. Se verifican únicamente en el servidor.
- `03_Eventos`: registro fechado de respuestas, documentos, intercambios, decisiones y autorizaciones.
- `04_Evaluacion_equipos` y `05_Evaluacion_alumnos`: mantienen las rúbricas y fórmulas de evaluación; **no se crean notas definitivas automáticas**.
- `06_Sync_equipos`: cuatro estados JSON, uno por célula, con revisión y fecha.
- `07_Sync_alumnos`: doce estados individuales JSON privados, con revisión y fecha.
- `08_Sync_control`: reloj central y códigos de autorización.

Las escrituras de una célula se **fusionan bajo bloqueo** en Apps Script. Un alumno del mismo equipo ve los cambios de sus compañeros en la siguiente consulta automática (normalmente en unos 12 segundos). Las respuestas individuales no se envían a otros alumnos.

## 3. Prueba previa obligatoria (dos navegadores)

1. Accede como docente con la clave `MISION404_ADMIN_PIN`. Desde Dirección, inicia o adelanta el reloj.
2. Abre dos ventanas/sesiones independientes con dos códigos personales **diferentes de la misma célula**; no uses dos veces el mismo código.
3. En la primera sesión abre un documento y regístralo. Confirma que aparece como consultado en la segunda sesión tras la sincronización.
4. Registra una respuesta individual en la primera sesión. Comprueba que no se copia a la segunda.
5. Introduce un código de otra célula en la primera sesión y confirma que el intercambio aparece en la segunda sin repetirlo.
6. En Dirección, comprueba que puedes autorizar a una célula y que la autorización aparece en ambas sesiones. **Los códigos `404-ALFA` y similares del prototipo no son válidos en la versión de aula.**
7. Revisa que las filas nuevas aparezcan en `03_Eventos`. Verifica entregas en `06_Sync_equipos` y `07_Sync_alumnos`.
8. Prueba también con las cuatro células y doce sesiones antes de la clase real.

## 4. Mantenimiento

- Si cambias `Code.gs` o `Index.html`, crea una **nueva versión de la implementación** desde Apps Script; editar archivos sin actualizar la implementación publicada no actualiza `/exec`.
- Google Sheets funciona como fuente central. La pantalla ya no usa `localStorage` para guardar los avances en la versión de aula.
- La sesión dura como máximo seis horas sin necesidad de reidentificarse (Google puede desalojar antes la caché). Si caduca, vuelve a introducir tu código; las respuestas persisten.
- El profesor puede pausar/avanzar el reloj, autorizar una célula, renovar códigos y restablecer estados desde Dirección.
- **Reiniciar** deja las respuestas de las pestañas de sincronización vacías, pero conserva `03_Eventos` como auditoría.
- Las calificaciones académicas siguen requiriendo revisión docente.

## 5. Limitaciones y seguridad

- Los documentos y enunciados del juego están en el HTML del cliente; la interfaz oculta escenas futuras, pero inspeccionar el código fuente podría revelarlas. **No sustituye a un examen seguro.**
- En este diseño los códigos de alumno están protegidos en la HDC y verificados en el servidor. Nunca publiques la HDC.
- El PIN docente existe **solo en Propiedades del script** y no está en el código del repositorio.
- Los códigos reales y el secreto docente **no deben enviarse al chat de clase** ni incorporarse a una web pública.
- Esta aplicación necesita **una implementación manual inicial** en Google Apps Script. No existe una URL de sincronización operativa hasta completar el despliegue y validar el acceso.

## Estado

Backend y frontend creados y validados con pruebas de lógica usando alumnos simulados. HDC de destino preparada. **Despliegue real y ensayo de doce dispositivos: pendientes de actuación del titular de la cuenta.**
