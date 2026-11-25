import { store } from '../state/store.js';
import { getCharacters } from '../core/api.js';

/**
 * Objeto Dashboard que maneja toda la lógica de la interfaz de usuario.
 */
export const dashboard = {
    // Referencias a elementos del DOM
    elements: {
        grid: document.getElementById('charactersGrid'),
        favoritesList: document.getElementById('favoritesList'),
        search: document.getElementById('characterSearch'),
        filter: document.getElementById('statusFilter'),
        loader: document.getElementById('loader'),
        noResults: document.getElementById('noResults'),
        prevBtn: document.getElementById('prevPage'),
        nextBtn: document.getElementById('nextPage'),
        pageInfo: document.getElementById('pageInfo')
    },

    /**
     * Inicializa la página cargando los eventos y los datos iniciales.
     */
    async init() {
        this.setupEventListeners();
        await this.loadCharacters();
        this.renderFavorites(); //Para rendizar los favoritos y se muestren
    },

    /**
     * Configura los escuchadores de eventos para búsqueda, filtro y paginación.
     */
    setupEventListeners() {
        // TODO: 1. Escuchar el evento 'input' en el input de búsqueda (this.elements.search)
        //          - Se sugiere implementar un 'debounce' (retardo) de 500ms para evitar múltiples peticiones seguidas al API.
        //          - Al escribir, actualizar store.state.filters.name con el texto limpio y reiniciar store.state.currentPage a 1.
        //          - Llamar a loadCharacters() para recargar la grilla.
        //
        // TODO: 2. Escuchar el evento 'change' en el select de filtros (this.elements.filter)
        //          - Actualizar store.state.filters.status con el valor del select y reiniciar store.state.currentPage a 1.
        //          - Llamar a loadCharacters() para recargar.
        //
        // TODO: 3. Escuchar el evento 'click' en el botón de página anterior (this.elements.prevBtn)
        //          - Si store.state.currentPage es mayor que 1, restarle 1.
        //          - Llamar a loadCharacters() y hacer scroll hacia arriba (window.scrollTo({ top: 0, behavior: 'smooth' })).
        //
        // TODO: 4. Escuchar el evento 'click' en el botón de página siguiente (this.elements.nextBtn)
        //          - Si store.state.currentPage es menor que store.state.totalPages, sumarle 1.
        //          - Llamar a loadCharacters() y hacer scroll hacia arriba.
        let timeout;
        this.elements.search.addEventListener('input', (e) =>{
            clearTimeout(timeout);
            timeout = setTimeout(()=>{
                store.state.filters.name = e.target.value.trim();
                store.state.currentPage = 1;
                //cargar los personajes filtrados
                this.loadCharacters();
            }, 500)
        });


        this.elements.filter.addEventListener('change', (e)=>{
            store.state.filters.status = e.target.value;
            store.state.currentPage = 1;
            this.loadCharacters();
        });

        this.elements.prevBtn.addEventListener('click', () => {
            if (store.state.currentPage > 1) {
                store.state.currentPage -= 1;
                this.loadCharacters();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

        this.elements.nextBtn.addEventListener('click', () => {
            if (store.state.currentPage < store.state.totalPages) {
                store.state.currentPage += 1;
                this.loadCharacters();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });

    },

    /**
     * Solicita los personajes a la API según el estado actual de filtros y página.
     */
    async loadCharacters() {
        this.showLoader(true);
        this.elements.noResults.classList.add('hidden');
        const data = await getCharacters(store.state.currentPage, store.state.filters);
        if (data.error || !data.results) {
            store.state.characters = [];
            store.state.totalPages = 0;
            this.elements.noResults.classList.remove('hidden');
        } else {
            store.state.characters = data.results;
            store.state.totalPages = data.info.pages;
        }
        this.renderGrid();
        this.updatePagination();
        this.showLoader(false);
    },

    /**
     * Dibuja la cuadrícula de personajes en el DOM.
     */
    renderGrid() {
        
        // TODO: 1. Limpiar las tarjetas de personajes anteriores en la grilla (puedes borrar todos los elementos con clase '.character-card').
        const cards= this.elements.grid.querySelectorAll('.character-card');
        cards.forEach(card => card.remove());
        store.state.characters.forEach(character => {
            const isFav= store.isFavorite(character.id);
            const card= document.createElement('div');
            card.className= 'character-card';
            card.innerHTML = `
                <div class="card-image-wrapper">
                    <img src="${character.image}" alt="${character.name}" loading="lazy">
                </div>
                <div class="card-content">
                    <h3 class="character-name">${character.name}</h3>
                    <div class="status-label status-${character.status.toLowerCase()}">
                        <span class="status-indicator"></span>
                        ${character.status}
                    </div>
                    <button class="fav-btn ${ isFav ? 'active': '' }" data-id="${character.id}">
                        <i data-lucide="star"></i>
                        <span>${ isFav ? 'En Favoritos' : "Añadir a Favoritos"}</span>
                    </button>
                </div>  
            `;
            card.querySelector('.fav-btn').addEventListener('click', () => {
                store.toggleFavorite(character);
                this.renderGrid();
                this.renderFavorites();
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
            this.elements.grid.appendChild(card);
        })
        if (window.lucide) {
            window.lucide.createIcons();
        }
        // TODO: 2. Recorrer la lista de personajes en store.state.characters.
        // TODO: 3. Para cada personaje, crear un elemento div con la clase 'character-card'.
        // TODO: 4. Inyectar el HTML de la tarjeta (usa la plantilla del personaje que viene en recursos/resursos.md).
        //          - Asegúrate de mapear: imagen, nombre, estado (Alive, Dead, Unknown - usa las clases css status-alive, status-dead, status-unknown) e ID del personaje.
        //          - Marca el botón de favoritos como activo (clase 'active') si el personaje ya está en favoritos (usa store.isFavorite(id)).
        // TODO: 5. Agregar un escuchador de eventos click al botón de favorito (.fav-btn) de la tarjeta:
        //          - Llamar a store.toggleFavorite(personaje) para alternarlo.
        //          - Actualizar visualmente el botón (añadir/quitar clase 'active' y cambiar texto a 'En Favoritos' o 'Añadir a Favoritos').
        //          - Volver a renderizar la sección de favoritos lateral (renderFavorites()) para reflejar el cambio.
        //          - Invocar lucide.createIcons() para refrescar los iconos de Lucide en los nuevos elementos.
        // TODO: 6. Agregar la tarjeta creada al contenedor de la grilla (this.elements.grid.appendChild).
        // TODO: 7. Al finalizar el bucle, llamar a lucide.createIcons() para refrescar los iconos iniciales.
    },

    /**
     * Agrega una lista de los personajes favoritos al costado de la página
     */
    renderFavorites() {
        const favoritesList = this.elements.favoritesList;
        favoritesList.innerHTML = '';

        if (store.state.favorites.length === 0) {
            favoritesList.innerHTML = '<div class="empty-favorites"><p>No favorites yet</p></div>';
            return;
        }

        store.state.favorites.forEach(favorite => {
            const item = document.createElement('div');
            item.className = 'fav-item';
            item.innerHTML = `
                <img src="${favorite.image}" alt="${favorite.name}">
                <span>${favorite.name}</span>
                <button class="remove-fav" type="button" aria-label="Remove ${favorite.name}">
                    <i data-lucide="x"></i>
                </button>
            `;
            item.querySelector('.remove-fav').addEventListener('click', () => {
                store.toggleFavorite(favorite);
                this.renderFavorites();
                this.renderGrid();
                if (window.lucide) {
                    window.lucide.createIcons();
                }
            });
            favoritesList.appendChild(item);
        });
        if (window.lucide) {
            window.lucide.createIcons();
        }
    },

    /**
     * Actualiza el estado de los botones de paginación y el texto informativo.
     */
    updatePagination() {
        this.elements.prevBtn.disabled = store.state.currentPage <= 1;
        this.elements.nextBtn.disabled =
            store.state.totalPages === 0 || store.state.currentPage >= store.state.totalPages;
        this.elements.pageInfo.textContent = store.state.totalPages === 0
            ? 'Page 0'
            : `Página ${store.state.currentPage} de ${store.state.totalPages}`;
    },

    /**
     * Muestra u oculta el spinner de carga.
     * 
     * @param {boolean} show - True para mostrar, False para ocultar
     */
    showLoader(show) {
        this.elements.loader.classList.toggle('hidden', !show);
        // TODO: Alternar la clase 'hidden' en el contenedor del loader (this.elements.loader) de acuerdo al parámetro 'show'.
    }
};
