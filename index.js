import Masonry from './src/Masonry.vue';

export default {
    install(app) {
        app.component('WyxosMasonry', Masonry);
        app.component('WMasonry', Masonry);
    }
};

export { Masonry };
