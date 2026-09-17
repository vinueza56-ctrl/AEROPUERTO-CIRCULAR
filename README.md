# UIO CIRCULAR

UIO CIRCULAR es el sistema de gestión y trazabilidad de residuos reciclables para el Aeropuerto Internacional de Quito.

## Estado del proyecto

Base limpia sin datos precargados. La autenticación real, base de datos, Storage y RLS se conectarán con Supabase en los siguientes pasos.

## Ejecutar localmente

**Requisitos:** Node.js

1. Instalar dependencias: `npm install`
2. Configurar las variables de entorno necesarias.
3. Ejecutar: `npm run dev`

## Seguridad

No subir `.env`, `.env.local`, claves privadas ni secretos al repositorio.

## Perfiles visibles

- Gestor Ambiental
- Operador Comercial

El rol administrador existe únicamente para la validación y aprobación interna y no se presenta como perfil de acceso externo.

## Supabase Auth y recuperación de contraseña

Esta versión conecta el acceso de UIO CIRCULAR con el proyecto Supabase `UIO CIRCULAR` y añade el flujo completo de recuperación de contraseña.

- Login: Supabase Auth `signInWithPassword`.
- Recuperación: `resetPasswordForEmail`.
- Nueva contraseña: `updateUser`.
- La URL y la publishable key usadas en frontend son públicas por diseño y están protegidas por RLS.
- Nunca colocar una secret key o `service_role` en el frontend.

Antes de probar el enlace recibido por correo, la URL publicada de la app debe estar incluida en **Authentication -> URL Configuration -> Redirect URLs** de Supabase.
