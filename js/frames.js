/**
 * PhotoArt Photo Booth - Custom Frames Engine
 */

const PhotoFrames = {
    gundamDecoMecha: null,
    gundamDecoLogoJp: null,
    gundamDecoEfsf: null,
    gundamDecoHazard: null,

    STORAGE_KEY: 'photoart_custom_frames',

    ASSET_FRAMES: [
        {
            id: 'asset_frame_strip_3',
            name: 'Classic Studio (3 Pose)',
            subtitle: 'Strip Vertikal Life4Cuts',
            file: 'assets/frames/frame_strip_3.png',
            url: 'assets/frames/frame_strip_3.png',
            thumbUrl: 'assets/frames/thumb_frame_strip_3.png',
            layout: 'strip_3',
            layoutLabel: '3 Foto',
            category: 'strip',
            naturalWidth: 840,
            naturalHeight: 2376,
            aspectRatio: 840 / 2376,
            renderMode: 'overlay',
            hasAlphaHoles: true,
            isPublished: true,
            isAssetFrame: true,
            slots: [
                { x: 93, y: 210, width: 655, height: 601, radius: 14 },
                { x: 93, y: 840, width: 655, height: 601, radius: 14 },
                { x: 93, y: 1470, width: 655, height: 601, radius: 14 }
            ]
        },
        {
            id: 'asset_frame_receipt_3',
            name: 'Receipt Strip (3 Pose)',
            subtitle: 'Strip Vertikal Gaya Struk Belanja',
            file: 'assets/frames/receipt_3pose.png',
            url: 'assets/frames/receipt_3pose.png',
            thumbUrl: 'assets/frames/thumb_receipt_3pose.png',
            layout: 'strip_3',
            layoutLabel: '3 Foto',
            category: 'strip',
            naturalWidth: 534,
            naturalHeight: 1602,
            aspectRatio: 534 / 1602,
            renderMode: 'overlay',
            hasAlphaHoles: true,
            isPublished: true,
            isAssetFrame: true,
            slots: [
                { x: 57, y: 322, width: 421, height: 317, radius: 8 },
                { x: 57, y: 678, width: 421, height: 317, radius: 8 },
                { x: 57, y: 1034, width: 421, height: 316, radius: 8 }
            ]
        },
        {
            id: 'asset_frame_borcelle_4',
            name: 'Borcelle Studio Grid (4 Pose)',
            subtitle: 'Grid Majalah Estetik 4 Foto',
            file: 'assets/frames/borcelle_4pose.png',
            url: 'assets/frames/borcelle_4pose.png',
            thumbUrl: 'assets/frames/thumb_borcelle_4pose.png',
            layout: 'grid_4',
            layoutLabel: '4 Foto',
            category: 'grid',
            naturalWidth: 1200,
            naturalHeight: 1800,
            aspectRatio: 1200 / 1800,
            renderMode: 'overlay',
            hasAlphaHoles: true,
            isPublished: true,
            isAssetFrame: true,
            slots: [
                { x: 622, y: 56, width: 527, height: 403, radius: 0 },
                { x: 56, y: 358, width: 506, height: 328, radius: 0 },
                { x: 33, y: 757, width: 544, height: 418, radius: 0 },
                { x: 605, y: 1202, width: 554, height: 475, radius: 0 }
            ]
        }
    ],

    themes: [],
    allThemes: [],
    _imageCache: {},

    init: function() {
        this.loadCustomThemes();
        this.syncWithServer();
    },

    repairAssetFrame: function(frame) {
        if (!frame) return frame;
        const fid = String(frame.id || '').toLowerCase();
        let canonical = null;
        if (fid.includes('borcelle')) {
            canonical = this.ASSET_FRAMES.find(t => t.id === 'asset_frame_borcelle_4');
        } else if (fid.includes('receipt')) {
            canonical = this.ASSET_FRAMES.find(t => t.id === 'asset_frame_receipt_3');
        } else if (fid.includes('strip_3')) {
            canonical = this.ASSET_FRAMES.find(t => t.id === 'asset_frame_strip_3');
        }
        if (canonical) {
            const pub = (frame.isPublished !== undefined) ? frame.isPublished : canonical.isPublished;
            return { ...canonical, isPublished: pub };
        }
        return frame;
    },

    loadCustomThemes: function() {
        let customList = [];
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const list = JSON.parse(raw);
                if (Array.isArray(list)) customList = list;
            }
        } catch (e) {}

        const DEPRECATED_IDS = ['asset_frame_korean_4', 'asset_frame_grid_4', 'asset_borcelle_studio_grid_4_pose'];
        customList = customList.filter(f => !DEPRECATED_IDS.includes(f.id));
        const combined = this.ASSET_FRAMES.map(af => ({ ...af }));

        combined.forEach(af => {
            const stored = customList.find(c => c.id === af.id || (af.id.includes('borcelle') && String(c.id).includes('borcelle')) || (af.id.includes('receipt') && String(c.id).includes('receipt')));
            if (stored && stored.isPublished !== undefined) af.isPublished = stored.isPublished;
        });

        customList.forEach(cf => {
            const isAsset = this.ASSET_FRAMES.some(af => af.id === cf.id);
            if (!isAsset && !combined.some(t => t.id === cf.id)) combined.push(cf);
        });

        this.allThemes = combined;
        this.themes = combined.filter(f => f.isPublished !== false);
        this.saveCustomThemes();
        return this.themes;
    },

    saveCustomThemes: function() {
        try {
            const toSave = (this.allThemes && this.allThemes.length > 0) ? this.allThemes : this.themes;
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {}
    },

    async syncWithServer(adminToken = '') {
        try {
            const headers = {};
            if (adminToken) headers['X-Admin-Token'] = adminToken;
            const res = await fetch('/api/custom-frames', { headers });
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.frames)) {
                    this.loadCustomThemes();
                }
            }
        } catch (e) {}
        return this.themes;
    },

    getTheme: function(id) {
        const strId = String(id || '').toLowerCase();
        if (strId.includes('borcelle')) return this.ASSET_FRAMES[2];
        if (strId.includes('receipt')) return this.ASSET_FRAMES[1];
        if (strId.includes('strip_3')) return this.ASSET_FRAMES[0];
        const found = (this.allThemes || this.themes || []).find(t => t.id === id || t.layout === id);
        return found ? this.repairAssetFrame(found) : this.ASSET_FRAMES[0];
    },

    getFrameImage: function(theme) {
        return new Promise((resolve) => {
            if (!theme) return resolve(null);
            const id = theme.id;
            if (this._imageCache[id] && this._imageCache[id].complete && this._imageCache[id].naturalWidth > 0) {
                return resolve(this._imageCache[id]);
            }
            const src = theme.url || theme.file || theme.frameDataUrl;
            if (!src) return resolve(null);
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                this._imageCache[id] = img;
                resolve(img);
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    },

    getLayoutConfig: function(layoutMode, canvasWidth = 840, canvasHeight = null, theme = null) {
        if (!theme && typeof layoutMode === 'object' && layoutMode !== null) theme = layoutMode;
        if (!theme) theme = PhotoFrames.getTheme(layoutMode);

        let width = canvasWidth;
        let height;
        if (theme && theme.aspectRatio && theme.aspectRatio > 0) {
            height = Math.round(width / theme.aspectRatio);
        } else {
            height = Math.round(width * 1.65);
        }

        const frameSlots = theme && (theme.slots || theme.detectedSlots);
        if (frameSlots && Array.isArray(frameSlots) && frameSlots.length > 0) {
            const nativeW = theme.naturalWidth || width;
            const nativeH = theme.naturalHeight || height;
            const scaleX = width / nativeW;
            const scaleY = height / nativeH;

            const slots = frameSlots.map(s => ({
                x: Math.round(s.x * scaleX),
                y: Math.round(s.y * scaleY),
                width: Math.round(s.width * scaleX),
                height: Math.round(s.height * scaleY),
                radius: Math.round((s.radius !== undefined ? s.radius : 12) * scaleX)
            }));

            return { width, height, slots, headerH: 0, footerH: 0, count: slots.length, layoutMode: theme.layout };
        }

        return { width, height, slots: [], headerH: 0, footerH: 0, count: 3, layoutMode: 'strip_3' };
    },

    renderFrameDecorations: async function(ctx, theme, config) {
        ctx.fillStyle = (theme && theme.bg) || '#ffffff';
        ctx.fillRect(0, 0, config.width, config.height);
    },

    renderOverlay: async function(ctx, theme, config) {
        const frameImg = await this.getFrameImage(theme);
        if (frameImg) {
            ctx.drawImage(frameImg, 0, 0, config.width, config.height);
        }
    }
};

PhotoFrames.init();
window.PhotoFrames = PhotoFrames;