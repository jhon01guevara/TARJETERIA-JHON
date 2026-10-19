# Separación final de datos por rol

## Resultado

| Datos | Ruta | Quién accede |
| --- | --- | --- |
| Historial antiguo y administración | `panel/data` | Solo administrador |
| Productos y datos de factura compartidos | `panel_public/general` | Usuarios con rol leen; administrador actualiza |
| Clientes, facturas, ubicaciones y agenda de un vendedor | `vendedores/{uid}/privado/data` | Ese vendedor y administrador |

## Primera entrada después de actualizar

1. El administrador abre el panel actualizado.
2. El sistema crea `panel_public/general` con el catálogo y datos necesarios para emitir facturas.
3. Las facturas antiguas que tengan el campo `vend` se copian a su vendedor correspondiente.
4. Los clientes, ubicaciones y eventos antiguos no tenían propietario. Se conservan únicamente en `panel/data`, por tanto quedan solo para el administrador.
5. Se guarda `panel/migracion_roles_v1` para no repetir la copia.

## Orden seguro de publicación

1. Subir `js/app.js`, `tests/estructura-panel.test.js`, `firestore.rules` y este documento a GitHub.
2. Confirmar que GitHub Actions termina en verde.
3. Entrar primero al panel como administrador, dejar que aparezca “Sincronizado” y actualizar una vez la página.
4. Copiar `firestore.rules` a Firebase Console → Firestore Database → Rules y pulsar **Publicar**.
5. Con una cuenta de vendedor, actualizar la página con `Ctrl + F5` y verificar que puede crear un cliente y una factura propia.

No se eliminan documentos antiguos durante esta migración. Eso permite recuperar información si algo necesita revisión.
