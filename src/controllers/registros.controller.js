import { obtenerConexion, sql } from '../database/conexion.js';

export const obtenerRegistro = async (req, res) => {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request().query('SELECT * FROM REGISTROVEHICULAR');
    console.log(resultado);
    res.json(resultado.recordset);
}

export const obtenerRegistroID = async (req, res) => {
    const { IDREGISTRO } = req.params;
    const conexion = await obtenerConexion();

    try {
        const resultadoRegistro = await conexion.request()
            .input('IDREGISTRO', sql.Int, IDREGISTRO)
            .query("SELECT * FROM REGISTROVEHICULAR WHERE IDREGISTRO = @IDREGISTRO");

        const resultadoTarifas = await conexion.request()
            .input('IDTARIFA', sql.Int, IDREGISTRO)
            .query("SELECT * FROM TARIFAS WHERE IDTARIFA = @IDTARIFA");

        res.json({
            registro: resultadoRegistro.recordset,
            tarifas: resultadoTarifas.recordset
        });
    } catch (error) {
        console.error("Error al obtener los datos:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
}

export const insertarRegistro = async (req, res) => {
    try {
        const { VEHICULO, HORASPARQUEO, IDTARIFA } = req.body;

        if (!VEHICULO || !HORASPARQUEO || !IDTARIFA) {
            return res.status(400).json({ message: 'Parámetros insuficientes.' });
        }

        const conexion = await obtenerConexion();

        const resultadoTarifa = await conexion.request()
            .input('IDTARIFA', sql.Int, IDTARIFA)
            .query("SELECT COSTOTARIFA FROM TARIFAS WHERE IDTARIFA = @IDTARIFA");

        if (resultadoTarifa.recordset.length === 0) {
            return res.status(404).json({ message: "Tarifa no encontrada para el IDTARIFA proporcionado" });
        }

        const COSTOTARIFA = resultadoTarifa.recordset[0].COSTOTARIFA;
        console.log(`COSTOTARIFA obtenido: ${COSTOTARIFA}`);

        const COSTOTOTAL = HORASPARQUEO * COSTOTARIFA;
        console.log(`Cálculo: ${HORASPARQUEO} horas × ${COSTOTARIFA} = ${COSTOTOTAL}`);

        const horaActual = new Date(Date.now());
        console.log('Hora actual obtenida:', horaActual);

        const FECHAREGISTRO = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
        console.log(`Fecha formateada (local): ${FECHAREGISTRO}`);

        const formatoHora = (hora) => {
            const horas = hora.getHours().toString().padStart(2, '0');
            const minutos = hora.getMinutes().toString().padStart(2, '0');
            const segundos = hora.getSeconds().toString().padStart(2, '0');
            return `${horas}:${minutos}:${segundos}`;
        };

        const HORAREGISTRO = formatoHora(horaActual);
        console.log(`Hora formateada: ${HORAREGISTRO}`);

        const resultado = await conexion.request()
            .input('VEHICULO', sql.VarChar, VEHICULO)
            .input('HORASPARQUEO', sql.Int, HORASPARQUEO)
            .input('COSTOTOTAL', sql.Float, COSTOTOTAL)
            .input('IDTARIFA', sql.Int, IDTARIFA)
            .input('FECHAREGISTRO', sql.VarChar, FECHAREGISTRO)
            .input('HORAREGISTRO', sql.VarChar, HORAREGISTRO)
            .query(
                'INSERT INTO REGISTROVEHICULAR(VEHICULO, HORASPARQUEO, COSTOTOTAL, IDTARIFA, FECHAREGISTRO, HORAREGISTRO) ' +
                'VALUES(@VEHICULO, @HORASPARQUEO, @COSTOTOTAL, @IDTARIFA, @FECHAREGISTRO, @HORAREGISTRO)'
            );

        console.log('Resultado de la inserción:', resultado);

        res.status(201).json({
            message: "Registro insertado exitosamente",
            datos: {
                VEHICULO,
                HORASPARQUEO,
                COSTOTARIFA,
                COSTOTOTAL,
                IDTARIFA,
                FECHAREGISTRO,
                HORAREGISTRO,
                calculo: `${HORASPARQUEO} horas × ${COSTOTARIFA} = ${COSTOTOTAL}`
            }
        });
    } catch (error) {
        console.error("Error al insertar registro:", error);
        console.error("Detalles del error:", error.message);
        if (error.stack) console.error("Stack:", error.stack);
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
}

export const actualizarRegistro = async (req, res) => {
    try {
        const { IDREGISTRO } = req.params;
        const datosActualizados = req.body || {};

        if (!IDREGISTRO) {
            return res.status(400).json({ message: 'Se requiere el ID del registro.' });
        }

        const conexion = await obtenerConexion();

        const busqueda = await conexion.request()
            .input('IDREGISTRO', sql.Int, IDREGISTRO)
            .query('SELECT r.*, t.COSTOTARIFA FROM REGISTROVEHICULAR r LEFT JOIN TARIFAS t ON r.IDTARIFA = t.IDTARIFA WHERE r.IDREGISTRO = @IDREGISTRO');

        if (busqueda.recordset.length === 0) {
            return res.status(404).json({ message: 'Registro no encontrado.' });
        }

        const registroActual = busqueda.recordset[0];
        const hayDatosParaActualizar = datosActualizados && Object.keys(datosActualizados).length > 0;
        
        if (!hayDatosParaActualizar) {
            return res.status(200).json({
                message: 'Datos del registro encontrados.',
                registro: registroActual
            });
        }

        const VEHICULO = datosActualizados.VEHICULO || registroActual.VEHICULO;
        const HORASPARQUEO = datosActualizados.HORASPARQUEO || registroActual.HORASPARQUEO;
        const IDTARIFA = datosActualizados.IDTARIFA || registroActual.IDTARIFA;

        let COSTOTARIFA = registroActual.COSTOTARIFA;
        if (IDTARIFA !== registroActual.IDTARIFA) {
            const resultadoTarifa = await conexion.request()
                .input('IDTARIFA', sql.Int, IDTARIFA)
                .query("SELECT COSTOTARIFA FROM TARIFAS WHERE IDTARIFA = @IDTARIFA");

            if (resultadoTarifa.recordset.length === 0) {
                return res.status(404).json({ message: "Tarifa no encontrada para el IDTARIFA proporcionado" });
            }

            COSTOTARIFA = resultadoTarifa.recordset[0].COSTOTARIFA;
        }

        const COSTOTOTAL = HORASPARQUEO * COSTOTARIFA;
        console.log(`Cálculo actualizado: ${HORASPARQUEO} horas × ${COSTOTARIFA} = ${COSTOTOTAL}`);

        const horaActual = new Date(Date.now());
        const FECHAREGISTRO = `${horaActual.getFullYear()}-${String(horaActual.getMonth() + 1).padStart(2, '0')}-${String(horaActual.getDate()).padStart(2, '0')}`;
        
        const formatoHora = (hora) => {
            const horas = hora.getHours().toString().padStart(2, '0');
            const minutos = hora.getMinutes().toString().padStart(2, '0');
            const segundos = hora.getSeconds().toString().padStart(2, '0');
            return `${horas}:${minutos}:${segundos}`;
        };
        
        const HORAREGISTRO = formatoHora(horaActual);

        const resultado = await conexion.request()
            .input('IDREGISTRO', sql.Int, IDREGISTRO)
            .input('VEHICULO', sql.VarChar, VEHICULO)
            .input('HORASPARQUEO', sql.Int, HORASPARQUEO)
            .input('COSTOTOTAL', sql.Float, COSTOTOTAL)
            .input('IDTARIFA', sql.Int, IDTARIFA)
            .input('FECHAREGISTRO', sql.VarChar, FECHAREGISTRO)
            .input('HORAREGISTRO', sql.VarChar, HORAREGISTRO)
            .query(`
                UPDATE REGISTROVEHICULAR
                SET VEHICULO = @VEHICULO,
                    HORASPARQUEO = @HORASPARQUEO,
                    COSTOTOTAL = @COSTOTOTAL,
                    IDTARIFA = @IDTARIFA,
                    FECHAREGISTRO = @FECHAREGISTRO,
                    HORAREGISTRO = @HORAREGISTRO
                WHERE IDREGISTRO = @IDREGISTRO
            `);

        console.log('Resultado de la actualización:', resultado);

        const registroActualizado = await conexion.request()
            .input('IDREGISTRO', sql.Int, IDREGISTRO)
            .query('SELECT * FROM REGISTROVEHICULAR WHERE IDREGISTRO = @IDREGISTRO');

        res.status(200).json({
            message: 'Registro actualizado exitosamente.',
            registroAnterior: registroActual,
            registroActualizado: registroActualizado.recordset[0],
            detalleCalculo: {
                horasParqueo: HORASPARQUEO,
                costoTarifa: COSTOTARIFA,
                costoTotal: COSTOTOTAL
            }
        });
    } catch (error) {
        console.error("Error al actualizar registro:", error);
        console.error("Detalles del error:", error.message);
        if (error.stack) console.error("Stack:", error.stack);
        res.status(500).json({ message: "Error del servidor", error: error.message });
    }
}

export const eliminarRegistro = async (req, res) => {
    const { IDREGISTRO } = req.params;
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
        .input('IDREGISTRO', sql.Int, IDREGISTRO)
        .query("DELETE FROM REGISTROVEHICULAR WHERE IDREGISTRO = @IDREGISTRO");

    console.log(resultado);
    res.json(resultado.recordset);
}