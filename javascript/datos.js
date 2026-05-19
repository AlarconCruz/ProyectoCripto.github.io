document.addEventListener('DOMContentLoaded', function () {
    // Inicializar el mapa
    var mapa = L.map('map', { attributionControl: false }).setView([52, 30], 4);

    var paises = ["France", "Sweden", "Germany", "Russia", "Denmark", "Spain", "Romania"]

    var coloresAleatorios = [
        "#0AFAF7", "#2A772B",
        "#F77429", "#28EA20",
        "#C22C23", "#E059EF",
        "#1FD183", "#D41E49",
        "#154831", "#7DA862"
    ];

    // Agregar etiquetas de país
    var paisesGuerras = [
        { nombre: "Alemania", lat: 51.165691, lon: 10.451526, Guerra: 1 },
        { nombre: "África del Norte", lat: 9.1021, lon: 18.2812, Guerra: 1 },
        { nombre: "Océano Pacífico", lat: 0, lon: 160, Guerra: 1 },
        { nombre: "Océano Atlántico", lat: 0, lon: -20, Guerra: 1 }
    ];

    // Estilo de icono personalizado
    var iconoPersonalizado = L.icon({
        iconUrl: 'img/union.png', // Reemplazar con la URL de tu icono personalizado
        iconSize: [40, 40], // Tamaño del icono
        iconAnchor: [15, 40], // Punto del icono que corresponderá a la ubicación del marcador
        popupAnchor: [0, -40] // Punto desde el cual debe abrirse el popup en relación con el iconAnchor
    });

    // Datos
    var datosGuerras = [
        {
            pais: "Alemania",
            lugar: "Polonia",
            fecha: "1939",
            descripcion: "Inicio la Segunda Guerra Mundial. Como respuesta, Gran Bretaña y Francia le declararon la guerra a Alemania."
        },
        {
            pais: "África del Norte",
            lugar: "Libia Italiana y Reino de Egipto (Desierto Occidental)",
            fecha: "1940",
            descripcion: "La Campaña en el Norte de África durante la Segunda Guerra Mundial enfrentó a las potencias del Eje y las Aliadas. El Reino Unido y su imperio, junto con exiliados de la Europa ocupada, lideraron los esfuerzos de guerra. Sin embargo, todo cambió cuando los Estados Unidos se unieron al conflicto el 11 de mayo, brindando ayuda directa a las fuerzas aliadas en el Norte de África."
        },
        {
            pais: "Océano Pacífico",
            lugar: "Sus islas y en Asia Orientals",
            fecha: "1941",
            descripcion: "En 1937, el Imperio del Japón inició nuevamente su expansión por China, dando inicio a la Segunda Guerra Sino-japonesa. Después de librar dos batallas con la Unión Soviética, con resultados adversos, Japón ocupó la Indochina, colonia francesa, buscando finalizar la larga contienda en suelo de China."
        },
        {
            pais: "Océano Atlántico",
            lugar: "Enfrentamiento naval ",
            fecha: "1939",
            descripcion: "Conscientes de que la Kriegsmarine no podría derrotar a la Royal Navy británica, los marinos alemanes intentaron bloquear al Reino Unido, destruyendo los buques mercantes que le suministraban recursos."
        }
    ];

    function mezclarDatos(pais) {

        var texto = ``

        datosGuerras.forEach(function (item) {
            if (item.pais === pais) {
                texto = texto + "<b>" + item.lugar + " " + item.fecha + " </b><br>" + item.descripcion + "<br>"
            }
        });
        return texto
    }


    paisesGuerras.forEach(function (guerra) {
        L.marker([guerra.lat, guerra.lon], { icon: iconoPersonalizado }).addTo(mapa)
            .bindPopup(`<b>${guerra.nombre}</b><br>Guerras: ${guerra.Guerra}<br>${mezclarDatos(guerra.nombre)}`);
    });

    // Crear una capa GeoJSON y agregarla al mapa
    var capaGeoJSON = L.geoJSON(geojsonData, {
        style: function (feature) {
            // Personalizar el estilo según las propiedades de la entidad si es necesario
            return {
                fillColor: getColor(feature.properties.ADMIN),
                fillOpacity: 0.5,
                color: 'black',
                weight: 1
            };
        },
        onEachFeature: function (feature, layer) {
            // Add country name to popup
            layer.bindPopup(feature.properties.ADMIN);
        }
    }).addTo(mapa);

    // Función para seleccionar un color aleatorio del arreglo
    function elegirColorAleatorio() {
        const indiceAleatorio = Math.floor(Math.random() * coloresAleatorios.length);
        return coloresAleatorios[indiceAleatorio];
    }

    function getColor(valor) {
        // Definir escala de colores según los valores de los datos
        return paises.includes(valor) ? '#fff' : elegirColorAleatorio();
    }

});