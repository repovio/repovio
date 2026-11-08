---
title: 'avatar'
description: 'Cargue, importe, recorte o elimine su foto de perfil.'
---

<a id="choose-an-image"></a>

## Elige una imagen

Cada usuario que haya iniciado sesión, incluidos los usuarios de OIDC, puede abrir **Configuración → General** y cargar
un JPEG, PNG o WebP de hasta 2 MiB. Alternativamente, importe una imagen desde una URL HTTPS pública. Una imagen no
cuadrada abre el cuadro de diálogo de recorte; elija el recorte cuadrado y confirme antes de cargar. Cancelar el diálogo
deja el avatar actual sin cambios.

Repovio elimina los metadatos de la imagen, genera un WebP de 256 × 256 y almacena solo esa imagen normalizada en
PostgreSQL. No conserva la imagen original ni la URL remota. El tipo no válido, la imagen de gran tamaño, el error de
importación, el error de decodificación y el error de carga se informan por separado; elija una imagen compatible o
vuelva a intentarlo después de corregir la fuente/conectividad.

<a id="remove-and-display"></a>

## Eliminar y mostrar

Utilice la acción de eliminar para eliminar la imagen actual. Una eliminación fallida deja el avatar existente
disponible para volver a intentarlo. Sin imagen, la interfaz muestra iniciales basadas en el nombre personal o el nombre
de usuario. Los grupos de avatar de miembros del repositorio muestran como máximo cinco miembros y resumen a los
miembros adicionales. La visibilidad del avatar sigue los permisos del recurso que lo contiene. Cambiar un avatar
Repovio no actualiza la imagen de perfil de su proveedor.
