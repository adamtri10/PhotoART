/**
 * PhotoArt Photo Booth - Filters Engine
 * Canvas & CSS-based real-time image filters
 */

const PhotoFilters = {
    list: [
        { id: 'normal', name: 'Normal', css: 'none', thumb: 'assets/filters/normal.png', desc: 'Warna asli natural' },
        { id: 'bw', name: 'B&W Classic', css: 'grayscale(100%) contrast(120%)', thumb: 'assets/filters/bw.png', desc: 'Hitam putih monokrom elegan' },
        { id: 'vintage', name: 'Vintage 90s', css: 'sepia(35%) contrast(110%) brightness(105%) saturate(85%) hue-rotate(-10deg)', thumb: 'assets/filters/vintage.png', desc: 'Nuansa nostalgia era 90-an' },
        { id: 'sepia', name: 'Sepia Klasik', css: 'sepia(80%) contrast(115%) brightness(95%)', thumb: 'assets/filters/sepia.png', desc: 'Warna coklat hangat lawas' },
        { id: 'korean_pastel', name: 'Pastel Dream', css: 'brightness(112%) contrast(92%) saturate(125%) hue-rotate(5deg)', thumb: 'assets/filters/korean_pastel.png', desc: 'Aesthetic Korea lembut & glowing' },
        { id: 'warm_sunset', name: 'Golden Hour', css: 'sepia(25%) saturate(140%) brightness(108%) contrast(105%) hue-rotate(-15deg)', thumb: 'assets/filters/warm_sunset.png', desc: 'Hangat keemasan sore hari' },
        { id: 'cold_moody', name: 'Cold Moody', css: 'contrast(115%) brightness(98%) saturate(90%) hue-rotate(185deg)', thumb: 'assets/filters/cold_moody.png', desc: 'Tone sinematik sejuk & keren' },
        { id: 'cyberpunk', name: 'Cyberpunk Pop', css: 'contrast(135%) saturate(160%) hue-rotate(320deg)', thumb: 'assets/filters/cyberpunk.png', desc: 'Warna neon pop berani' },
        { id: 'high_glam', name: 'High Glam', css: 'brightness(115%) contrast(110%) saturate(130%)', thumb: 'assets/filters/high_glam.png', desc: 'Cerah, tajam dan mempesona' },
        { id: 'noir_film', name: 'Noir Drama', css: 'grayscale(100%) contrast(180%) brightness(85%)', thumb: 'assets/filters/noir_film.png', desc: 'Kontras tinggi dramatis' }
    ],

    getFilter: function(id) {
        return this.list.find(f => f.id === id) || this.list[0];
    },

    getThumbnail: function(id) {
        const filter = this.getFilter(id);
        return filter.thumb || `assets/filters/${filter.id}.png`;
    },

    /**
     * Apply filter directly to canvas context
     */
    applyToContext: function(ctx, filterId, width, height) {
        const filter = this.getFilter(filterId);
        if (filter.id === 'normal') return;

        // Apply CSS filter property to canvas context if supported
        if (ctx.filter !== undefined) {
            ctx.filter = filter.css;
        }
    },

    /**
     * Post-processing for special effects like film grain
     */
    applyGrain: function(ctx, width, height, amount = 15) {
        try {
            const imgData = ctx.getImageData(0, 0, width, height);
            const data = imgData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = (Math.random() - 0.5) * amount;
                data[i] = Math.min(255, Math.max(0, data[i] + noise));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
            }
            ctx.putImageData(imgData, 0, 0);
        } catch (e) {
            console.warn("Grain processing skipped due to canvas security/size:", e);
        }
    }
};

window.PhotoFilters = PhotoFilters;

