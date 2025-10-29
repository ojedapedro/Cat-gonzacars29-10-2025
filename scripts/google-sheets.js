// Configuración para conexión con Google Sheets
const SHEET_ID = 'TU_SHEET_ID_AQUI'; // Reemplazar con el ID real de la hoja de cálculo
const API_KEY = 'TU_API_KEY_AQUI'; // Reemplazar con tu API Key de Google

// URLs para acceder a las hojas
const CATALOGO_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Catálogo!A2:G?key=${API_KEY}`;
const PEDIDOS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Pedidos!A2:G?key=${API_KEY}`;

// Función para obtener datos del catálogo desde Google Sheets
async function obtenerDatosCatalogo() {
    try {
        const response = await fetch(CATALOGO_URL);
        const data = await response.json();
        
        if (!data.values) {
            return [];
        }
        
        return data.values.map(fila => ({
            idinventario: fila[0],
            descripcion: fila[1],
            stockInicial: parseInt(fila[2]),
            stockActual: parseInt(fila[3]),
            stockFinal: parseInt(fila[4]),
            costo: parseFloat(fila[5]),
            precioVenta: parseFloat(fila[6])
        }));
    } catch (error) {
        console.error('Error al obtener datos del catálogo:', error);
        throw error;
    }
}

// Función para obtener datos de pedidos desde Google Sheets
async function obtenerDatosPedidos() {
    try {
        const response = await fetch(PEDIDOS_URL);
        const data = await response.json();
        
        if (!data.values) {
            return [];
        }
        
        return data.values.map(fila => ({
            idPedido: fila[0],
            fecha: fila[1],
            descripcion: fila[2],
            cantidad: parseInt(fila[3]),
            precio: parseFloat(fila[4]),
            total: parseFloat(fila[5]),
            vendedor: fila[6]
        }));
    } catch (error) {
        console.error('Error al obtener datos de pedidos:', error);
        throw error;
    }
}

// Función para guardar un nuevo pedido en Google Sheets
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    try {
        // Obtener la fecha actual
        const fecha = new Date().toISOString().split('T')[0];
        
        // Preparar datos para enviar
        const datosPedido = productos.map(producto => [
            idPedido,
            fecha,
            producto.descripcion,
            producto.cantidad,
            producto.precio,
            producto.total,
            vendedor
        ]);
        
        // URL para agregar datos a la hoja de Pedidos
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Pedidos!A2:G:append?valueInputOption=RAW&key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: datosPedido
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al guardar el pedido');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al guardar pedido:', error);
        throw error;
    }
}

// Función para actualizar el stock en el catálogo
async function actualizarStockEnCatalogo(productosVendidos) {
    try {
        // Obtener el catálogo actual
        const catalogo = await obtenerDatosCatalogo();
        
        // Actualizar stock para cada producto vendido
        productosVendidos.forEach(productoVendido => {
            const productoCatalogo = catalogo.find(p => p.idinventario === productoVendido.idinventario);
            if (productoCatalogo) {
                productoCatalogo.stockActual -= productoVendido.cantidad;
                productoCatalogo.stockFinal = productoCatalogo.stockActual;
            }
        });
        
        // Preparar datos para actualizar
        const datosActualizados = catalogo.map(producto => [
            producto.idinventario,
            producto.descripcion,
            producto.stockInicial,
            producto.stockActual,
            producto.stockFinal,
            producto.costo,
            producto.precioVenta
        ]);
        
        // URL para actualizar la hoja de Catálogo
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Catálogo!A2:G?valueInputOption=RAW&key=${API_KEY}`;
        
        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: datosActualizados
            })
        });
        
        if (!response.ok) {
            throw new Error('Error al actualizar el stock');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error al actualizar stock:', error);
        throw error;
    }
}