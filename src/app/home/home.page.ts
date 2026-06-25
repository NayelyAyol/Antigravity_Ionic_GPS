import { Component, OnInit, OnDestroy, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonButton, 
  IonIcon, 
  IonList, 
  IonItem, 
  IonLabel, 
  IonNote, 
  IonBadge,
  ToastController,
  Platform
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  play, 
  stop, 
  copy, 
  map, 
  locate, 
  alertCircle, 
  time, 
  trash, 
  checkmarkCircle,
  chevronForwardOutline,
  refreshCircle
} from 'ionicons/icons';
import { Geolocation } from '@capacitor/geolocation';
import { registerPlugin } from '@capacitor/core';

const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  timestamp: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonButton, 
    IonIcon, 
    IonList, 
    IonItem, 
    IonLabel, 
    IonNote, 
    IonBadge
  ],
})
export class HomePage implements OnInit, OnDestroy {
  currentPosition: LocationPoint | null = null;
  isTracking = false;
  history: LocationPoint[] = [];
  errorMessage: string | null = null;
  permissionState: any = 'unknown';
  watcherId: string | null = null;

  private toastCtrl = inject(ToastController);
  private platform = inject(Platform);
  private ngZone = inject(NgZone);

  constructor() {
    addIcons({
      play,
      stop,
      copy,
      map,
      locate,
      alertCircle,
      time,
      trash,
      checkmarkCircle,
      chevronForwardOutline,
      refreshCircle
    });
  }

  async ngOnInit() {
    await this.loadHistory();
    await this.checkPermissions();
  }

  async ngOnDestroy() {
    if (this.watcherId) {
      await this.stopTracking();
    }
  }

  async checkPermissions() {
    try {
      if (this.platform.is('hybrid')) {
        const perm = await Geolocation.checkPermissions();
        this.permissionState = perm.location;
      } else {
        // Entorno Web
        if ('navigator' in window && 'permissions' in navigator) {
          const perm = await navigator.permissions.query({ name: 'geolocation' as any });
          this.permissionState = perm.state;
          perm.onchange = () => {
            this.ngZone.run(() => {
              this.permissionState = perm.state;
            });
          };
        } else {
          this.permissionState = 'prompt';
        }
      }
    } catch (e) {
      console.error('Error checking permissions:', e);
      this.permissionState = 'unknown';
    }
  }

  async requestPermissions() {
    try {
      if (this.platform.is('hybrid')) {
        const perm = await Geolocation.requestPermissions();
        this.permissionState = perm.location;
        if (perm.location !== 'granted') {
          this.showToast('Permisos de ubicación denegados.', 'danger');
        } else {
          this.showToast('Permisos de ubicación concedidos.', 'success');
        }
      } else {
        // Solicitar localización básica en web
        navigator.geolocation.getCurrentPosition(
          () => {
            this.ngZone.run(() => {
              this.permissionState = 'granted';
              this.showToast('Permisos de ubicación concedidos.', 'success');
            });
          },
          (err) => {
            this.ngZone.run(() => {
              this.permissionState = 'denied';
              this.showToast('Permisos de ubicación denegados: ' + err.message, 'danger');
            });
          }
        );
      }
    } catch (e: any) {
      this.errorMessage = e.message || 'Error al solicitar permisos.';
      this.showToast(this.errorMessage!, 'danger');
    }
  }

  async getCurrentLocation() {
    this.errorMessage = null;
    try {
      await this.checkPermissions();
      if (this.permissionState !== 'granted') {
        await this.requestPermissions();
        if (this.permissionState !== 'granted') {
          throw new Error('Permisos de ubicación requeridos para obtener la posición.');
        }
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      this.ngZone.run(() => {
        const point: LocationPoint = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          speed: position.coords.speed,
          timestamp: new Date(position.timestamp).toLocaleString()
        };
        this.currentPosition = point;
        this.addPointToHistory(point);
        this.showToast('Ubicación actual obtenida.', 'success');
      });
    } catch (e: any) {
      this.ngZone.run(() => {
        this.errorMessage = e.message || 'Error al obtener la ubicación.';
        this.showToast(this.errorMessage!, 'danger');
      });
    }
  }

  async startTracking() {
    this.errorMessage = null;
    try {
      await this.checkPermissions();
      if (this.permissionState !== 'granted') {
        await this.requestPermissions();
        if (this.permissionState !== 'granted') {
          throw new Error('Permiso de ubicación denegado. No se puede iniciar el seguimiento.');
        }
      }

      if (this.platform.is('hybrid')) {
        // En dispositivo nativo, usamos BackgroundGeolocation para funcionamiento persistente en segundo plano
        this.watcherId = await BackgroundGeolocation.addWatcher(
          {
            backgroundMessage: 'Registrando tu ubicación en segundo plano...',
            backgroundTitle: 'Seguimiento GPS Activo',
            requestPermissions: true,
            stale: false,
            distanceFilter: 5 // actualiza cada 5 metros
          },
          (location: any, error: any) => {
            if (error) {
              this.ngZone.run(() => {
                this.errorMessage = error.message || 'Error en el seguimiento de segundo plano.';
                this.showToast('Error en segundo plano: ' + this.errorMessage, 'danger');
              });
              return;
            }

            if (location) {
              this.ngZone.run(() => {
                const point: LocationPoint = {
                  latitude: location.latitude,
                  longitude: location.longitude,
                  accuracy: location.accuracy || 0,
                  altitude: location.altitude || null,
                  speed: location.speed || null,
                  timestamp: new Date(location.time || Date.now()).toLocaleString()
                };
                this.currentPosition = point;
                this.addPointToHistory(point);
              });
            }
          }
        );
      } else {
        // En la web, usamos la API de geolocalización estándar watchPosition
        const id = navigator.geolocation.watchPosition(
          (position) => {
            this.ngZone.run(() => {
              const point: LocationPoint = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                altitude: position.coords.altitude,
                speed: position.coords.speed,
                timestamp: new Date(position.timestamp).toLocaleString()
              };
              this.currentPosition = point;
              this.addPointToHistory(point);
            });
          },
          (error) => {
            this.ngZone.run(() => {
              this.errorMessage = error.message;
              this.showToast('Error de seguimiento web: ' + this.errorMessage, 'danger');
            });
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
        this.watcherId = id.toString();
      }

      this.isTracking = true;
      this.showToast('Seguimiento GPS iniciado.', 'success');
    } catch (e: any) {
      this.errorMessage = e.message || 'Error al iniciar el seguimiento.';
      this.showToast(this.errorMessage!, 'danger');
    }
  }

  async stopTracking() {
    try {
      if (this.watcherId) {
        if (this.platform.is('hybrid')) {
          await BackgroundGeolocation.removeWatcher({ id: this.watcherId });
        } else {
          navigator.geolocation.clearWatch(parseInt(this.watcherId, 10));
        }
        this.watcherId = null;
      }
      this.isTracking = false;
      this.showToast('Seguimiento GPS detenido.', 'success');
    } catch (e: any) {
      this.errorMessage = e.message || 'Error al detener el seguimiento.';
      this.showToast(this.errorMessage!, 'danger');
    }
  }

  addPointToHistory(point: LocationPoint) {
    // Evitar registros duplicados consecutivos en la misma coordenada
    if (this.history.length > 0 && 
        this.history[0].latitude === point.latitude && 
        this.history[0].longitude === point.longitude) {
      return;
    }
    this.history.unshift(point);
    // Limitar historial a los últimos 50 puntos
    if (this.history.length > 50) {
      this.history.pop();
    }
    this.saveHistory();
  }

  async saveHistory() {
    localStorage.setItem('gps_history', JSON.stringify(this.history));
  }

  async loadHistory() {
    const data = localStorage.getItem('gps_history');
    if (data) {
      try {
        this.history = JSON.parse(data);
        if (this.history.length > 0) {
          this.currentPosition = this.history[0];
        }
      } catch (e) {
        console.error('Error al cargar historial:', e);
      }
    }
  }

  clearHistory() {
    this.history = [];
    this.currentPosition = null;
    localStorage.removeItem('gps_history');
    this.showToast('Historial de ubicaciones limpiado.', 'success');
  }

  async copyCoordinates() {
    if (!this.currentPosition) return;
    const coords = `${this.currentPosition.latitude}, ${this.currentPosition.longitude}`;
    try {
      await navigator.clipboard.writeText(coords);
      this.showToast('Coordenadas copiadas al portapapeles: ' + coords, 'success');
    } catch (err) {
      this.showToast('Error al copiar al portapapeles.', 'danger');
    }
  }

  openInMaps() {
    if (!this.currentPosition) return;
    const lat = this.currentPosition.latitude;
    const lon = this.currentPosition.longitude;
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, '_system');
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: 'Cerrar',
          role: 'cancel'
        }
      ]
    });
    await toast.present();
  }
}
