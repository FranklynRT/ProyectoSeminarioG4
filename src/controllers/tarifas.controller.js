import { obtenerConexion, sql } from '../database/conexion.js';

export const obtenerTarifas = async (req, res) => {
    const conexion = await obtenerConexion();
    const resultado = await conexion.request().query('SELECT * FROM TARIFAS');
    console.log(resultado);
    res.json(resultado.recordset);
}

export const obtenerTarifasID = async (req, res) => {
    const { IDTARIFA } = req.params;
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
        .input('IDTARIFA', sql.Int, IDTARIFA)
        .query("SELECT * FROM TARIFAS WHERE IDTARIFA = @IDTARIFA");

    console.log(resultado);
    res.json(resultado.recordset);
}

export const insertarTarifas = async (req, res) => {
    try {
        const { DESCRIPTARIFA, COSTOTARIFA } = req.body;

        // Validación de parámetros
        if (!DESCRIPTARIFA || !COSTOTARIFA) {
            return res.status(400).json({ message: 'Parámetros insuficientes.' });
        }

        const conexion = await obtenerConexion();
        const resultado = await conexion.request()
            .input('DESCRIPTARIFA', sql.VarChar, DESCRIPTARIFA)
            .input('COSTOTARIFA', sql.Float, COSTOTARIFA)
            .query("INSERT INTO TARIFAS (DESCRIPTARIFA, COSTOTARIFA) VALUES (@DESCRIPTARIFA, @COSTOTARIFA)");

        console.log(resultado);

        res.status(201).json({
            message: "Tarifa insertada exitosamente",
            datos: { DESCRIPTARIFA, COSTOTARIFA }
        });
    } catch (error) {
        console.error("Error al insertar Tarifa:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
}

export const eliminarTarifas = async (req, res) => {
    const { IDTARIFA } = req.params;
    const conexion = await obtenerConexion();
    const resultado = await conexion.request()
        .input('IDTARIFA', sql.Int, IDTARIFA)
        .query("DELETE FROM TARIFAS WHERE IDTARIFA = @IDTARIFA");

    console.log(resultado);
    res.json(resultado.recordset);
}

export const actualizarTarifa = async (req, res) => {
    try {
        const { IDTARIFA } = req.params;
        const { DESCRIPTARIFA, COSTOTARIFA } = req.body;

        if (!IDTARIFA || !DESCRIPTARIFA || !COSTOTARIFA) {
            return res.status(400).json({ message: 'Parámetros insuficientes.' });
        }

        const conexion = await obtenerConexion();

        const tarifaActual = await conexion.request()
            .input('IDTARIFA', sql.Int, IDTARIFA)
            .query('SELECT * FROM TARIFAS WHERE IDTARIFA = @IDTARIFA');

        if (tarifaActual.recordset.length === 0) {
            return res.status(404).json({ message: 'Tarifa no encontrada.' });
        }

        console.log("Datos actuales de la tarifa:", tarifaActual.recordset[0]);

        const resultado = await conexion.request()
            .input('IDTARIFA', sql.Int, IDTARIFA)
            .input('DESCRIPTARIFA', sql.VarChar, DESCRIPTARIFA)
            .input('COSTOTARIFA', sql.Float, COSTOTARIFA)
            .query(`
                UPDATE TARIFAS
                SET DESCRIPTARIFA = @DESCRIPTARIFA,
                    COSTOTARIFA = @COSTOTARIFA
                WHERE IDTARIFA = @IDTARIFA
            `);

        console.log(resultado);

        res.status(200).json({
            message: "Tarifa actualizada exitosamente",
            datos: { IDTARIFA, DESCRIPTARIFA, COSTOTARIFA }
        });
    } catch (error) {
        console.error("Error al actualizar Tarifa:", error);
        res.status(500).json({ message: "Error del servidor" });
    }
}