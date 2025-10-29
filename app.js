// Variables globales
let catalogo = [];
let pedidos = [];
let pedidoActual = [];
let correlativoPedido = 'TG-0000001';

// Inicialización de la aplicación
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
});

function inicializarApp() {
    // Configurar navegación
    configurarNavegacion();
    
    // Cargar datos desde Google Sheets
    cargarCatalogo();
    cargarPedidos();
    
    // Configurar eventos
    configurarEventos();
}

function configurarNavegacion() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover clase activa de todos los enlaces
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Agregar clase activa al enlace clickeado
            this.classList.add('active');
            
            // Ocultar todas las secciones
            document.querySelectorAll('.section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Mostrar la sección correspondiente
            const targetId = this.getAttribute('href').substring(1);
            document.getElementById(targetId).classList.add('active');
        });
    });
}

function configurarEventos() {
    // Filtros del catálogo
    document.getElementById('buscar-producto').addEventListener('input', filtrarCatalogo);
    document.getElementById('filtro-stock').addEventListener('change', filtrarCatalogo);
    
    // Formulario de pedido
    document.getElementById('producto-pedido').addEventListener('change', actualizarInfoProducto);
    document.getElementById('cantidad-pedido').addEventListener('input', calcularTotalPedido);
    document.getElementById('form-pedido').addEventListener('submit', agregarProductoPedido);
    document.getElementById('generar-pdf').addEventListener('click', generarPDFPedido);
}

async function cargarCatalogo() {
    try {
        // Simulación de carga desde Google Sheets
        catalogo = await obtenerDatosCatalogo();
        mostrarCatalogo(catalogo);
        llenarSelectProductos();
    } catch (error) {
        console.error('Error al cargar el catálogo:', error);
        mostrarError('No se pudo cargar el catálogo de productos');
    }
}

async function cargarPedidos() {
    try {
        // Simulación de carga desde Google Sheets
        pedidos = await obtenerDatosPedidos();
        mostrarPedidos(pedidos);
    } catch (error) {
        console.error('Error al cargar los pedidos:', error);
        mostrarError('No se pudo cargar el historial de pedidos');
    }
}

function mostrarCatalogo(productos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-catalogo');
    cuerpoTabla.innerHTML = '';
    
    productos.forEach(producto => {
        const fila = document.createElement('tr');
        
        // Determinar clase según stock
        if (producto.stockActual <= 0) {
            fila.classList.add('sin-stock');
        } else if (producto.stockActual < 10) {
            fila.classList.add('stock-bajo');
        }
        
        fila.innerHTML = `
            <td>${producto.idinventario}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.stockInicial}</td>
            <td>${producto.stockActual}</td>
            <td>${producto.stockFinal}</td>
            <td>$${producto.costo.toFixed(2)}</td>
            <td>$${producto.precioVenta.toFixed(2)}</td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
}

function mostrarPedidos(listaPedidos) {
    const cuerpoTabla = document.getElementById('cuerpo-tabla-pedidos');
    cuerpoTabla.innerHTML = '';
    
    listaPedidos.forEach(pedido => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${pedido.idPedido}</td>
            <td>${formatearFecha(pedido.fecha)}</td>
            <td>${pedido.descripcion}</td>
            <td>${pedido.cantidad}</td>
            <td>$${pedido.precio.toFixed(2)}</td>
            <td>$${pedido.total.toFixed(2)}</td>
            <td>${pedido.vendedor}</td>
            <td>
                <button class="btn btn-danger" onclick="eliminarPedido('${pedido.idPedido}')">Eliminar</button>
            </td>
        `;
        
        cuerpoTabla.appendChild(fila);
    });
}

function filtrarCatalogo() {
    const textoBusqueda = document.getElementById('buscar-producto').value.toLowerCase();
    const filtroStock = document.getElementById('filtro-stock').value;
    
    let productosFiltrados = catalogo.filter(producto => {
        // Filtro por texto de búsqueda
        const coincideTexto = producto.descripcion.toLowerCase().includes(textoBusqueda) || 
                             producto.idinventario.toLowerCase().includes(textoBusqueda);
        
        // Filtro por stock
        let coincideStock = true;
        if (filtroStock === 'stock-bajo') {
            coincideStock = producto.stockActual > 0 && producto.stockActual < 10;
        } else if (filtroStock === 'sin-stock') {
            coincideStock = producto.stockActual <= 0;
        }
        
        return coincideTexto && coincideStock;
    });
    
    mostrarCatalogo(productosFiltrados);
}

function llenarSelectProductos() {
    const select = document.getElementById('producto-pedido');
    select.innerHTML = '<option value="">Seleccione un producto</option>';
    
    catalogo.forEach(producto => {
        if (producto.stockActual > 0) {
            const option = document.createElement('option');
            option.value = producto.idinventario;
            option.textContent = `${producto.idinventario} - ${producto.descripcion} (Stock: ${producto.stockActual})`;
            option.dataset.precio = producto.precioVenta;
            option.dataset.stock = producto.stockActual;
            option.dataset.descripcion = producto.descripcion;
            select.appendChild(option);
        }
    });
}

function actualizarInfoProducto() {
    const select = document.getElementById('producto-pedido');
    const productoId = select.value;
    const infoProducto = document.getElementById('info-producto');
    
    if (productoId) {
        const productoSeleccionado = select.options[select.selectedIndex];
        const precio = parseFloat(productoSeleccionado.dataset.precio);
        const stock = parseInt(productoSeleccionado.dataset.stock);
        
        document.getElementById('precio-unitario').textContent = `$${precio.toFixed(2)}`;
        document.getElementById('stock-disponible').textContent = stock;
        
        infoProducto.style.display = 'block';
        calcularTotalPedido();
    } else {
        infoProducto.style.display = 'none';
    }
}

function calcularTotalPedido() {
    const cantidad = parseInt(document.getElementById('cantidad-pedido').value) || 0;
    const select = document.getElementById('producto-pedido');
    
    if (select.value && cantidad > 0) {
        const precio = parseFloat(select.options[select.selectedIndex].dataset.precio);
        const total = cantidad * precio;
        document.getElementById('total-pedido').textContent = `$${total.toFixed(2)}`;
    } else {
        document.getElementById('total-pedido').textContent = '-';
    }
}

function agregarProductoPedido(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('producto-pedido').value;
    const cantidad = parseInt(document.getElementById('cantidad-pedido').value);
    const vendedor = document.getElementById('vendedor').value.trim();
    
    if (!productoId || !cantidad || cantidad <= 0 || !vendedor) {
        mostrarError('Por favor complete todos los campos correctamente');
        return;
    }
    
    const select = document.getElementById('producto-pedido');
    const productoSeleccionado = select.options[select.selectedIndex];
    const precio = parseFloat(productoSeleccionado.dataset.precio);
    const descripcion = productoSeleccionado.dataset.descripcion;
    const stockDisponible = parseInt(productoSeleccionado.dataset.stock);
    
    if (cantidad > stockDisponible) {
        mostrarError(`No hay suficiente stock. Stock disponible: ${stockDisponible}`);
        return;
    }
    
    // Verificar si el producto ya está en el pedido
    const productoExistente = pedidoActual.find(item => item.idinventario === productoId);
    
    if (productoExistente) {
        // Actualizar cantidad si ya existe
        productoExistente.cantidad += cantidad;
        productoExistente.total = productoExistente.cantidad * precio;
    } else {
        // Agregar nuevo producto al pedido
        pedidoActual.push({
            idinventario: productoId,
            descripcion: descripcion,
            cantidad: cantidad,
            precio: precio,
            total: cantidad * precio
        });
    }
    
    // Actualizar la tabla del pedido actual
    mostrarPedidoActual();
    
    // Limpiar formulario
    document.getElementById('cantidad-pedido').value = '';
    document.getElementById('producto-pedido').value = '';
    document.getElementById('info-producto').style.display = 'none';
    
    // Habilitar botón de generar PDF si hay productos
    document.getElementById('generar-pdf').disabled = pedidoActual.length === 0;
}

function mostrarPedidoActual() {
    const cuerpoTabla = document.getElementById('cuerpo-pedido-actual');
    cuerpoTabla.innerHTML = '';
    
    let totalGeneral = 0;
    
    pedidoActual.forEach((producto, index) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${producto.idinventario}</td>
            <td>${producto.descripcion}</td>
            <td>${producto.cantidad}</td>
            <td>$${producto.precio.toFixed(2)}</td>
            <td>$${producto.total.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="eliminarProductoPedido(${index})">Eliminar</button>
            </td>
        `;
        
        cuerpoTabla.appendChild(fila);
        totalGeneral += producto.total;
    });
    
    document.getElementById('total-general').textContent = `$${totalGeneral.toFixed(2)}`;
}

function eliminarProductoPedido(index) {
    pedidoActual.splice(index, 1);
    mostrarPedidoActual();
    
    // Deshabilitar botón de generar PDF si no hay productos
    document.getElementById('generar-pdf').disabled = pedidoActual.length === 0;
}

function generarPDFPedido() {
    const vendedor = document.getElementById('vendedor').value.trim();
    
    if (!vendedor) {
        mostrarError('Por favor ingrese el nombre del vendedor');
        return;
    }
    
    if (pedidoActual.length === 0) {
        mostrarError('No hay productos en el pedido');
        return;
    }
    
    // Generar PDF
    const pdf = generarPDF(correlativoPedido, vendedor, pedidoActual);
    
    // Incrementar correlativo
    correlativoPedido = incrementarCorrelativo(correlativoPedido);
    
    // Guardar pedido (simulación)
    guardarPedido(correlativoPedido, vendedor, pedidoActual);
    
    // Limpiar pedido actual
    pedidoActual = [];
    mostrarPedidoActual();
    document.getElementById('vendedor').value = '';
    document.getElementById('generar-pdf').disabled = true;
    
    mostrarExito(`Pedido ${correlativoPedido} generado correctamente`);
}

function incrementarCorrelativo(correlativo) {
    const numero = parseInt(correlativo.split('-')[1]);
    const nuevoNumero = numero + 1;
    return `TG-${nuevoNumero.toString().padStart(7, '0')}`;
}

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-ES');
}

function mostrarError(mensaje) {
    // Implementar notificación de error
    alert(`Error: ${mensaje}`);
}

function mostrarExito(mensaje) {
    // Implementar notificación de éxito
    alert(`Éxito: ${mensaje}`);
}

// Funciones de simulación (serán reemplazadas por las reales)
async function obtenerDatosCatalogo() {
    // Simulación de datos del catálogo
    return [
        { idinventario: "R001", descripcion: "Filtro de Aceite", stockInicial: 50, stockActual: 25, stockFinal: 25, costo: 5.50, precioVenta: 12.99 },
        { idinventario: "R002", descripcion: "Pastillas de Freno", stockInicial: 30, stockActual: 8, stockFinal: 8, costo: 15.75, precioVenta: 32.50 },
        { idinventario: "R003", descripcion: "Bujías", stockInicial: 100, stockActual: 45, stockFinal: 45, costo: 3.25, precioVenta: 8.99 },
        { idinventario: "R004", descripcion: "Aceite Motor 5W-30", stockInicial: 80, stockActual: 0, stockFinal: 0, costo: 18.00, precioVenta: 35.99 },
        { idinventario: "R005", descripcion: "Filtro de Aire", stockInicial: 40, stockActual: 15, stockFinal: 15, costo: 7.80, precioVenta: 18.50 }
    ];
}

async function obtenerDatosPedidos() {
    // Simulación de datos de pedidos
    return [
        { idPedido: "TG-0000001", fecha: "2023-10-15", descripcion: "Filtro de Aceite", cantidad: 2, precio: 12.99, total: 25.98, vendedor: "Juan Pérez" },
        { idPedido: "TG-0000002", fecha: "2023-10-16", descripcion: "Pastillas de Freno", cantidad: 1, precio: 32.50, total: 32.50, vendedor: "María García" },
        { idPedido: "TG-0000003", fecha: "2023-10-17", descripcion: "Bujías", cantidad: 4, precio: 8.99, total: 35.96, vendedor: "Carlos López" }
    ];
}

async function guardarPedido(idPedido, vendedor, productos) {
    // Simulación de guardado de pedido
    console.log("Guardando pedido:", { idPedido, vendedor, productos });
    
    // Aquí se implementaría la conexión real con Google Sheets
    // await guardarPedidoEnSheets(idPedido, vendedor, productos);
}