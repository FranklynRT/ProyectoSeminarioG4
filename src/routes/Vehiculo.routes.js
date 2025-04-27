import express from 'express';
import { 
    obtenerTarifas, 
    obtenerTarifasID, 
    insertarTarifas, 
    eliminarTarifas, 
    actualizarTarifa 
} from '../controllers/tarifas.controller.js';

import {
    obtenerRegistro,
    obtenerRegistroID,
    insertarRegistro,
    eliminarRegistro,
    actualizarRegistro
} from '../controllers/registros.controller.js';

const router = express.Router();

// Rutas de tarifas 
router.get('/Tarifas', obtenerTarifas);
router.get('/TarifasID/:IDTARIFA', obtenerTarifasID);
router.post('/insertarTarifas', insertarTarifas);
router.get('/eliminarTarifas/:IDTARIFA', eliminarTarifas);
router.put('/actualizarTarifas/:IDTARIFA', actualizarTarifa);

// Rutas de registros vehiculares
router.get('/Registra', obtenerRegistro);
router.get('/RegistroID/:IDREGISTRO', obtenerRegistroID);
router.post('/insertarRegistroVehicular', insertarRegistro);
router.get('/eliminarRegistro/:IDREGISTRO', eliminarRegistro);
router.put('/actualizarRegistro/:IDREGISTRO', actualizarRegistro);

export default router;
