# UIO CIRCULAR — Auditoría de autenticación y recuperación de contraseña

Fecha: 17/09/2026

## Implementado

- Login conectado a Supabase Auth mediante correo + contraseña.
- Uso exclusivo de project URL + publishable key en frontend. No se incluye ninguna secret/service-role key.
- Lectura del perfil autorizado desde `public.profiles` con RLS.
- Mapeo de roles Supabase a la UI:
  - `administrador` -> `admin`
  - `gestor_ambiental` -> `gestor`
  - `operador_comercial` -> `empresa` (identificador técnico interno; visible como Operador Comercial)
- Bloqueo de acceso si el perfil no existe, está inactivo o no tiene rol asignado.
- Enlace visible **¿Olvidaste tu contraseña?**.
- Solicitud de recuperación usando `supabase.auth.resetPasswordForEmail()`.
- Mensaje neutro para no revelar si un correo está o no registrado.
- Detección del evento `PASSWORD_RECOVERY`.
- Pantalla **Crear nueva contraseña**.
- Validación de mínimo 8 caracteres y confirmación de contraseña.
- Actualización mediante `supabase.auth.updateUser({ password })`.
- Cierre de sesión después de actualizar la contraseña para obligar a iniciar sesión nuevamente.

## Auditoría técnica

- No se encontraron imports locales rotos.
- Transpilación sintáctica TypeScript/TSX: sin errores.
- No se encontraron referencias visibles a ECOTRACE, concesionaria/concesionario, Gestor de Balanza ni accesos demo.
- Se eliminó `bun.lock` para que AI Studio/npm regenere un lock compatible incluyendo `@supabase/supabase-js`.

## Paso que requiere la URL publicada

Supabase necesita autorizar la URL a la que regresará el usuario después de pulsar el enlace del correo de recuperación. El código utiliza dinámicamente:

`<origen-de-la-app>/?password-recovery=1`

Cuando UIO CIRCULAR tenga una URL estable de AI Studio/Cloud Run/hosting, agregar ese origen en:

Supabase -> Authentication -> URL Configuration -> Redirect URLs

Sin este paso, el correo puede enviarse, pero el enlace no podrá regresar correctamente a una URL no autorizada.
