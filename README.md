# <h1 align="center"> 📍 Rastreador GPS - Geolocalización en Tiempo Real con Ionic / Antigravity 🛰️ </h1>

## Descripción

Aplicación móvil desarrollada con Ionic y Angular que utiliza las capacidades de geolocalización del dispositivo para obtener y mostrar la ubicación actual del usuario en tiempo real.

La aplicación permite:

- Solicitar permisos de ubicación
- Obtener coordenadas GPS precisas
- Mostrar latitud y longitud actuales
- Visualizar la precisión de la lectura GPS
- Mostrar la hora de la última actualización
- Abrir la ubicación en Google Maps
- Copiar coordenadas al portapapeles
- Iniciar y detener el seguimiento GPS en segundo plano
- Registrar un historial de ubicaciones obtenidas
- Mantener el seguimiento mediante Background Geolocation con notificación persistente

---

## Autora

- Nayely Ayol

---

## Tecnologías utilizadas

- Ionic `^8.0.0`
- Angular `20.3.25`
- TypeScript `~5.9.0`
- Capacitor `8.4.1`
- Capacitor Geolocation `^8.2.0`
- Capacitor Community Background Geolocation `^1.2.26`
- Android Studio

---

## Herramienta de IA utilizada

Este proyecto fue desarrollado utilizando **Antigravity** como herramienta de asistencia para la generación y optimización del código fuente.

---

## Funcionalidades

- Obtención de ubicación GPS en tiempo real
- Solicitud automática de permisos de ubicación en primer y segundo plano
- Validación de coordenadas obtenidas
- Visualización de precisión GPS
- Panel de estado con chips indicadores de permisos y tracking
- Badge dinámico: "Seguimiento Activo" / "Pausado"
- Apertura de ubicación en Google Maps
- Copia de coordenadas al portapapeles
- Interfaz moderna con tonos cafés y amarillos suaves desaturados
- Splash Screen personalizado
- Ícono personalizado
- Seguimiento GPS en segundo plano con Background Geolocation (nativo) y `watchPosition` (web)
- Historial de ubicaciones registradas (hasta 50 puntos, muestra los últimos 10)
- Inicio y detención del seguimiento en tiempo real
- Notificación persistente mientras el GPS permanece activo
- Persistencia del historial con `localStorage`

---

## Proceso de desarrollo

### 1. Creación del proyecto con Antigravity

Para el desarrollo de la aplicación se utilizó **Antigravity** como asistente de programación.

#### Instalación de Antigravity

Primero se descargó e instaló Antigravity desde su página oficial.

---

#### Selección del proyecto

Una vez instalado, se seleccionó un proyecto Ionic existente para trabajar con la herramienta.

---

#### Prompt utilizado

Se ingresó el siguiente prompt para generar la aplicación:

```text
Crea una aplicación Ionic que obtenga la ubicación GPS actual usando Capacitor Geolocation y geolocator, con manejo de permisos y errores. Una interfaz clara y con componentes bien distribuidos, colores que combinen tonos cafes claros y oscuros, y amarrilos claros, no muy saturado e icono y splash screen. Y que funcione en segundo plano y registra correctamente las ubicaciones, pese a que la aplicación esté minimizada.
```

<img width="886" height="382" alt="image" src="https://github.com/user-attachments/assets/23ca4615-bcd9-4e53-938f-8ef554681a22" />

---

#### Generación automática del código

Antigravity analizó el requerimiento y generó automáticamente la lógica necesaria para:

- Solicitar permisos de ubicación en primer y segundo plano.
- Obtener coordenadas GPS en tiempo real.
- Validar los datos obtenidos.
- Manejar errores de geolocalización con toasts y banners.
- Mostrar información detallada de la ubicación.
- Diseñar una interfaz moderna con paleta café y amarillo suave.

---

#### Implementación del seguimiento en segundo plano

Posteriormente se solicitó a Antigravity ampliar la funcionalidad para incorporar el seguimiento continuo utilizando `@capacitor-community/background-geolocation`, manteniendo el GPS activo incluso cuando la aplicación permanece minimizada.

---

#### Ejecución del proyecto

Una vez finalizada la generación del código, se ejecutó la aplicación mediante:

```bash
ionic serve
```

Posteriormente se verificó el correcto funcionamiento de la interfaz y de la lectura GPS.

<img width="886" height="446" alt="image" src="https://github.com/user-attachments/assets/3dd318dc-8e6f-4f52-a473-ece1045ada29" />

---

### 2. Instalación de dependencias

```bash
npm install
npm install @capacitor/geolocation
npm install @capacitor-community/background-geolocation

npx cap sync android
```

---

### 3. Configuración de permisos Android

Archivo:

```
android/app/src/main/AndroidManifest.xml
```

Permisos agregados:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

Servicio de segundo plano registrado dentro de `<application>`:

```xml
<service
    android:name="com.equimaps.capacitor_background_geolocation.BackgroundGeolocationService"
    android:enabled="true"
    android:exported="true"
    android:foregroundServiceType="location"
    android:stopWithTask="false" />
```

---

### 4. Implementación de geolocalización

Importaciones utilizadas:

```ts
import { Geolocation } from '@capacitor/geolocation';
import { registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');
```

Verificación de permisos según plataforma:

```ts
async checkPermissions() {
  if (this.platform.is('hybrid')) {
    const perm = await Geolocation.checkPermissions();
    this.permissionState = perm.location;
  } else {
    const perm = await navigator.permissions.query({ name: 'geolocation' as any });
    this.permissionState = perm.state;
    perm.onchange = () => {
      this.ngZone.run(() => { this.permissionState = perm.state; });
    };
  }
}
```

Obtención de ubicación única:

```ts
const position = await Geolocation.getCurrentPosition({
  enableHighAccuracy: true,
  timeout: 10000,
});
```

Solicitud de permisos:

```ts
const perm = await Geolocation.requestPermissions();
this.permissionState = perm.location;
```

---

### 5. Implementación del seguimiento en segundo plano

Para mantener la actualización continua de la ubicación incluso cuando la aplicación permanece minimizada, se implementó `@capacitor-community/background-geolocation` en dispositivos nativos y la API estándar `watchPosition` en web.

Registro del plugin:

```ts
const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');
```

Inicio del seguimiento (nativo — Android/iOS):

```ts
this.watcherId = await BackgroundGeolocation.addWatcher(
  {
    backgroundMessage: 'Registrando tu ubicación en segundo plano...',
    backgroundTitle: 'Seguimiento GPS Activo',
    requestPermissions: true,
    stale: false,
    distanceFilter: 5,
  },
  (location: any, error: any) => {
    // Actualizar coordenadas, historial y estado
  }
);
```

Inicio del seguimiento (web):

```ts
const id = navigator.geolocation.watchPosition(
  (position) => { /* actualizar estado */ },
  (error) => { /* manejar error */ },
  { enableHighAccuracy: true, timeout: 10000 }
);
this.watcherId = id.toString();
```

Detención del seguimiento:

```ts
if (this.platform.is('hybrid')) {
  await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
} else {
  navigator.geolocation.clearWatch(parseInt(this.watcherId, 10));
}
this.isTracking = false;
```

Durante el seguimiento se actualizan automáticamente:

- Coordenadas GPS
- Precisión
- Hora de actualización
- Historial de ubicaciones
- Estado del badge y chips de seguimiento

---

### 6. Manejo de errores

La aplicación incorpora validaciones y control de errores para distintos escenarios:

- GPS desactivado en el dispositivo
- Permisos denegados por el usuario (con botón "Activar" en el banner de error)
- Permisos denegados permanentemente
- Timeout al obtener la ubicación
- Fallo en el stream de segundo plano
- Error al copiar al portapapeles

---

### 7. Historial de ubicaciones

Cada lectura GPS obtenida se almacena en memoria y se persiste en `localStorage` para conservar el historial entre sesiones.

Cada registro almacena:

- Latitud
- Longitud
- Precisión
- Altitud
- Velocidad
- Hora de captura

El historial admite hasta 50 puntos, muestra los últimos 10 en pantalla, y puede eliminarse mediante el botón de papelera. Al iniciar la app, el historial previo se carga automáticamente y se restaura la última coordenada conocida.

---

## Interfaz principal

La interfaz permite al usuario:

- Ver el estado de permisos y tracking mediante chips de estado
- Obtener una ubicación única con el botón secundario
- Iniciar el seguimiento GPS continuo
- Detener el seguimiento cuando lo desee
- Consultar el historial de ubicaciones
- Visualizar latitud, longitud, precisión y hora de actualización
- Abrir la ubicación en Google Maps
- Copiar coordenadas al portapapeles

Panel de estado con chips dinámicos:

```html
<div class="status-chip" [class.active]="permissionState === 'granted'">
  <ion-icon [name]="permissionState === 'granted' ? 'checkmark-circle' : 'alert-circle'"></ion-icon>
  <ion-label>Permiso: {{ permissionState === 'granted' ? 'OK' : 'Inactivo' }}</ion-label>
</div>
<div class="status-chip" [class.active]="isTracking">
  <ion-icon [name]="isTracking ? 'refresh-circle' : 'stop'"></ion-icon>
  <ion-label>Tracking: {{ isTracking ? 'Activo' : 'Pausado' }}</ion-label>
</div>
```

Botones de control principal (toggle INICIAR / DETENER):

```html
<ion-button expand="block" shape="round" color="primary" (click)="startTracking()">
  <ion-icon slot="start" name="play"></ion-icon>
  INICIAR SEGUIMIENTO GPS
</ion-button>

<ion-button expand="block" shape="round" color="danger" (click)="stopTracking()">
  <ion-icon slot="start" name="stop"></ion-icon>
  DETENER SEGUIMIENTO
</ion-button>
```

Visualización de coordenadas:

```html
<span class="coord-value">{{ currentPosition.latitude.toFixed(6) }}</span>
<span class="coord-value">{{ currentPosition.longitude.toFixed(6) }}</span>
<span class="meta-value">±{{ currentPosition.accuracy.toFixed(1) }} m</span>
```

Historial de puntos:

```html
@for (point of history.slice(0, 10); track point.timestamp; let idx = $index) {
  <ion-item class="history-item">
    <div class="history-marker" slot="start">#{{ history.length - idx }}</div>
    <ion-label>
      <h2>{{ point.latitude.toFixed(6) }}, {{ point.longitude.toFixed(6) }}</h2>
      <p>Precisión: ±{{ point.accuracy.toFixed(1) }} m</p>
    </ion-label>
    <ion-note slot="end">{{ point.timestamp.split(' ')[1] }}</ion-note>
  </ion-item>
}
```

---

## Implementación de ícono y Splash Screen

### Ícono

1. Crear carpeta:

```
resources/
```

2. Agregar imagen `icon.png` con resolución recomendada de **1024 × 1024 px**.

3. Instalar herramienta (ya incluida en `devDependencies`):

```bash
npm install @capacitor/assets
```

4. Generar recursos:

```bash
ionic build
ionic cap add android
npx cap sync android
npx capacitor-assets generate
```

---

## Ejecución en dispositivo Android

Abrir proyecto Android:

```bash
npx cap open android
```

Generar APK:

```
Build > Build Bundle(s) / APK(s) > Build APK(s)
```

---

## Capturas de la funcionalidad

| Ícono |
| :---: |
| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 7 16 32 PM" src="https://github.com/user-attachments/assets/fd086308-05fe-43fb-bfab-7dc4eb98975f" />|

| Ubicación obtenida con éxito | Falla al obtener ubicación |
| :--------------------------: | :------------------------: |
| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 7 23 04 PM" src="https://github.com/user-attachments/assets/43fdce48-f70f-4e31-9588-b01e34a95a27" />| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 57 23 PM" src="https://github.com/user-attachments/assets/657da311-ae91-4a53-9f01-c3d542c1cfd0" />|

| Permisos GPS | Google Maps |
| :----------: | :---------: |
| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 22 PM" src="https://github.com/user-attachments/assets/df658389-c7a6-49ff-84a7-a705f1f5a34d" />| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 21 PM" src="https://github.com/user-attachments/assets/72432360-8f00-4bcd-8553-fe1cb1a53ef1" />|

| Seguimiento iniciado | Historial de ubicaciones |
| :------------------: | :----------------------: |
| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 21 PM (1)" src="https://github.com/user-attachments/assets/0810d518-230a-4005-b19e-56b45c9232d5" />| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 21 PM (2)" src="https://github.com/user-attachments/assets/839b4ea9-d445-4705-8795-a937bd043cbd" />|

| Notificación en segundo plano | Seguimiento detenido |
| :---------------------------: | :------------------: |
| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 21 PM (3)" src="https://github.com/user-attachments/assets/782b5332-239e-4228-bc52-f156aaf78b81" />| <img width="720" height="1600" alt="WhatsApp Image 2026-06-25 at 6 56 21 PM (4)" src="https://github.com/user-attachments/assets/2872f549-3c8f-42f3-9ff5-e305fbe99fd0" />
 |

---

## Video de funcionamiento

- https://vt.tiktok.com/ZSCjEoaEx/

---

## Descarga la APK

- https://drive.google.com/drive/folders/1TiCbZfAxp_DvrZWqHoIyM8qj_WJkU_UE?usp=sharing

---

## Resultados

- Se obtuvo correctamente la ubicación GPS del dispositivo mediante `getCurrentPosition` y seguimiento con Background Geolocation.
- Se implementó la solicitud y validación de permisos de ubicación en primer y segundo plano.
- Se visualizaron coordenadas geográficas precisas con actualización en tiempo real.
- Se integró la apertura directa en Google Maps.
- Se implementó la copia de coordenadas al portapapeles.
- Se desarrolló un sistema de seguimiento GPS continuo en segundo plano.
- Se registró un historial de hasta 50 puntos de ubicación con persistencia en `localStorage`.
- Se implementó una notificación persistente durante el seguimiento continuo.
- Se personalizaron el ícono y la Splash Screen de la aplicación con la paleta café y crema.
- Se obtuvo un APK funcional para dispositivos Android.
- Proyecto desarrollado con apoyo de **Antigravity**.
