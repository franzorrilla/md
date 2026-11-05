# MISIÓN 404 · Versión de aula sincronizada con la HDC

La versión **`mision-404-prototipo/v2/` de GitHub Pages es un prototipo sin sincronización**.

La versión de aula está aquí:

- `Code.gs`: servidor de Google Apps Script con control de sesiones, operaciones atómicas por célula, reloj docente y registro de eventos.
- `Index.html`: juego y panel docente, servido desde Apps Script con `google.script.run`.
- HDC privada: [MD · MISIÓN 404 · Registro, accesos y evaluación](https://docs.google.com/spreadsheets/d/17DlGd_smFvJ5wJ6z3lc34DlNZOVOH4is2f83mbESEvI/edit).

## 1. Actualizar la implementación de Ágil Centros

**La aplicación ya ha sido creada y su URL de clase es:** https://script.google.com/macros/s/AKfycbzk2vih91BRMZPBa52rgtX5JumIOkTQc5ZC88sgPavV4UPTrJorSMVHLFrysRxKmvE/exec

Para actualizar el proyecto existente con el **Acto IV final**, abre la HDC → **Extensiones → Apps Script** y sustituye los contenidos completos de `Code.gs` e `Index.html` por sus últimas versiones de este repositorio. Guarda y ve a **Implementar → Administrar implementaciones → Editar → Nueva versión → Implementar**. No es necesario crear otro proyecto ni otra URL. No copies el PIN docente en GitHub ni cambies los códigos personales.

### Instalación desde cero (solo si hace falta)

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
- `08_Sync_control`: reloj central, códigos de autorización y dictamen final en `A9:C9`.

Las escrituras de una célula se **fusionan bajo bloqueo** en Apps Script. Un alumno del mismo equipo ve los cambios de sus compañeros en la siguiente consulta automática (normalmente en unos 12 segundos). Las respuestas individuales no se envían a otros alumnos.

## 3. Acto IV · La decisión final (11:00–13:00)

- **11:00** · comienza el cuarto y último acto. Los doce operadores reciben tareas individuales diferentes.
- **11:25** · se libera el tercer informe de cada una de las cuatro células.
- **11:35** · cada célula contrasta sus hallazgos con al menos dos células diferentes. No basta con inventar el código: la fuente externa debe haber revisado sus tres documentos.
- **12:05** · la célula entrega un plan de publicación o contención. Requiere expediente completo, dos contrastes y al menos dos respuestas personales registradas dentro del grupo.
- **12:30** · Dirección puede ratificar un lanzamiento limitado, aplazarlo o elegir el escenario deliberadamente inseguro. El lanzamiento limitado exige cuatro planes y medidas seguras de todas las células. Las otras opciones muestran sus consecuencias simuladas.
- **13:00** · se revela el desenlace. Cada estudiante entrega una reflexión individual sobre cambio de opinión, hechos e hipótesis y aplicación profesional, y puede copiar su informe para Classroom.

Todas las acciones del Acto IV se registran en `03_Eventos`, `06_Sync_equipos` y `07_Sync_alumnos`. La decisión de Dirección queda en `08_Sync_control!B9` y se muestra al alumnado solo a las 13:00. Si no hay decisión, el protocolo mantiene el lanzamiento sin autorización.

## 4. Prueba previa obligatoria (dos navegadores)

1. Accede como docente con la clave `MISION404_ADMIN_PIN`. Desde Dirección, inicia o adelanta el reloj.
2. Abre dos ventanas/sesiones independientes con dos códigos personales **diferentes de la misma célula**; no uses dos veces el mismo código.
3. En la primera sesión abre un documento y regístralo. Confirma que aparece como consultado en la segunda sesión tras la sincronización.
4. Registra una respuesta individual en la primera sesión. Comprueba que no se copia a la segunda.
5. Introduce un código de otra célula en la primera sesión y confirma que el intercambio aparece en la segunda sin repetirlo.
6. En Dirección, comprueba que puedes autorizar a una célula y que la autorización aparece en ambas sesiones. **Los códigos `404-ALFA` y similares del prototipo no son válidos en la versión de aula.**
7. Revisa que las filas nuevas aparezcan en `03_Eventos`. Verifica entregas en `06_Sync_equipos` y `07_Sync_alumnos`.
8. Prueba también con las cuatro células y doce sesiones antes de la clase real.

## 5. Mantenimiento

- Si cambias `Code.gs` o `Index.html`, crea una **nueva versión de la implementación** desde Apps Script; editar archivos sin actualizar la implementación publicada no actualiza `/exec`.
- Google Sheets funciona como fuente central. La pantalla ya no usa `localStorage` para guardar los avances en la versión de aula.
- La sesión dura como máximo seis horas sin necesidad de reidentificarse (Google puede desalojar antes la caché). Si caduca, vuelve a introducir tu código; las respuestas persisten.
- El profesor puede pausar/avanzar el reloj, autorizar una célula, renovar códigos y restablecer estados desde Dirección.
- **Reiniciar** deja las respuestas de las pestañas de sincronización vacías, renueva las autorizaciones, borra el dictamen del Acto IV y conserva `03_Eventos` como auditoría. Se recomienda documentar la sesión y exportar los informes antes de reiniciar.
- Las calificaciones académicas siguen requiriendo revisión docente.

## 6. Limitaciones y seguridad

- Los documentos y enunciados del juego están en el HTML del cliente; la interfaz oculta escenas futuras, pero inspeccionar el código fuente podría revelarlas. **No sustituye a un examen seguro.**
- En este diseño los códigos de alumno están protegidos en la HDC y verificados en el servidor. Nunca publiques la HDC.
- El PIN docente existe **solo en Propiedades del script** y no está en el código del repositorio.
- Los códigos reales y el secreto docente **no deben enviarse al chat de clase** ni incorporarse a una web pública.
- La aplicación existente de Apps Script requiere una **nueva versión del despliegue** tras cada cambio de los archivos del repositorio. La publicación no se actualiza automáticamente desde GitHub.

## Estado

Los cuatro actos y el desenlace están implementados en GitHub; la HDC está preparada. Se han superado pruebas de lógica con doce operadores simulados, cuatro planes, ratificación docente y doce reflexiones. **Pendiente:** copiar los archivos actualizados a Apps Script, publicar una versión nueva y realizar la prueba real en doce dispositivos. La URL de clase puede conservarse.
