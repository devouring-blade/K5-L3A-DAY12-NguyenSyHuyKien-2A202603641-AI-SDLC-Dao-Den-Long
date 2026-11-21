// Prepare the desktop runtime during installation, outside benchmark load timing.
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
console.log('Benchmark runtime ready: '+require('electron'));
