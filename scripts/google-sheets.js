// Configuración para Google Sheets
const SHEET_ID = '1KUZJ-Hf7w4U3lXorSzQO0XqF0-K027FQ2olkGFbpCnk';
const API_KEY = 'AIzaSyAIcHUM19akspIxYI9sK27JNvohQiJSHPY';

// URLs para acceder a las hojas
const CATALOGO_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Catálogo!A2:G?key=${API_KEY}`;
const PEDIDOS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Pedidos!A2:G?key=${API_KEY}`;
const APPEND_PEDIDOS_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Pedidos!A1:append?valueInputOption=RAW&key=${API_KEY}`;

// Función para obtener datos del catálogo desde Google Sheets
async function obtenerDatosCatalogo() {
    try {
        console.log('Obteniendo datos del catálogo desde Google Sheets...');
        const response = await fetch(CATALOGO_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values) {
            console.log('No se encontraron datos en el catálogo');
            return [];
        }
        
        console.log(`Se obtuvieron ${data.values.length} productos del catálogo`);
        
        return data.values.map(fila => ({
            idinventario: fila[0] || '',
            descripcion: fila[1] || '',
            stockInicial: parseInt(fila[2]) || 0,
            stockActual: parseInt(fila[3]) || 0,
            stockFinal: parseInt(fila[4]) || 0,
            costo: parseFloat(fila[5]) || 0,
            precioVenta: parseFloat(fila[6]) || 0
        }));
    } catch (error) {
        console.error('Error al obtener datos del catálogo:', error);
        
        // Datos de ejemplo en caso de error
        return [
            { idinventario: "R001", descripcion: "Filtro de Aceite", stockInicial: 50, stockActual: 25, stockFinal: 25, costo: 5.50, precioVenta: 12.99 },
            { idinventario: "R002", descripcion: "Pastillas de Freno", stockInicial: 30, stockActual: 8, stockFinal: 8, costo: 15.75, precioVenta: 32.50 },
            { idinventario: "R003", descripcion: "Bujías", stockInicial: 100, stockActual: 45, stockFinal: 45, costo: 3.25, precioVenta: 8.99 },
            { idinventario: "R004", descripcion: "Aceite Motor 5W-30", stockInicial: 80, stockActual: 0, stockFinal: 0, costo: 18.00, precioVenta: 35.99 },
            { idinventario: "R005", descripcion: "Filtro de Aire", stockInicial: 40, stockActual: 15, stockFinal: 15, costo: 7.80, precioVenta: 18.50 }
        ];
    }
}

// Función para obtener datos de pedidos desde Google Sheets
async function obtenerDatosPedidos() {
    try {
        console.log('Obteniendo datos de pedidos desde Google Sheets...');
        const response = await fetch(PEDIDOS_URL);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.values) {
            console.log('No se encontraron pedidos');
            return [];
        }
        
        console.log(`Se obtuvieron ${data.values.length} pedidos`);
        
        return data.values.map(fila => ({
            idPedido: fila[0] || '',
            fecha: fila[1] || '',
            descripcion: fila[2] || '',
            cantidad: parseInt(fila[3]) || 0,
            precio: parseFloat(fila[4]) || 0,
            total: parseFloat(fila[5]) || 0,
            vendedor: fila[6] || ''
        }));
    } catch (error) {
        console.error('Error al obtener datos de pedidos:', error);
        
        // Datos de ejemplo en caso de error
        return [
            { idPedido: "TG-0000001", fecha: "2023-10-15", descripcion: "Filtro de Aceite", cantidad: 2, precio: 12.99, total: 25.98, vendedor: "Juan Pérez" },
            { idPedido: "TG-0000002", fecha: "2023-10-16", descripcion: "Pastillas de Freno", cantidad: 1, precio: 32.50, total: 32.50, vendedor: "María García" },
            { idPedido: "TG-0000003", fecha: "2023-10-17", descripcion: "Bujías", cantidad: 4, precio: 8.99, total: 35.96, vendedor: "Carlos López" }
        ];
    }
}

// Función para guardar un nuevo pedido en Google Sheets
async function guardarPedidoEnSheets(idPedido, vendedor, productos) {
    try {
        console.log('Guardando pedido en Google Sheets...', { idPedido, vendedor, productos });
        
        const fecha = new Date().toLocaleDateString('es-ES');
        
        // Preparar los datos para enviar
        const filas = productos.map(producto => [
            idPedido,
            fecha,
            producto.descripcion,
            producto.cantidad.toString(),
            producto.precio.toString(),
            producto.total.toString(),
            vendedor
        ]);

        const requestBody = {
            values: filas
        };

        const response = await fetch(APPEND_PEDIDOS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error al guardar: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('Pedido guardado exitosamente:', result);
        return result;
        
    } catch (error) {
        console.error('Error al guardar pedido en Sheets:', error);
        throw error;
    }
}

// Función para actualizar el stock en el catálogo (opcional)
async function actualizarStockEnSheets(productosVendidos) {
    try {
        // Primero obtenemos el catálogo actual
        const catalogo = await obtenerDatosCatalogo();
        
        // Actualizamos el stock para cada producto vendido
        productosVendidos.forEach(productoVendido => {
            const producto = catalogo.find(p => p.idinventario === productoVendido.idinventario);
            if (producto) {
                producto.stockActual -= productoVendido.cantidad;
                producto.stockFinal = producto.stockActual;
            }
        });

        // Aquí iría el código para actualizar el Google Sheet
        // Nota: Actualizar celdas específicas es más complejo y requiere más permisos
        console.log('Stock actualizado localmente:', catalogo);
        
    } catch (error) {
        console.error('Error al actualizar stock:', error);
    }
}