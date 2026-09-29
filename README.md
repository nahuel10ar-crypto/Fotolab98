# FotoLab v0.2.0

Editor personal Android de fotos, preparado para compilar como APK con Expo/EAS.

## Incluye
- Selección de fotos de la galería.
- Controles de exposición, contraste, saturación, temperatura, nitidez y grano (estado de edición preparado para el motor de procesamiento).
- Rotación real de 90°.
- Reinicio de ajustes.
- Guardado en la galería.
- Botón de IA explícito: no se ejecuta automáticamente.
- Configuración EAS para generar un APK de prueba (`preview`).

## Generar APK
Con Node.js instalado:

```bash
npm install
npx eas login
npx eas build -p android --profile preview
```

EAS devolverá un enlace para descargar el APK.
