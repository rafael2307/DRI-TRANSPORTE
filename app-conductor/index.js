// Punto de entrada de Expo: package.json apunta a index.js, que no existía y
// dejaba la app del conductor sin poder arrancar.
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
