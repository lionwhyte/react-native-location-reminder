import './services/geofenceService'; // importamo na sami vrh aplikacije da se odmah izvrši inicijalizacija geofence servisa jer u protivnom task-manager(pozadinski procesi) neće biti registriran na vrijeme i geofence eventovi neće raditi
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);