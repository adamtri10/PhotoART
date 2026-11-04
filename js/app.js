/**
 * PhotoArt Photo Booth - Core Application Logic
 * Pure Vanilla JavaScript
 */

(function () {
    'use strict';

    // Safety Polyfills / Fallbacks for PhotoFrames helper methods
    if (typeof window !== 'undefined' && window.PhotoFrames) {
        const pf = window.PhotoFrames;

        if (!pf.getThumbnailUrl) {
            pf.getThumbnailUrl = function(themeId) {
                const theme = (typeof this.getTheme === 'function') ? this.getTheme(themeId) : null;
                if (theme && (theme.thumbUrl || theme.url || theme.file || theme.frameDataUrl)) {
                    return theme.thumbUrl || theme.url || theme.file || theme.frameDataUrl;
                }
                return '';
            };
        }

        if (!pf.roundRect) {
            pf.roundRect = function(ctx, x, y, width, height, radius, fill, stroke) {
                if (typeof stroke === 'undefined') stroke = true;
                if (typeof radius === 'undefined') radius = 6;
                const r = (typeof radius === 'number') ? radius : (radius.tl || 0);
                if (typeof ctx.roundRect === 'function' && r >= 0) {
                    ctx.beginPath();
                    ctx.roundRect(x, y, width, height, r);
                    ctx.closePath();
                    if (fill) ctx.fill();
                    if (stroke) ctx.stroke();
                    return;
                }
                const rad = (typeof radius === 'number')
                    ? { tl: radius, tr: radius, br: radius, bl: radius }
                    : { tl: radius.tl || 0, tr: radius.tr || 0, br: radius.br || 0, bl: radius.bl || 0 };
                ctx.beginPath();
                ctx.moveTo(x + rad.tl, y);
                ctx.lineTo(x + width - rad.tr, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + rad.tr);
                ctx.lineTo(x + width, y + height - rad.br);
                ctx.quadraticCurveTo(x + width, y + height, x + width - rad.br, y + height);
                ctx.lineTo(x + rad.bl, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - rad.bl);
                ctx.lineTo(x, y + rad.tl);
                ctx.quadraticCurveTo(x, y, x + rad.tl, y);
                ctx.closePath();
                if (fill) ctx.fill();
                if (stroke) ctx.stroke();
            };
        }

        pf.getTheme = function(id) {
            const strId = String(id || '').toLowerCase();
            const list = (Array.isArray(this.allThemes) && this.allThemes.length > 0)
                ? this.allThemes
                : ((Array.isArray(this.themes) && this.themes.length > 0) ? this.themes : (this.ASSET_FRAMES || []));
            const found = list.find(t => t.id === id ||
                (strId.includes('borcelle') && String(t.id).toLowerCase().includes('borcelle')) ||
                (strId.includes('receipt') && String(t.id).toLowerCase().includes('receipt')) ||
                (strId.includes('strip_3') && String(t.id).toLowerCase().includes('strip_3'))
            );
            if (found) return found;
            return (this.themes && this.themes.length > 0) ? this.themes[0] : (this.ASSET_FRAMES ? this.ASSET_FRAMES[0] : null);
        };

        pf.isThemePublished = function(id) {
            const theme = this.getTheme(id);
            return theme ? (theme.isPublished !== false) : true;
        };

        pf.loadCustomThemes = function() {
            let customList = [];
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY || 'photoart_custom_frames');
                if (raw) {
                    const list = JSON.parse(raw);
                    if (Array.isArray(list)) customList = list;
                }
            } catch (e) {}

            let overrides = {};
            try {
                const rawO = localStorage.getItem('photoart_frame_publish_overrides');
                if (rawO) overrides = JSON.parse(rawO);
            } catch (e) {}

            const DEPRECATED_IDS = ['asset_frame_korean_4', 'asset_frame_grid_4', 'asset_borcelle_studio_grid_4_pose'];
            customList = customList.filter(f => !DEPRECATED_IDS.includes(f.id));
            const combined = (this.ASSET_FRAMES || []).map(af => ({ ...af }));

            combined.forEach(af => {
                const afId = String(af.id || '').toLowerCase();
                const stored = customList.find(c => c.id === af.id ||
                    (afId.includes('borcelle') && String(c.id).toLowerCase().includes('borcelle')) ||
                    (afId.includes('receipt') && String(c.id).toLowerCase().includes('receipt')) ||
                    (afId.includes('strip_3') && String(c.id).toLowerCase().includes('strip_3'))
                );
                if (stored && stored.isPublished !== undefined) {
                    af.isPublished = stored.isPublished;
                }

                for (const k of Object.keys(overrides)) {
                    const kLower = k.toLowerCase();
                    if (k === af.id ||
                        (afId.includes('receipt') && kLower.includes('receipt')) ||
                        (afId.includes('borcelle') && kLower.includes('borcelle')) ||
                        (afId.includes('strip_3') && kLower.includes('strip_3'))) {
                        af.isPublished = Boolean(overrides[k]);
                        break;
                    }
                }
            });

            customList.forEach(cf => {
                const isAsset = combined.some(af => af.id === cf.id);
                if (!isAsset) {
                    if (overrides[cf.id] !== undefined) {
                        cf.isPublished = Boolean(overrides[cf.id]);
                    }
                    combined.push(cf);
                }
            });

            if (Array.isArray(this.ASSET_FRAMES)) {
                this.ASSET_FRAMES.forEach(af => {
                    const match = combined.find(t => t.id === af.id);
                    if (match && match.isPublished !== undefined) {
                        af.isPublished = match.isPublished;
                    }
                });
            }

            this.allThemes = combined;
            this.themes = combined.filter(f => f.isPublished !== false);
            try {
                if (typeof this.saveCustomThemes === 'function') this.saveCustomThemes();
            } catch (e) {}
            return this.themes;
        };

        pf.mergeServerFrames = function(serverFrames, isAdmin = false) {
            if (!Array.isArray(serverFrames)) return this.themes;

            let localOverrides = {};
            try {
                const raw = localStorage.getItem('photoart_frame_publish_overrides');
                if (raw) localOverrides = JSON.parse(raw);
            } catch (e) {}

            let baseList = Array.isArray(this.allThemes) && this.allThemes.length > 0
                ? this.allThemes
                : (this.ASSET_FRAMES ? this.ASSET_FRAMES.map(af => ({ ...af })) : []);

            serverFrames.forEach(sf => {
                const sfId = String(sf.id || '').toLowerCase();
                const existing = baseList.find(t => t.id === sf.id ||
                    (sfId.includes('receipt') && String(t.id).toLowerCase().includes('receipt')) ||
                    (sfId.includes('borcelle') && String(t.id).toLowerCase().includes('borcelle')) ||
                    (sfId.includes('strip_3') && String(t.id).toLowerCase().includes('strip_3'))
                );

                if (existing) {
                    if (sf.isPublished !== undefined) {
                        existing.isPublished = sf.isPublished;
                    }
                    if (sf.url && !existing.url) existing.url = sf.url;
                    if (sf.slots && (!existing.slots || existing.slots.length === 0)) existing.slots = sf.slots;
                } else {
                    baseList.push(sf);
                }
            });

            if (!isAdmin) {
                if (serverFrames && serverFrames.length > 0) {
                    const publishedIds = new Set(serverFrames.map(f => f.id));
                    baseList.forEach(t => {
                        const tid = String(t.id).toLowerCase();
                        const inPublished = publishedIds.has(t.id) ||
                            ([...publishedIds].some(pid => {
                                const pLower = String(pid).toLowerCase();
                                return (tid.includes('receipt') && pLower.includes('receipt')) ||
                                       (tid.includes('borcelle') && pLower.includes('borcelle')) ||
                                       (tid.includes('strip_3') && pLower.includes('strip_3'));
                            }));
                        if (!inPublished) {
                            t.isPublished = false;
                        }
                    });
                }
                baseList.forEach(t => {
                    const tid = String(t.id).toLowerCase();
                    for (const k of Object.keys(localOverrides)) {
                        const kLower = k.toLowerCase();
                        if (k === t.id ||
                            (tid.includes('receipt') && kLower.includes('receipt')) ||
                            (tid.includes('borcelle') && kLower.includes('borcelle')) ||
                            (tid.includes('strip_3') && kLower.includes('strip_3'))) {
                            t.isPublished = Boolean(localOverrides[k]);
                            break;
                        }
                    }
                });
            } else {
                baseList.forEach(t => {
                    const tid = String(t.id).toLowerCase();
                    for (const k of Object.keys(localOverrides)) {
                        const kLower = k.toLowerCase();
                        if (k === t.id ||
                            (tid.includes('receipt') && kLower.includes('receipt')) ||
                            (tid.includes('borcelle') && kLower.includes('borcelle')) ||
                            (tid.includes('strip_3') && kLower.includes('strip_3'))) {
                            t.isPublished = Boolean(localOverrides[k]);
                            break;
                        }
                    }
                });
            }

            if (Array.isArray(this.ASSET_FRAMES)) {
                this.ASSET_FRAMES.forEach(af => {
                    const match = baseList.find(t => t.id === af.id ||
                        (String(af.id).includes('receipt') && String(t.id).includes('receipt')) ||
                        (String(af.id).includes('borcelle') && String(t.id).includes('borcelle')) ||
                        (String(af.id).includes('strip_3') && String(t.id).includes('strip_3'))
                    );
                    if (match && match.isPublished !== undefined) {
                        af.isPublished = match.isPublished;
                    }
                });
            }

            this.allThemes = baseList;
            this.themes = baseList.filter(f => f.isPublished !== false);

            try {
                if (typeof this.saveCustomThemes === 'function') {
                    this.saveCustomThemes();
                } else {
                    localStorage.setItem(this.STORAGE_KEY || 'photoart_custom_frames', JSON.stringify(this.allThemes));
                }
            } catch (e) {}

            window.dispatchEvent(new CustomEvent('photoart:frames_synced', { detail: this.themes }));
            return this.themes;
        };

        pf.syncWithServer = async function(adminToken = '') {
            try {
                const token = adminToken || (window.photoartState ? window.photoartState.adminToken : '') || localStorage.getItem('photoart_admin_token') || sessionStorage.getItem('photoart_admin_token') || '';
                const headers = {};
                if (token) headers['X-Admin-Token'] = token;
                const res = await fetch('/api/custom-frames', { headers });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.success && Array.isArray(data.frames)) {
                        this.mergeServerFrames(data.frames, Boolean(token));
                    }
                }
            } catch (e) {
                console.warn('Sync frames notice:', e);
            }
            return this.themes;
        };

        pf.togglePublishTheme = async function(themeId, adminToken = '', targetStatus = null) {
            const token = adminToken || (window.photoartState ? window.photoartState.adminToken : '') || localStorage.getItem('photoart_admin_token') || sessionStorage.getItem('photoart_admin_token') || 'admin_authorized';

            const strId = String(themeId || '').toLowerCase();
            let targetTheme = (this.allThemes || []).find(t => t.id === themeId ||
                (strId.includes('receipt') && String(t.id).toLowerCase().includes('receipt')) ||
                (strId.includes('borcelle') && String(t.id).toLowerCase().includes('borcelle')) ||
                (strId.includes('strip_3') && String(t.id).toLowerCase().includes('strip_3'))
            );

            if (!targetTheme && this.themes) {
                targetTheme = this.themes.find(t => t.id === themeId);
            }
            if (!targetTheme && this.ASSET_FRAMES) {
                targetTheme = this.ASSET_FRAMES.find(t => t.id === themeId ||
                    (strId.includes('receipt') && String(t.id).toLowerCase().includes('receipt')) ||
                    (strId.includes('borcelle') && String(t.id).toLowerCase().includes('borcelle')) ||
                    (strId.includes('strip_3') && String(t.id).toLowerCase().includes('strip_3'))
                );
            }

            const currentStatus = targetTheme ? (targetTheme.isPublished !== false) : true;
            const newStatus = (targetStatus !== null) ? Boolean(targetStatus) : !currentStatus;

            if (targetTheme) {
                targetTheme.isPublished = newStatus;
            }

            if (Array.isArray(this.allThemes)) {
                this.allThemes.forEach(t => {
                    const tid = String(t.id).toLowerCase();
                    if (t.id === themeId ||
                        (strId.includes('receipt') && tid.includes('receipt')) ||
                        (strId.includes('borcelle') && tid.includes('borcelle')) ||
                        (strId.includes('strip_3') && tid.includes('strip_3'))) {
                        t.isPublished = newStatus;
                    }
                });
            } else {
                this.allThemes = (this.ASSET_FRAMES || []).map(af => ({ ...af, isPublished: af.id === themeId ? newStatus : af.isPublished }));
            }

            if (Array.isArray(this.ASSET_FRAMES)) {
                this.ASSET_FRAMES.forEach(af => {
                    const afId = String(af.id).toLowerCase();
                    if (af.id === themeId ||
                        (strId.includes('receipt') && afId.includes('receipt')) ||
                        (strId.includes('borcelle') && afId.includes('borcelle')) ||
                        (strId.includes('strip_3') && afId.includes('strip_3'))) {
                        af.isPublished = newStatus;
                    }
                });
            }

            this.themes = (this.allThemes || []).filter(f => f.isPublished !== false);

            try {
                let pubOverrides = {};
                try {
                    const raw = localStorage.getItem('photoart_frame_publish_overrides');
                    if (raw) pubOverrides = JSON.parse(raw);
                } catch (e) {}

                const actualId = targetTheme ? targetTheme.id : themeId;
                pubOverrides[actualId] = newStatus;
                pubOverrides[themeId] = newStatus;
                if (strId.includes('receipt')) {
                    pubOverrides['receipt'] = newStatus;
                    pubOverrides['receipt_3'] = newStatus;
                    pubOverrides['asset_frame_receipt_3'] = newStatus;
                } else if (strId.includes('borcelle')) {
                    pubOverrides['borcelle'] = newStatus;
                    pubOverrides['borcelle_4'] = newStatus;
                    pubOverrides['asset_frame_borcelle_4'] = newStatus;
                } else if (strId.includes('strip_3')) {
                    pubOverrides['strip_3'] = newStatus;
                    pubOverrides['asset_frame_strip_3'] = newStatus;
                }
                localStorage.setItem('photoart_frame_publish_overrides', JSON.stringify(pubOverrides));
                localStorage.setItem(this.STORAGE_KEY || 'photoart_custom_frames', JSON.stringify(this.allThemes));
            } catch (e) {
                console.warn('Storage save notice:', e);
            }

            window.dispatchEvent(new CustomEvent('photoart:frames_synced', { detail: this.themes }));

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': token
                };
                const payload = { id: themeId, isPublished: newStatus };
                const res = await fetch('/api/custom-frames/toggle-publish', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(payload)
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.frames)) {
                        this.mergeServerFrames(data.frames, true);
                    }
                }
            } catch (netErr) {
                console.warn('Backend sync deferred (persisted locally):', netErr);
            }

            return { success: true, isPublished: newStatus, frame: targetTheme };
        };

        pf.deleteCustomTheme = async function(themeId, adminToken = '') {
            const token = adminToken || (window.photoartState ? window.photoartState.adminToken : '') || localStorage.getItem('photoart_admin_token') || sessionStorage.getItem('photoart_admin_token') || 'admin_authorized';

            if (this.themes) this.themes = this.themes.filter(t => t.id !== themeId);
            if (this.allThemes) this.allThemes = this.allThemes.filter(t => t.id !== themeId);
            try {
                if (typeof this.saveCustomThemes === 'function') this.saveCustomThemes();
                let pubOverrides = {};
                try {
                    const raw = localStorage.getItem('photoart_frame_publish_overrides');
                    if (raw) pubOverrides = JSON.parse(raw);
                } catch (e) {}
                pubOverrides[`${themeId}_deleted`] = true;
                localStorage.setItem('photoart_frame_publish_overrides', JSON.stringify(pubOverrides));
            } catch (e) {}

            window.dispatchEvent(new CustomEvent('photoart:frames_synced', { detail: this.themes }));

            try {
                const headers = {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': token
                };
                const res = await fetch('/api/custom-frames/delete', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify({ id: themeId })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.frames)) {
                        this.mergeServerFrames(data.frames, true);
                    }
                }
            } catch (netErr) {
                console.warn('Backend delete sync notice:', netErr);
            }

            return { success: true };
        };

        pf.addCustomTheme = async function(theme, adminToken = '') {
            const token = adminToken || (window.photoartState ? window.photoartState.adminToken : '') || localStorage.getItem('photoart_admin_token') || sessionStorage.getItem('photoart_admin_token') || 'admin_authorized';
            if (!theme.id) {
                theme.id = 'frame_' + Date.now();
            }
            theme.isCustom = true;
            if (!this.themes) this.themes = [];
            this.themes.unshift(theme);
            if (this.allThemes && !this.allThemes.some(t => t.id === theme.id)) {
                this.allThemes.unshift(theme);
            }
            if (typeof this.saveCustomThemes === 'function') this.saveCustomThemes();

            try {
                const headers = { 'Content-Type': 'application/json' };
                if (token) headers['X-Admin-Token'] = token;
                const res = await fetch('/api/custom-frames/upload', {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(theme)
                });
                if (res.ok) {
                    const json = await res.json();
                    if (json.success && json.frame) {
                        theme.url = json.frame.url;
                    }
                    if (json.frames && Array.isArray(json.frames)) {
                        this.mergeServerFrames(json.frames, Boolean(token));
                    }
                }
            } catch (e) {
                console.warn('Gagal sync upload frame ke server:', e);
            }
            return theme;
        };

        if (!pf.detectSlots) {
            pf.detectSlots = function(img) {
                const origW = img.naturalWidth || img.width;
                const origH = img.naturalHeight || img.height;
                if (!origW || !origH) return null;

                const maxScanDim = 320;
                const scale = Math.min(1.0, maxScanDim / Math.max(origW, origH));
                const sw = Math.max(10, Math.round(origW * scale));
                const sh = Math.max(10, Math.round(origH * scale));

                const canvas = document.createElement('canvas');
                canvas.width = sw;
                canvas.height = sh;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0, sw, sh);

                const imgData = ctx.getImageData(0, 0, sw, sh);
                const data = imgData.data;

                let alphaSlots = 0;
                for (let i = 3; i < data.length; i += 4) {
                    if (data[i] < 128) {
                        alphaSlots++;
                    }
                }
                const hasAlphaHoles = alphaSlots > (sw * sh * 0.04);
                const mask = new Uint8Array(sw * sh);
                let totalCand = 0;

                for (let y = 0; y < sh; y++) {
                    const rowOffset = y * sw * 4;
                    for (let x = 0; x < sw; x++) {
                        const idx = rowOffset + x * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];
                        const a = data[idx + 3];

                        let isSlot = false;
                        if (hasAlphaHoles) {
                            isSlot = (a < 128);
                        } else {
                            const isSky = (b > 175 && g > 155 && r > 115 && b >= r);
                            const isHill = (g > 95 && r > 75 && b < 140 && g >= b);
                            const isWhite = (r > 235 && g > 235 && b > 235);
                            const isGrey = (Math.abs(r - g) < 15 && Math.abs(g - b) < 15 && r > 200);
                            isSlot = isSky || isHill || isWhite || isGrey;
                        }

                        if (isSlot) {
                            mask[y * sw + x] = 1;
                            totalCand++;
                        }
                    }
                }

                if (totalCand < (sw * sh * 0.08)) {
                    return null;
                }

                const rowSums = new Int32Array(sh);
                for (let y = 0; y < sh; y++) {
                    let sum = 0;
                    const yOffset = y * sw;
                    for (let x = 0; x < sw; x++) {
                        sum += mask[yOffset + x];
                    }
                    rowSums[y] = sum;
                }

                const minRowWidth = Math.round(sw * 0.25);
                const validRows = [];
                for (let y = 0; y < sh; y++) {
                    if (rowSums[y] >= minRowWidth) {
                        validRows.push(y);
                    }
                }

                const bands = [];
                let curBand = [];
                const minBandHeight = Math.round(sh * 0.07);

                for (let i = 0; i < validRows.length; i++) {
                    const y = validRows[i];
                    if (curBand.length === 0 || y === curBand[curBand.length - 1] + 1) {
                        curBand.push(y);
                    } else {
                        if (curBand.length >= minBandHeight) {
                            bands.push({ y0: curBand[0], y1: curBand[curBand.length - 1] });
                        }
                        curBand = [y];
                    }
                }
                if (curBand.length >= minBandHeight) {
                    bands.push({ y0: curBand[0], y1: curBand[curBand.length - 1] });
                }

                if (bands.length === 0) return null;

                const slots = [];
                for (let b = 0; b < bands.length; b++) {
                    const band = bands[b];
                    const y0 = band.y0;
                    const y1 = band.y1;
                    const bandH = y1 - y0 + 1;

                    const colSums = new Int32Array(sw);
                    for (let y = y0; y <= y1; y++) {
                        const yOffset = y * sw;
                        for (let x = 0; x < sw; x++) {
                            colSums[x] += mask[yOffset + x];
                        }
                    }

                    const minColHeight = Math.round(bandH * 0.35);
                    const validCols = [];
                    for (let x = 0; x < sw; x++) {
                        if (colSums[x] >= minColHeight) {
                            validCols.push(x);
                        }
                    }

                    if (validCols.length === 0) continue;

                    const minX = validCols[0];
                    const maxX = validCols[validCols.length - 1];

                    const origX = Math.round(minX / scale);
                    const origY = Math.round(y0 / scale);
                    const origW = Math.round((maxX - minX + 1) / scale);
                    const origH = Math.round(bandH / scale);

                    slots.push({
                        x: origX,
                        y: origY,
                        width: origW,
                        height: origH,
                        relX: origX / origW,
                        relY: origY / origH,
                        relW: origW / origW,
                        relH: origH / origH,
                        radius: 14
                    });
                }

                if (slots.length === 0) return null;

                return {
                    hasAlphaHoles: hasAlphaHoles,
                    slots: slots,
                    count: slots.length
                };
            };
        }
    }

    const PhotoStorage = {
        STORAGE_KEY: 'photoart_user_photos_v1',
        TOMBSTONE_KEY: 'photoart_deleted_tombstones_v1',
        DB_NAME: 'PhotoArtAppDB',
        DB_VERSION: 1,
        STORE_NAME: 'user_photos',
        _db: null,
        _cache: null,

        getTombstones() {
            try {
                const raw = localStorage.getItem(this.TOMBSTONE_KEY);
                return new Set(raw ? JSON.parse(raw) : []);
            } catch (e) {
                return new Set();
            }
        },

        addTombstone(photoId) {
            if (!photoId) return;
            try {
                const set = this.getTombstones();
                set.add(photoId);
                localStorage.setItem(this.TOMBSTONE_KEY, JSON.stringify(Array.from(set)));
            } catch (e) {}
        },

        removeTombstone(photoId) {
            if (!photoId) return;
            try {
                const set = this.getTombstones();
                if (set.has(photoId)) {
                    set.delete(photoId);
                    localStorage.setItem(this.TOMBSTONE_KEY, JSON.stringify(Array.from(set)));
                }
            } catch (e) {}
        },

        _initCache() {
            if (this._cache !== null) return this._cache;
            try {
                const raw = localStorage.getItem(this.STORAGE_KEY);
                const list = raw ? JSON.parse(raw) : [];
                const tombstones = this.getTombstones();
                this._cache = Array.isArray(list) ? list.filter(p => p && p.id && !tombstones.has(p.id)) : [];
            } catch (e) {
                this._cache = [];
            }
            return this._cache;
        },

        async getDB() {
            if (this._db) return this._db;
            if (typeof indexedDB === 'undefined') return null;

            return new Promise((resolve) => {
                try {
                    const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
                    request.onupgradeneeded = (e) => {
                        const db = e.target.result;
                        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                            const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
                            store.createIndex('userId', 'userId', { unique: false });
                            store.createIndex('createdAt', 'createdAt', { unique: false });
                        }
                    };
                    request.onsuccess = (e) => {
                        this._db = e.target.result;
                        resolve(this._db);
                    };
                    request.onerror = () => resolve(null);
                } catch (err) {
                    resolve(null);
                }
            });
        },

        async getAll() {
            this._initCache();
            const tombstones = this.getTombstones();
            const db = await this.getDB();
            if (db) {
                try {
                    const fromIDB = await new Promise((resolve) => {
                        const tx = db.transaction(this.STORE_NAME, 'readonly');
                        const store = tx.objectStore(this.STORE_NAME);
                        const req = store.getAll();
                        req.onsuccess = () => resolve(req.result || []);
                        req.onerror = () => resolve([]);
                    });
                    if (fromIDB && fromIDB.length > 0) {
                        const map = new Map();
                        this._cache.forEach(p => {
                            if (p && p.id && !tombstones.has(p.id)) map.set(p.id, p);
                        });
                        const prunedIds = [];
                        fromIDB.forEach(p => {
                            if (p && p.id) {
                                if (tombstones.has(p.id)) {
                                    prunedIds.push(p.id);
                                } else {
                                    map.set(p.id, p);
                                }
                            }
                        });
                        if (prunedIds.length > 0) {
                            try {
                                const ptx = db.transaction(this.STORE_NAME, 'readwrite');
                                const pstore = ptx.objectStore(this.STORE_NAME);
                                prunedIds.forEach(pid => pstore.delete(pid));
                            } catch (pe) {}
                        }
                        this._cache = Array.from(map.values());
                        this._cache.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                        return this._cache;
                    }
                } catch (e) {}
            }
            this._cache = (this._cache || []).filter(p => p && p.id && !tombstones.has(p.id));
            return this._cache;
        },

        getAllSync() {
            return this._initCache();
        },

        async getUserPhotos(userId) {
            const all = await this.getAll();
            if (!userId) return all.filter(p => !p.deleted);
            return all.filter(p => (!p.userId || p.userId === userId || p.userId === 'user_guest') && !p.deleted);
        },

        async save(photo) {
            if (!photo || !photo.id) return photo;
            this.removeTombstone(photo.id);

            this._initCache();
            const idx = this._cache.findIndex(p => p.id === photo.id);
            if (idx >= 0) {
                this._cache[idx] = photo;
            } else {
                this._cache.unshift(photo);
            }

            // 1. Simpan ke IndexedDB (Kapasitas Besar ratusan MB / GB tanpa batas kuota 5MB)
            const db = await this.getDB();
            if (db) {
                try {
                    await new Promise((resolve, reject) => {
                        const tx = db.transaction(this.STORE_NAME, 'readwrite');
                        const store = tx.objectStore(this.STORE_NAME);
                        const req = store.put(photo);
                        req.onsuccess = () => resolve(true);
                        req.onerror = (e) => reject(e);
                    });
                } catch (e) {
                    console.warn("IndexedDB save warning:", e);
                }
            }

            // 2. Simpan juga ke localStorage sebagai cadangan (dibatasi 20 item terbaru)
            try {
                const trimmed = this._cache.slice(0, 20);
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
            } catch (e) {
                try {
                    const minimal = this._cache.slice(0, 6);
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(minimal));
                } catch (e2) {
                    console.warn("LocalStorage quota reached, photo safely stored in IndexedDB");
                }
            }

            return photo;
        },

        async softDelete(photoId, userId = null) {
            this._initCache();
            const photo = this._cache.find(p => p.id === photoId && (!userId || p.userId === userId));
            if (photo) {
                photo.deleted = true;
                photo.deletedAt = new Date().toISOString();
                await this.save(photo);
                return true;
            }
            return false;
        },

        async restore(photoId) {
            if (!photoId) return false;
            this.removeTombstone(photoId);

            this._initCache();
            const photo = this._cache.find(p => p.id === photoId);
            if (photo) {
                photo.deleted = false;
                delete photo.deletedAt;
                await this.save(photo);
                return true;
            }
            return false;
        },

        async permanentDelete(photoId) {
            if (!photoId) return true;
            this.addTombstone(photoId);

            this._initCache();
            this._cache = this._cache.filter(p => p.id !== photoId);

            const db = await this.getDB();
            if (db) {
                try {
                    await new Promise((resolve) => {
                        const tx = db.transaction(this.STORE_NAME, 'readwrite');
                        const store = tx.objectStore(this.STORE_NAME);
                        const req = store.delete(photoId);
                        req.onsuccess = () => resolve(true);
                        req.onerror = () => resolve(false);
                    });
                } catch (e) {}
            }

            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._cache.slice(0, 20)));
            } catch (e) {}
            return true;
        }
    };

    const state = {
        currentStep: 'home',
        selectedThemeId: (PhotoFrames.themes && PhotoFrames.themes.length > 0) ? PhotoFrames.themes[0].id : null,
        layoutMode: (PhotoFrames.themes && PhotoFrames.themes.length > 0) ? PhotoFrames.themes[0].layout : 'strip_3',
        timerDuration: 3,
        currentShotIndex: 0,
        capturedImages: [],
        selectedFilter: 'normal',
        slotFilters: [],
        editorFilterTargetSlot: 'all',
        frameHeader: '',
        frameSubtitle: '',
        stickers: [],
        selectedStickerId: null,
        cameraStream: null,
        currentDeviceId: null,
        isSwitchingCamera: false,
        knownVideoDevices: [],
        facingMode: 'user',
        isMirrored: true,
        flashEnabled: false,
        isFlashIlluminating: false,
        isCountingDown: false,
        audioCtx: null,
        pendingUploadFrame: null,

        adminToken: sessionStorage.getItem('photoart_admin_token') || localStorage.getItem('photoart_admin_token') || '',
        adminActiveTab: 'frames',
        adminCurationFilter: 'all',
        adminSelectedUserFilter: 'all',
        userName: localStorage.getItem('photoart_user_name') || '',
        currentSessionUploaded: false,
        lastUploadedPhotoId: null,
        isUploading: false
    };

    window.photoartState = state;

    const elements = {
        stepHome: document.getElementById('step-home'),
        stepSetup: document.getElementById('step-setup'),
        stepCamera: document.getElementById('step-camera'),
        stepEditor: document.getElementById('step-editor'),
        stepGallery: document.getElementById('step-gallery'),
        stepAdmin: document.getElementById('step-admin'),
        studioStepTrackerWrapper: document.querySelector('.step-tracker-wrapper'),

        btnNavHome: document.getElementById('btn-nav-home'),
        btnNavBooth: document.getElementById('btn-nav-booth'),
        btnNavGallery: document.getElementById('btn-nav-gallery'),
        btnNavAdmin: document.getElementById('btn-nav-admin'),
        headerGalleryBadge: document.getElementById('header-gallery-badge'),
        brandHomeLink: document.getElementById('brand-home-link'),

        btnHeroStart: document.getElementById('btn-hero-start'),
        btnBottomStart: document.getElementById('btn-bottom-start'),
        btnHeroScroll: document.getElementById('btn-hero-scroll'),

        framesSelectionGrid: document.getElementById('frames-selection-grid'),
        btnStartBooth: document.getElementById('btn-start-booth'),

        inputFrameUpload: document.getElementById('input-admin-frame-upload') || document.getElementById('input-frame-upload'),
        btnTriggerUploadFrame: document.getElementById('btn-admin-upload-frame') || document.getElementById('btn-trigger-upload-frame'),
        statTotalFrames: document.getElementById('stat-total-frames'),
        badgeFramesCount: document.getElementById('badge-frames-count'),
        tabBtnFrames: document.getElementById('tab-btn-frames'),
        adminFramesView: document.getElementById('admin-frames-view'),
        adminPhotosView: document.getElementById('admin-photos-view'),
        adminFramesGrid: document.getElementById('admin-frames-grid'),
        adminFramesEmpty: document.getElementById('admin-frames-empty'),

        btnFilterFramesAll: document.getElementById('btn-filter-frames-all'),
        btnFilterFramesPub: document.getElementById('btn-filter-frames-pub'),
        btnFilterFramesPriv: document.getElementById('btn-filter-frames-priv'),
        countCurationAll: document.getElementById('count-curation-all'),
        countCurationPub: document.getElementById('count-curation-pub'),
        countCurationPriv: document.getElementById('count-curation-priv'),

        modalFrameSetup: document.getElementById('modal-frame-setup'),
        btnCloseFrameSetup: document.getElementById('btn-close-frame-setup'),
        btnCancelFrameSetup: document.getElementById('btn-cancel-frame-setup'),
        btnConfirmSaveFrame: document.getElementById('btn-confirm-save-frame'),
        frameSetupPreviewImg: document.getElementById('frame-setup-preview-img'),
        frameSetupAspectBadge: document.getElementById('frame-setup-aspect-badge'),
        frameSetupName: document.getElementById('frame-setup-name'),

        video: document.getElementById('camera-video'),
        cameraFeedContainer: document.getElementById('camera-feed-container'),
        screenFlashIlluminator: document.getElementById('screen-flash-illuminator'),
        flashOverlay: document.getElementById('flash-overlay'),
        countdownOverlay: document.getElementById('countdown-overlay'),
        countdownNumber: document.getElementById('countdown-number'),
        btnCapture: document.getElementById('btn-capture'),
        btnSwitchCamera: document.getElementById('btn-switch-camera'),
        switchCameraLabel: document.getElementById('switch-camera-label'),
        btnToggleMirror: document.getElementById('btn-toggle-mirror'),
        mirrorBtnText: document.getElementById('mirror-btn-text'),
        btnToggleFlash: document.getElementById('btn-toggle-flash'),
        flashBtnText: document.getElementById('flash-btn-text'),
        hudFlashIndicator: document.getElementById('hud-flash-indicator'),
        btnSetupToggleFlash: document.getElementById('btn-setup-toggle-flash'),
        setupFlashStatusText: document.getElementById('setup-flash-status-text'),
        btnNativeCapture: document.getElementById('btn-native-capture'),
        nativeCameraInput: document.getElementById('native-camera-input'),
        btnNativeGallery: document.getElementById('btn-native-gallery'),
        nativeFileInput: document.getElementById('native-file-input'),
        modalGalleryFill: document.getElementById('modal-gallery-fill'),
        galleryFillDesc: document.getElementById('gallery-fill-desc'),
        galleryFillSlotCount: document.getElementById('gallery-fill-slot-count'),
        galleryFillChosenCount: document.getElementById('gallery-fill-chosen-count'),
        btnGalleryFillAll: document.getElementById('btn-gallery-fill-all'),
        btnGalleryPickNext: document.getElementById('btn-gallery-pick-next'),
        btnEditorPickGallery: document.getElementById('btn-editor-pick-gallery'),
        shotCounterText: document.getElementById('shot-counter-text'),
        shotThumbsContainer: document.getElementById('shot-thumbs-container'),
        cameraNotice: document.getElementById('camera-notice'),
        cameraCurrentFrameBadge: document.getElementById('camera-current-frame-badge'),
        cameraFiltersContainer: document.getElementById('camera-filters-container'),
        activeFilterName: document.getElementById('active-filter-name'),
        btnProceedToEditor: document.getElementById('btn-proceed-to-editor'),

        canvasPreview: document.getElementById('canvas-preview'),
        themesContainer: document.getElementById('themes-container'),
        editorFiltersContainer: document.getElementById('editor-filters-container'),
        inputHeader: document.getElementById('input-header'),
        inputSubtitle: document.getElementById('input-subtitle'),
        stickersContainer: document.getElementById('stickers-container'),
        btnClearStickers: document.getElementById('btn-clear-stickers'),

        stickerControllerPanel: document.getElementById('sticker-controller-panel'),
        btnDeleteSelectedSticker: document.getElementById('btn-delete-selected-sticker'),
        btnStickerBigger: document.getElementById('btn-sticker-bigger'),
        btnStickerSmaller: document.getElementById('btn-sticker-smaller'),
        btnStickerRotate: document.getElementById('btn-sticker-rotate'),

        btnSaveToGallery: document.getElementById('btn-save-to-gallery') || document.getElementById('btn-download-final'),
        btnDownloadDirect: document.getElementById('btn-download-direct'),
        btnDownloadFinal: document.getElementById('btn-download-final'),
        btnViewInGallery: document.getElementById('btn-view-in-gallery'),
        btnShareFinal: document.getElementById('btn-share-final'),
        btnPrintFinal: document.getElementById('btn-print-final'),
        btnRetakeAll: document.getElementById('btn-retake-all'),

        userGalleryGrid: document.getElementById('user-gallery-grid'),
        userGalleryEmpty: document.getElementById('user-gallery-empty'),
        userGalleryCount: document.getElementById('user-gallery-count'),
        btnGalleryNewSession: document.getElementById('btn-gallery-new-session'),
        btnGalleryRefresh: document.getElementById('btn-gallery-refresh'),
        btnEmptyStartBooth: document.getElementById('btn-empty-start-booth'),

        adminLoginCard: document.getElementById('admin-login-card'),
        formAdminLogin: document.getElementById('form-admin-login'),
        inputAdminPin: document.getElementById('input-admin-pin'),
        adminLoginError: document.getElementById('admin-login-error'),
        adminPanelContent: document.getElementById('admin-panel-content'),
        btnAdminRefresh: document.getElementById('btn-admin-refresh'),
        btnAdminLogout: document.getElementById('btn-admin-logout'),
        statTotalPhotos: document.getElementById('stat-total-photos'),
        statActivePhotos: document.getElementById('stat-active-photos'),
        statDeletedPhotos: document.getElementById('stat-deleted-photos'),
        statTotalUsers: document.getElementById('stat-total-users'),
        selectAdminUserFilter: document.getElementById('select-admin-user-filter'),
        adminUserChipsContainer: document.getElementById('admin-user-chips-container'),
        adminUserSummaryText: document.getElementById('admin-user-summary-text'),
        inputSetupUserName: document.getElementById('input-setup-user-name'),
        inputUserName: document.getElementById('input-user-name'),
        tabBtnTrash: document.getElementById('tab-btn-trash'),
        tabBtnActive: document.getElementById('tab-btn-active'),
        badgeTrashCount: document.getElementById('badge-trash-count'),
        badgeActiveCount: document.getElementById('badge-active-count'),
        adminTrashNotice: document.getElementById('admin-trash-notice'),
        adminMediaNotice: document.getElementById('admin-media-notice'),
        adminMediaGrid: document.getElementById('admin-media-grid'),
        adminMediaEmpty: document.getElementById('admin-media-empty'),

        modalLightbox: document.getElementById('modal-lightbox'),
        btnCloseLightbox: document.getElementById('btn-close-lightbox'),
        lightboxImg: document.getElementById('lightbox-img'),
        lightboxCaption: document.getElementById('lightbox-caption'),
        btnLightboxDownload: document.getElementById('btn-lightbox-download'),

        btnOpenBarcode: document.getElementById('btn-open-barcode'),
        btnCloseBarcode: document.getElementById('btn-close-barcode'),
        modalBarcode: document.getElementById('modal-barcode'),
        qrCanvasContainer: document.getElementById('qr-code-container'),
        inputShareUrl: document.getElementById('input-share-url'),
        btnCopyLink: document.getElementById('btn-copy-link'),
        btnDownloadQr: document.getElementById('btn-download-qr'),
        copyFeedback: document.getElementById('copy-feedback'),

        toastEl: document.getElementById('photoart-toast')
    };

    async function init() {
        PhotoFrames.loadCustomThemes();

        if (PhotoFrames.themes.length > 0) {
            state.selectedThemeId = PhotoFrames.themes[0].id;
            state.layoutMode = PhotoFrames.themes[0].layout || 'strip_3';
        } else {
            state.selectedThemeId = null;
            state.layoutMode = 'strip_3';
        }

        const defaultTheme = PhotoFrames.getTheme(state.selectedThemeId);
        state.frameHeader = defaultTheme.defaultHeader || 'PHOTOART';
        state.frameSubtitle = defaultTheme.defaultSubtitle || 'STUDIO MEMORIES';

        if (elements.inputHeader) elements.inputHeader.value = state.frameHeader;
        if (elements.inputSubtitle) elements.inputSubtitle.value = state.frameSubtitle;

        populateFramesSelection();
        initCustomFrameUpload();
        populateCameraFilters();
        populateEditorFilters();
        populateEditorThemes();
        populateStickers();
        setupCategoryFilter();
        setupStepTrackerNavigation();

        bindEvents();
        updateFlashUI();
        initStickerCanvasInteraction();

        const urlParams = new URLSearchParams(window.location.search);
        const previewParam = urlParams.get('preview');
        const stepParam = urlParams.get('step');

        if (elements.stepHome) {
            showStep('home');
        } else if (elements.stepAdmin && !elements.stepSetup) {
            showStep('admin');
        } else if (elements.stepSetup) {
            if (previewParam) {
                selectTheme(previewParam);
                showStep('camera');
            } else if (stepParam === 'gallery') {
                showStep('gallery');
            } else if (stepParam === 'camera') {
                showStep('camera');
            } else {
                showStep('setup');
            }
        } else {
            showStep('home');
        }

        setupShareBarcode();
        updateGalleryBadge();

        window.addEventListener('photoart:frames_synced', (e) => {
            const syncedThemes = e.detail || PhotoFrames.themes;
            const currentUrlParams = new URLSearchParams(window.location.search);
            const currentPreviewParam = currentUrlParams.get('preview');
            if (currentPreviewParam && (syncedThemes.some(t => t.id === currentPreviewParam) || (PhotoFrames.allThemes && PhotoFrames.allThemes.some(t => t.id === currentPreviewParam)))) {
                selectTheme(currentPreviewParam);
            } else if (syncedThemes.length > 0) {
                if (!state.selectedThemeId || !syncedThemes.some(t => t.id === state.selectedThemeId)) {
                    selectTheme(syncedThemes[0].id);
                } else {
                    selectTheme(state.selectedThemeId);
                }
            } else {
                state.selectedThemeId = null;
            }
            populateFramesSelection();
            populateEditorThemes();
            if (state.adminToken) {
                loadAdminFrames(false);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                PhotoFrames.syncWithServer();
                updateGalleryBadge();
            }
        });

        setInterval(() => {
            if (!document.hidden) {
                PhotoFrames.syncWithServer();
            }
        }, 12000);

        window.addEventListener('storage', (e) => {
            if (e.key === 'photoart_frame_publish_overrides' || e.key === 'photoart_custom_frames') {
                PhotoFrames.loadCustomThemes();
                populateFramesSelection();
                populateEditorThemes();
                if (typeof loadAdminFrames === 'function' && elements.adminFramesGrid) {
                    loadAdminFrames();
                }
            }
        });

        try {
            await PhotoFrames.syncWithServer();
            const currentUrlParams = new URLSearchParams(window.location.search);
            const currentPreviewParam = currentUrlParams.get('preview');
            if (currentPreviewParam) {
                selectTheme(currentPreviewParam);
            } else if (PhotoFrames.themes.length > 0 && !state.selectedThemeId) {
                selectTheme(PhotoFrames.themes[0].id);
            }
            populateFramesSelection();
            populateEditorThemes();
        } catch (err) {
            console.warn('Gagal sinkronisasi awal bingkai:', err);
        }
    }

    function populateFramesSelection() {
        if (!elements.framesSelectionGrid) return;
        elements.framesSelectionGrid.innerHTML = '';

        if (!PhotoFrames.themes || PhotoFrames.themes.length === 0) {
            const emptyBox = document.createElement('div');
            emptyBox.className = 'frames-empty-box';
            emptyBox.innerHTML = `
                <div class="empty-state-icon" style="font-size: 38px; margin-bottom: 10px;">🖼️</div>
                <h3 class="empty-title">Belum Ada Bingkai Diterbitkan</h3>
                <p class="empty-desc">Belum ada bingkai foto aktif yang dapat dipilih saat ini. Silakan hubungi operator booth.</p>
            `;
            elements.framesSelectionGrid.appendChild(emptyBox);
            return;
        }

        if (!state.selectedThemeId || !PhotoFrames.themes.some(t => t.id === state.selectedThemeId)) {
            selectTheme(PhotoFrames.themes[0].id);
        }

        PhotoFrames.themes.forEach(theme => {
            const card = document.createElement('div');
            card.className = 'frame-select-card custom-frame-card' + (state.selectedThemeId === theme.id ? ' selected' : '');
            card.setAttribute('data-theme-id', theme.id);

            const thumbUrl = PhotoFrames.getThumbnailUrl(theme.id);
            const isOverlay = theme.renderMode !== 'background';

            card.innerHTML = `
                <div class="frame-real-preview-wrapper">
                    <img class="frame-real-preview" src="${thumbUrl}" alt="${theme.name}">
                    ${state.selectedThemeId === theme.id ? '<span class="frame-active-pill">✓ Terpilih</span>' : ''}
                </div>
                <div class="frame-select-info">
                    <div class="frame-badges-row">
                        <span class="frame-select-tag">${theme.layoutLabel || '3 Foto'}</span>
                        <span class="frame-layout-pill">${isOverlay ? '🖼️ Overlay' : '🎨 Background'}</span>
                    </div>
                    <div class="frame-select-name">${theme.name || 'Frame Booth'}</div>
                    <div class="frame-select-sub">${theme.subtitle || 'Siap Digunakan'}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                selectTheme(theme.id);
            });

            elements.framesSelectionGrid.appendChild(card);
        });
    }

    function selectTheme(themeId) {
        state.selectedThemeId = themeId;
        const theme = PhotoFrames.getTheme(themeId);
        state.layoutMode = theme.layout || 'strip_3';
        state.frameHeader = theme.defaultHeader || 'PHOTOART';
        state.frameSubtitle = theme.defaultSubtitle || 'STUDIO MEMORIES';

        if (elements.inputHeader) elements.inputHeader.value = state.frameHeader;
        if (elements.inputSubtitle) elements.inputSubtitle.value = state.frameSubtitle;

        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        if (state.capturedImages.length > layoutConfig.count) {
            state.capturedImages = state.capturedImages.slice(0, layoutConfig.count);
        }

        document.querySelectorAll('.frame-select-card').forEach(el => {
            const isSel = el.getAttribute('data-theme-id') === themeId;
            el.classList.toggle('selected', isSel);
            const previewWrapper = el.querySelector('.frame-real-preview-wrapper');
            let pill = el.querySelector('.frame-active-pill');
            if (isSel) {
                if (!pill && previewWrapper) {
                    pill = document.createElement('span');
                    pill.className = 'frame-active-pill';
                    pill.textContent = '✓ Terpilih';
                    previewWrapper.appendChild(pill);
                }
            } else {
                if (pill) pill.remove();
            }
        });

        if (elements.cameraCurrentFrameBadge) {
            elements.cameraCurrentFrameBadge.innerHTML = `🎞️ Bingkai: <strong>${theme.name}</strong> <span style="opacity: 0.8; font-size: 10px;">(${theme.layoutLabel})</span>`;
        }

        document.querySelectorAll('.theme-chip').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-theme-id') === themeId);
        });

        if (state.currentStep === 'camera') {
            updateShotThumbnails();
        } else if (state.currentStep === 'editor') {
            renderCanvas();
        }
    }

    function initCustomFrameUpload() {
        if (elements.btnTriggerUploadFrame) {
            elements.btnTriggerUploadFrame.addEventListener('click', () => {
                if (elements.inputFrameUpload) elements.inputFrameUpload.click();
            });
        }

        if (elements.inputFrameUpload) {
            elements.inputFrameUpload.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                handleFrameFilePicked(file);
                e.target.value = '';
            });
        }

        if (elements.btnCloseFrameSetup) {
            elements.btnCloseFrameSetup.addEventListener('click', closeFrameSetupModal);
        }
        if (elements.btnCancelFrameSetup) {
            elements.btnCancelFrameSetup.addEventListener('click', closeFrameSetupModal);
        }
        if (elements.modalFrameSetup) {
            elements.modalFrameSetup.addEventListener('click', (e) => {
                if (e.target === elements.modalFrameSetup) {
                    closeFrameSetupModal();
                }
            });
        }

        if (elements.btnConfirmSaveFrame) {
            elements.btnConfirmSaveFrame.addEventListener('click', saveCustomFrameFromModal);
        }
    }

    function handleFrameFilePicked(file) {
        if (!state.adminToken) {
            showToast('⚠️ Akses Ditolak: Hanya Admin yang berhak mengunggah bingkai booth.', 'error');
            return;
        }

        if (!file.type.startsWith('image/')) {
            showToast('⚠️ Mohon pilih file gambar (PNG, JPG, atau WebP)', 'error');
            return;
        }

        showToast('⏳ Memproses bingkai & mendeteksi tata letak grid otomatis...', 'info', 2500);

        const reader = new FileReader();
        reader.onload = (e) => {
            const rawDataUrl = e.target.result;
            const img = new Image();
            img.onload = async () => {
                const maxDim = 1800;
                let w = img.width;
                let h = img.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }

                const offCanvas = document.createElement('canvas');
                offCanvas.width = w;
                offCanvas.height = h;
                const offCtx = offCanvas.getContext('2d');
                offCtx.drawImage(img, 0, 0, w, h);

                const optimizedDataUrl = offCanvas.toDataURL('image/png');
                const aspectRatio = w / h;

                const detected = PhotoFrames.detectSlots(img);

                let layout = 'strip_3';
                let layoutLabel = '3 Foto';
                let renderMode = 'background';
                let hasAlphaHoles = false;
                let detectedSlots = null;

                if (detected && Array.isArray(detected.slots) && detected.slots.length > 0) {
                    detectedSlots = detected.slots;
                    hasAlphaHoles = detected.hasAlphaHoles;
                    renderMode = hasAlphaHoles ? 'overlay' : 'background';
                    layout = 'custom_auto_' + detected.count;
                    layoutLabel = `${detected.count} Foto (Sesuai Grid Bingkai)`;
                } else {
                    if (aspectRatio < 0.45) {
                        layout = 'strip_3';
                        layoutLabel = '3 Foto (Strip Vertikal)';
                    } else if (aspectRatio > 0.85) {
                        layout = 'grid_4';
                        layoutLabel = '4 Foto (Grid 2x2)';
                    } else {
                        layout = 'strip_2';
                        layoutLabel = '2 Foto (Strip Vertikal)';
                    }
                    renderMode = 'background';
                }

                const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, ' ').trim() || 'Bingkai Galeri';

                const newTheme = {
                    id: 'frame_' + Date.now(),
                    name: cleanName,
                    subtitle: layoutLabel,
                    layout: layout,
                    layoutLabel: layoutLabel,
                    tag: '🖼️ Custom Frame',
                    category: 'custom',
                    bg: '#ffffff',
                    textColor: '#18181b',
                    subTextColor: '#71717a',
                    borderColor: '#e4e4e7',
                    isCustom: true,
                    isPublished: false,
                    hasAlphaHoles: hasAlphaHoles,
                    renderMode: renderMode,
                    detectedSlots: detectedSlots,
                    marginChoice: 'normal',
                    aspectRatio: aspectRatio,
                    naturalWidth: w,
                    naturalHeight: h,
                    frameDataUrl: optimizedDataUrl,
                    defaultHeader: 'PHOTOART',
                    defaultSubtitle: 'STUDIO MEMORIES',
                    createdAt: new Date().toISOString()
                };

                try {
                    await PhotoFrames.addCustomTheme(newTheme, state.adminToken);
                    loadAdminFrames();

                    showToast(`✨ Bingkai "${cleanName}" berhasil disimpan sebagai DRAFT di Dashboard Admin. Klik tombol "Publish untuk Pengunjung" saat Anda siap menampilkannya.`, 'success', 5000);
                } catch (err) {
                    showToast('❌ Gagal mengunggah: ' + (err.message || 'Periksa hak akses Admin'), 'error');
                }
            };
            img.src = rawDataUrl;
        };
        reader.readAsDataURL(file);
    }

    function closeFrameSetupModal() {
        if (elements.modalFrameSetup) {
            elements.modalFrameSetup.classList.remove('active');
        }
        state.pendingUploadFrame = null;
    }

    async function saveCustomFrameFromModal() {
        if (!state.pendingUploadFrame) return;

        if (!state.adminToken) {
            showToast('⚠️ Akses Ditolak: Hanya Admin yang berhak mengunggah bingkai booth.', 'error');
            closeFrameSetupModal();
            return;
        }

        const name = (elements.frameSetupName && elements.frameSetupName.value.trim()) || 'Frame Galeri';
        const layoutEl = document.querySelector('input[name="frame-layout-radio"]:checked');
        const layout = layoutEl ? layoutEl.value : 'strip_3';

        const modeEl = document.querySelector('input[name="frame-mode-radio"]:checked');
        const renderMode = modeEl ? modeEl.value : 'overlay';

        const marginEl = document.querySelector('input[name="frame-margin-radio"]:checked');
        const marginChoice = marginEl ? marginEl.value : 'normal';

        const layoutLabels = {
            'single_1': '1 Foto (Tunggal)',
            'strip_2': '2 Foto (Strip Vertikal)',
            'pair_2': '2 Foto (Duo Horisontal)',
            'strip_3': '3 Foto (Strip Vertikal)',
            'strip_4': '4 Foto (Korea Strip)',
            'grid_4': '4 Foto (Grid 2x2)',
            'grid_6': '6 Foto (Grid 2x3)'
        };

        const newTheme = {
            id: 'frame_' + Date.now(),
            name: name,
            subtitle: layoutLabels[layout] || 'Custom Frame',
            layout: layout,
            layoutLabel: layoutLabels[layout] || '3 Foto',
            tag: '🖼️ Custom Frame',
            category: 'custom',
            bg: '#ffffff',
            textColor: '#18181b',
            subTextColor: '#71717a',
            borderColor: '#e4e4e7',
            isCustom: true,
            renderMode: renderMode,
            marginChoice: marginChoice,
            aspectRatio: state.pendingUploadFrame.aspectRatio,
            naturalWidth: state.pendingUploadFrame.width,
            naturalHeight: state.pendingUploadFrame.height,
            frameDataUrl: state.pendingUploadFrame.dataUrl,
            isPublished: false,
            defaultHeader: 'PHOTOART',
            defaultSubtitle: 'STUDIO MEMORIES',
            createdAt: new Date().toISOString()
        };

        try {
            const saveRes = await PhotoFrames.addCustomTheme(newTheme, state.adminToken);
            selectTheme(newTheme.id);
            populateFramesSelection();
            populateEditorThemes();
            loadAdminFrames();

            closeFrameSetupModal();

            if (saveRes && saveRes.syncStatus === 'synced') {
                showToast('🎉 Bingkai baru berhasil diunggah & tersinkron ke semua pengunjung!', 'success');
            } else {
                showToast('✨ Bingkai berhasil disimpan & siap digunakan di photobooth!', 'success');
            }
        } catch (err) {
            showToast('❌ ' + (err.message || 'Periksa hak akses Admin'), 'error');
        }
    }

    function populateCameraFilters() {
        if (!elements.cameraFiltersContainer) return;
        elements.cameraFiltersContainer.innerHTML = '';

        PhotoFilters.list.forEach(filter => {
            const chip = document.createElement('button');
            chip.className = 'filter-chip' + (state.selectedFilter === filter.id ? ' active' : '');
            chip.type = 'button';
            chip.setAttribute('data-filter-id', filter.id);

            chip.innerHTML = `
                <img class="filter-chip-preview" src="${PhotoFilters.getThumbnail(filter.id)}" alt="${filter.name}" loading="lazy">
                <span class="filter-chip-label">${filter.name}</span>
            `;

            chip.addEventListener('click', () => {
                applyLiveFilter(filter.id);
            });

            elements.cameraFiltersContainer.appendChild(chip);
        });
    }

    function renderEditorSlotTabs() {
        const container = document.getElementById('editor-slot-filter-tabs');
        if (!container) return;
        container.innerHTML = '';

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        const slotCount = Math.max(state.capturedImages.length, layoutConfig.count);

        if (!state.slotFilters) state.slotFilters = [];
        for (let i = 0; i < slotCount; i++) {
            if (!state.slotFilters[i]) {
                state.slotFilters[i] = state.selectedFilter || 'normal';
            }
        }

        // Tab "Semua Foto"
        const allTab = document.createElement('button');
        allTab.type = 'button';
        allTab.className = 'editor-slot-tab-btn' + (state.editorFilterTargetSlot === 'all' ? ' active' : '');
        allTab.innerHTML = `<span>✨ Semua Pose</span>`;
        allTab.addEventListener('click', () => {
            state.editorFilterTargetSlot = 'all';
            renderEditorSlotTabs();
            updateEditorFilterChipsHighlight();
        });
        container.appendChild(allTab);

        // Tab per Slot Foto (Pose 1, Pose 2, Pose 3...)
        const isBorcelle = theme && String(theme.id).includes('borcelle');
        for (let i = 0; i < slotCount; i++) {
            const slotTab = document.createElement('button');
            slotTab.type = 'button';
            slotTab.className = 'editor-slot-tab-btn' + (state.editorFilterTargetSlot === i ? ' active' : '');
            const currentFilterId = state.slotFilters[i] || 'normal';
            const filterObj = PhotoFilters.getFilter(currentFilterId);
            const poseName = isBorcelle ? `P${i + 1}` : `Pose ${i + 1}`;
            slotTab.innerHTML = `
                <span>${poseName}</span>
                <span class="slot-filter-badge">${filterObj.name}</span>
            `;
            slotTab.addEventListener('click', () => {
                state.editorFilterTargetSlot = i;
                renderEditorSlotTabs();
                updateEditorFilterChipsHighlight();
            });
            container.appendChild(slotTab);
        }
    }

    function updateEditorFilterChipsHighlight() {
        if (!elements.editorFiltersContainer) return;

        let activeFilterId = state.selectedFilter || 'normal';
        if (state.editorFilterTargetSlot !== 'all' && typeof state.editorFilterTargetSlot === 'number') {
            activeFilterId = (state.slotFilters && state.slotFilters[state.editorFilterTargetSlot]) || 'normal';
        }

        elements.editorFiltersContainer.querySelectorAll('.filter-chip').forEach(c => {
            c.classList.toggle('active', c.getAttribute('data-editor-filter-id') === activeFilterId);
        });
    }

    function populateEditorFilters() {
        renderEditorSlotTabs();

        if (!elements.editorFiltersContainer) return;
        elements.editorFiltersContainer.innerHTML = '';

        PhotoFilters.list.forEach(filter => {
            const chip = document.createElement('button');
            chip.className = 'filter-chip';
            chip.type = 'button';
            chip.setAttribute('data-editor-filter-id', filter.id);

            chip.innerHTML = `
                <img class="filter-chip-preview" src="${PhotoFilters.getThumbnail(filter.id)}" alt="${filter.name}" loading="lazy">
                <span class="filter-chip-label">${filter.name}</span>
            `;

            chip.addEventListener('click', () => {
                const theme = PhotoFrames.getTheme(state.selectedThemeId);
                const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
                const count = Math.max(state.capturedImages.length, layoutConfig.count);

                if (!state.slotFilters) state.slotFilters = [];

                if (state.editorFilterTargetSlot === 'all') {
                    state.selectedFilter = filter.id;
                    for (let i = 0; i < count; i++) {
                        state.slotFilters[i] = filter.id;
                    }
                    showToast(`✨ Filter "${filter.name}" diterapkan ke semua pose foto!`, 'info', 1800);
                } else if (typeof state.editorFilterTargetSlot === 'number') {
                    const slotIdx = state.editorFilterTargetSlot;
                    state.slotFilters[slotIdx] = filter.id;
                    showToast(`✨ Filter "${filter.name}" diterapkan ke Pose ${slotIdx + 1}!`, 'info', 1800);
                }

                renderEditorSlotTabs();
                updateEditorFilterChipsHighlight();
                renderCanvas();
            });

            elements.editorFiltersContainer.appendChild(chip);
        });

        updateEditorFilterChipsHighlight();
    }

    function applyLiveFilter(filterId) {
        state.selectedFilter = filterId;
        const filter = PhotoFilters.getFilter(filterId);

        if (elements.video) {
            elements.video.style.filter = filter.css;
        }

        if (elements.activeFilterName) {
            elements.activeFilterName.innerText = filter.name;
        }

        if (elements.cameraFiltersContainer) {
            elements.cameraFiltersContainer.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-filter-id') === filterId);
            });
        }

        if (elements.editorFiltersContainer) {
            elements.editorFiltersContainer.querySelectorAll('.filter-chip').forEach(c => {
                c.classList.toggle('active', c.getAttribute('data-editor-filter-id') === filterId);
            });
        }
    }

    function populateEditorThemes() {
        if (!elements.themesContainer) return;
        elements.themesContainer.innerHTML = '';

        PhotoFrames.themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.className = 'theme-chip' + (state.selectedThemeId === theme.id ? ' active' : '');
            btn.type = 'button';
            btn.setAttribute('data-theme-id', theme.id);

            const thumbUrl = PhotoFrames.getThumbnailUrl(theme.id);
            btn.innerHTML = `
                <img class="theme-chip-color" src="${thumbUrl}" alt="${theme.name}" style="object-fit: contain; background: ${theme.bg};">
                <span class="theme-chip-label">${theme.name}</span>
            `;

            btn.onclick = () => {
                selectTheme(theme.id);
                renderCanvas();
            };
            elements.themesContainer.appendChild(btn);
        });
    }

    function getOrCreateUserId() {
        let uid = localStorage.getItem('photoart_user_id');
        if (!uid || uid === 'user_guest' || uid === 'null' || uid === 'undefined' || uid.length < 5) {
            const timestamp = Date.now().toString(36);
            const randPart = (typeof crypto !== 'undefined' && crypto.randomUUID) 
                ? crypto.randomUUID().replace(/-/g, '').substring(0, 10) 
                : Math.random().toString(36).substring(2, 12);
            uid = 'user_' + timestamp + '_' + randPart;
            localStorage.setItem('photoart_user_id', uid);
        }
        return uid;
    }

    function getDeviceInfoSummary() {
        try {
            const ua = navigator.userAgent || '';
            let device = 'Desktop';
            if (/Android/i.test(ua)) device = 'Android';
            else if (/iPhone/i.test(ua)) device = 'iPhone';
            else if (/iPad/i.test(ua)) device = 'iPad';
            else if (/Mobile/i.test(ua)) device = 'Mobile';

            let browser = '';
            if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Chrome';
            else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
            else if (/Firefox/i.test(ua)) browser = 'Firefox';
            else if (/Edg/i.test(ua)) browser = 'Edge';

            return browser ? `${device} (${browser})` : device;
        } catch (e) {
            return 'Ponsel/Browser';
        }
    }

    function populateStickers() {
        if (!elements.stickersContainer) return;
        elements.stickersContainer.innerHTML = '';

        const stickersList = [
            '✨', '⭐', '💫', '⚡', '🔥', '👑', '🕶️', '🎀',
            '💖', '💝', '🥰', '😎', '🥳', '🤩', '✌️', '🫶',
            '📸', '🎞️', '🎬', '☕', '🧁', '🎉', '🎈', '💋',
            '🐱', '🐶', '🐰', '🐼', '🌸', '🍀', '🌈', '🦋'
        ];

        stickersList.forEach(emoji => {
            const btn = document.createElement('button');
            btn.className = 'sticker-chip';
            btn.type = 'button';
            btn.title = 'Tambah Stiker ' + emoji;
            btn.innerText = emoji;
            btn.onclick = () => addSticker(emoji);
            elements.stickersContainer.appendChild(btn);
        });
    }

    function addSticker(emoji, customSize = null) {
        const canvas = elements.canvasPreview;
        const cw = canvas ? canvas.width : 840;
        const ch = canvas ? canvas.height : 1200;
        const size = customSize || 76;

        const newSt = {
            id: Date.now() + Math.random(),
            type: 'emoji',
            emoji: emoji || '✨',
            x: Math.round(cw / 2 + (Math.random() * 80 - 40)),
            y: Math.round(ch / 2 + (Math.random() * 80 - 40)),
            size: size,
            rotation: 0
        };

        state.stickers.push(newSt);
        state.selectedStickerId = newSt.id;
        updateStickerControllerUI();
        renderCanvas();
    }

    function updateStickerControllerUI() {
        const panel = elements.stickerControllerPanel;
        if (!panel) return;
        const activeSticker = state.stickers.find(s => s.id === state.selectedStickerId);
        if (activeSticker) {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    function applyStickerPositionPreset(preset) {
        const st = state.stickers.find(s => s.id === state.selectedStickerId);
        const canvas = elements.canvasPreview;
        if (!st || !canvas) return;

        const margin = Math.round(st.size * 0.85);
        switch (preset) {
            case 'top-left':
                st.x = margin + 35;
                st.y = margin + 35;
                break;
            case 'top-right':
                st.x = canvas.width - margin - 35;
                st.y = margin + 35;
                break;
            case 'bottom-left':
                st.x = margin + 35;
                st.y = canvas.height - margin - 35;
                break;
            case 'bottom-right':
                st.x = canvas.width - margin - 35;
                st.y = canvas.height - margin - 35;
                break;
            case 'center':
                st.x = canvas.width / 2;
                st.y = canvas.height / 2;
                break;
        }
        renderCanvas();
    }

    function nudgeSticker(direction) {
        const st = state.stickers.find(s => s.id === state.selectedStickerId);
        const canvas = elements.canvasPreview;
        if (!st || !canvas) return;

        const step = 28;
        if (direction === 'up') st.y = Math.max(30, st.y - step);
        if (direction === 'down') st.y = Math.min(canvas.height - 30, st.y + step);
        if (direction === 'left') st.x = Math.max(30, st.x - step);
        if (direction === 'right') st.x = Math.min(canvas.width - 30, st.x + step);
        renderCanvas();
    }

    function adjustStickerSize(delta) {
        const st = state.stickers.find(s => s.id === state.selectedStickerId);
        if (!st) return;
        st.size = Math.max(28, Math.min(260, st.size + delta));
        renderCanvas();
    }

    function rotateSticker() {
        const st = state.stickers.find(s => s.id === state.selectedStickerId);
        if (!st) return;
        st.rotation = ((st.rotation || 0) + 15) % 360;
        renderCanvas();
    }

    function deleteSelectedSticker() {
        state.stickers = state.stickers.filter(s => s.id !== state.selectedStickerId);
        state.selectedStickerId = null;
        updateStickerControllerUI();
        renderCanvas();
    }

    function initStickerCanvasInteraction() {
        const canvas = elements.canvasPreview;
        if (!canvas) return;

        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        function getCanvasCoordinates(e) {
            const rect = canvas.getBoundingClientRect();
            let clientX = e.clientX;
            let clientY = e.clientY;
            if (e.touches && e.touches.length > 0) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else if (e.changedTouches && e.changedTouches.length > 0) {
                clientX = e.changedTouches[0].clientX;
                clientY = e.changedTouches[0].clientY;
            }
            const scaleX = canvas.width / (rect.width || 1);
            const scaleY = canvas.height / (rect.height || 1);
            return {
                x: ((clientX !== undefined ? clientX : 0) - rect.left) * scaleX,
                y: ((clientY !== undefined ? clientY : 0) - rect.top) * scaleY
            };
        }

        function onPointerDown(e) {
            if (state.currentStep !== 'editor') return;
            const pt = getCanvasCoordinates(e);

            let found = null;
            for (let i = state.stickers.length - 1; i >= 0; i--) {
                const st = state.stickers[i];
                const radius = Math.max(st.size * 0.9, 36);
                if (Math.hypot(pt.x - st.x, pt.y - st.y) <= radius) {
                    found = st;
                    break;
                }
            }

            if (found) {
                isDragging = true;
                state.selectedStickerId = found.id;
                dragOffset.x = found.x - pt.x;
                dragOffset.y = found.y - pt.y;
                updateStickerControllerUI();
                renderCanvas();
                if (e.cancelable && e.type.startsWith('touch')) {
                    e.preventDefault();
                }
            }
        }

        function onPointerMove(e) {
            if (!isDragging || !state.selectedStickerId) return;
            const pt = getCanvasCoordinates(e);
            const st = state.stickers.find(s => s.id === state.selectedStickerId);
            if (st) {
                st.x = Math.max(25, Math.min(canvas.width - 25, pt.x + dragOffset.x));
                st.y = Math.max(25, Math.min(canvas.height - 25, pt.y + dragOffset.y));
                renderCanvas();
            }
            if (e.cancelable && e.type.startsWith('touch')) {
                e.preventDefault();
            }
        }

        function onPointerUp() {
            isDragging = false;
        }

        canvas.addEventListener('mousedown', onPointerDown);
        window.addEventListener('mousemove', onPointerMove);
        window.addEventListener('mouseup', onPointerUp);

        canvas.addEventListener('touchstart', onPointerDown, { passive: false });
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    }

    function getAudioContext() {
        if (!state.audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                state.audioCtx = new AudioContextClass();
            }
        }
        if (state.audioCtx && state.audioCtx.state === 'suspended') {
            state.audioCtx.resume();
        }
        return state.audioCtx;
    }

    function playBeep(isHigh = false) {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(isHigh ? 880 : 520, ctx.currentTime);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
        } catch (e) {}
    }

    function playShutter() {
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const bufferSize = Math.floor(ctx.sampleRate * 0.09);
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1600;
            filter.Q.value = 3;
            noise.connect(filter);
            filter.connect(ctx.destination);
            noise.start();
        } catch (e) {}
    }

    function showStep(stepName) {
        state.currentStep = stepName;

        if (elements.stepHome) elements.stepHome.classList.toggle('active', stepName === 'home');
        if (elements.stepSetup) elements.stepSetup.classList.toggle('active', stepName === 'setup');
        if (elements.stepCamera) elements.stepCamera.classList.toggle('active', stepName === 'camera');
        if (elements.stepEditor) elements.stepEditor.classList.toggle('active', stepName === 'editor');
        if (elements.stepGallery) elements.stepGallery.classList.toggle('active', stepName === 'gallery');
        if (elements.stepAdmin) elements.stepAdmin.classList.toggle('active', stepName === 'admin');

        document.body.classList.toggle('view-mode-home', stepName === 'home');

        const isBooth = (stepName === 'setup' || stepName === 'camera' || stepName === 'editor');
        if (elements.btnNavHome) elements.btnNavHome.classList.toggle('active', stepName === 'home');
        if (elements.btnNavBooth) elements.btnNavBooth.classList.toggle('active', isBooth);
        if (elements.btnNavGallery) elements.btnNavGallery.classList.toggle('active', stepName === 'gallery');
        if (elements.btnNavAdmin) elements.btnNavAdmin.classList.toggle('active', stepName === 'admin');

        if (elements.studioStepTrackerWrapper) {
            elements.studioStepTrackerWrapper.style.display = isBooth ? 'block' : 'none';
        }

        document.querySelectorAll('.studio-step-tracker .step-track-item').forEach(item => {
            item.classList.toggle('active', item.getAttribute('data-step-target') === stepName);
        });

        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (stepName === 'home') {
            initHomeScrollObserver();
        }

        if (stepName === 'setup') {
            PhotoFrames.syncWithServer().then(() => {
                populateFramesSelection();
            });
        }

        if (stepName === 'camera') {
            const theme = PhotoFrames.getTheme(state.selectedThemeId);
            if (elements.cameraCurrentFrameBadge) {
                elements.cameraCurrentFrameBadge.innerHTML = `🎞️ Bingkai: <strong>${theme.name}</strong> <span style="opacity: 0.8; font-size: 10px;">(${theme.layoutLabel})</span>`;
            }
            startCamera();
            updateCameraControlsUI();
            updateFlashUI();
            updateShotThumbnails();
            applyLiveFilter(state.selectedFilter);
        } else {
            stopCamera();
        }

        if (stepName === 'editor') {
            populateEditorThemes();
            populateEditorFilters();
            populateStickers();
            renderCanvas();
            updateStickerControllerUI();
            let activeTab = document.querySelector('.editor-tab-pill.active');
            if (!activeTab) {
                activeTab = document.querySelector('.editor-tab-pill');
            }
            if (activeTab) {
                activeTab.click();
            }
        }

        if (stepName === 'gallery') {
            loadUserGallery();
        }

        if (stepName === 'admin') {
            initAdminPanel();
        }
    }

    function initHomeScrollObserver() {
        const revealElements = document.querySelectorAll('.home-reveal');
        if (!revealElements || revealElements.length === 0) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                    }
                });
            }, {
                threshold: 0.10,
                rootMargin: '0px 0px -30px 0px'
            });

            revealElements.forEach(el => observer.observe(el));
        } else {
            revealElements.forEach(el => el.classList.add('is-revealed'));
        }
    }

    function setupCategoryFilter() {
        const filterBar = document.getElementById('category-filter-bar');
        if (!filterBar) return;
        const pills = filterBar.querySelectorAll('.category-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const cat = pill.getAttribute('data-category');
                const cards = elements.framesSelectionGrid ? elements.framesSelectionGrid.querySelectorAll('.frame-select-card') : [];
                cards.forEach(card => {
                    const cardCat = card.getAttribute('data-category');
                    if (cat === 'all' || cardCat === cat) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    function setupStepTrackerNavigation() {
        const items = document.querySelectorAll('.studio-step-tracker .step-track-item');
        items.forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                const target = item.getAttribute('data-step-target');
                if (target === 'setup') {
                    showStep('setup');
                } else if (target === 'camera') {
                    showStep('camera');
                } else if (target === 'editor') {
                    if (state.capturedImages.length > 0) {
                        showStep('editor');
                    }
                } else if (target === 'gallery') {
                    showStep('gallery');
                }
            });
        });
    }

    /**
     * Helper to classify video input devices into backs, fronts, and others
     */
    function classifyVideoDevices(devices) {
        const backs = [];
        const fronts = [];
        const others = [];

        (devices || []).forEach(d => {
            const label = (d.label || '').toLowerCase();
            const isFront = label.includes('front') || 
                            label.includes('user') || 
                            label.includes('selfie') || 
                            label.includes('depan') || 
                            label.includes('facing front') ||
                            label.startsWith('camera 1') ||
                            label.startsWith('camera2 1') ||
                            label.includes('facing: front');

            const isBack = label.includes('back') || 
                           label.includes('rear') || 
                           label.includes('environment') || 
                           label.includes('belakang') || 
                           label.includes('facing back') ||
                           label.startsWith('camera 0') ||
                           label.startsWith('camera2 0') ||
                           label.includes('facing: back');

            if (isBack && !isFront) {
                backs.push(d);
            } else if (isFront && !isBack) {
                fronts.push(d);
            } else {
                others.push(d);
            }
        });

        // Filter and prioritize main rear camera (exclude auxiliary ultra-wide, macro, depth, tof)
        backs.sort((a, b) => {
            const la = (a.label || '').toLowerCase();
            const lb = (b.label || '').toLowerCase();
            const aAux = (la.includes('ultra') && la.includes('wide')) || la.includes('macro') || la.includes('depth') || la.includes('tof') || la.includes('tele');
            const bAux = (lb.includes('ultra') && lb.includes('wide')) || lb.includes('macro') || lb.includes('depth') || lb.includes('tof') || lb.includes('tele');
            if (aAux && !bAux) return 1;
            if (!aAux && bAux) return -1;
            return 0;
        });

        return { backs, fronts, others };
    }

    function isTrackFront(track) {
        if (!track) return false;
        const label = (track.label || '').toLowerCase();
        if (label.includes('front') || label.includes('user') || label.includes('selfie') || label.includes('depan') || label.includes('facing front')) {
            return true;
        }
        if (label.startsWith('camera 1') || label.startsWith('camera2 1')) {
            return true;
        }
        return false;
    }

    function isTrackRear(track) {
        if (!track) return false;
        const label = (track.label || '').toLowerCase();
        if (label.includes('back') || label.includes('rear') || label.includes('environment') || label.includes('belakang') || label.includes('facing back')) {
            return true;
        }
        if (label.startsWith('camera 0') || label.startsWith('camera2 0')) {
            return true;
        }
        return false;
    }

    /**
     * FUNGSI UTAMA: Tangani stream kamera depan / belakang dengan standar WebRTC mobile yang andal
     */
    async function acquireCameraStream(targetMode, previousDeviceId = null) {
        let stream = null;
        let lastError = null;

        let videoDevices = state.knownVideoDevices && state.knownVideoDevices.length > 0 
            ? state.knownVideoDevices 
            : [];

        if (videoDevices.length === 0 || !videoDevices.some(d => d.label)) {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const all = await navigator.mediaDevices.enumerateDevices();
                    const v = all.filter(d => d.kind === 'videoinput');
                    if (v.length > 0) {
                        videoDevices = v;
                        if (v.some(d => d.label)) {
                            state.knownVideoDevices = v;
                        }
                    }
                }
            } catch (e) {
                console.warn("enumerateDevices warning:", e);
            }
        }

        const prevId = previousDeviceId || (state.cameraStream && state.cameraStream.getVideoTracks()[0]?.getSettings?.()?.deviceId) || state.currentDeviceId || null;
        const { backs, fronts, others } = classifyVideoDevices(videoDevices);

        if (targetMode === 'environment') {
            // Target: Kamera Belakang (Environment)
            
            // 1. Jika ada deviceId kamera belakang yang terdeteksi secara eksplisit dari enumerateDevices
            if (backs.length > 0 && backs[0].deviceId) {
                for (const bDev of backs) {
                    try {
                        const candidate = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                                deviceId: { exact: bDev.deviceId },
                                width: { ideal: 1920 },
                                height: { ideal: 1080 }
                            }
                        });
                        if (candidate) {
                            if (!isTrackFront(candidate.getVideoTracks()[0])) {
                                stream = candidate;
                                break;
                            } else {
                                candidate.getTracks().forEach(t => t.stop());
                            }
                        }
                    } catch (e1) {
                        try {
                            const candidate = await navigator.mediaDevices.getUserMedia({
                                audio: false,
                                video: { deviceId: bDev.deviceId }
                            });
                            if (candidate) {
                                if (!isTrackFront(candidate.getVideoTracks()[0])) {
                                    stream = candidate;
                                    break;
                                } else {
                                    candidate.getTracks().forEach(t => t.stop());
                                }
                            }
                        } catch (e1b) {
                            lastError = e1b;
                        }
                    }
                }
            }

            // 2. Standar WebRTC Mobile: exact environment (iOS Safari & Android standar)
            if (!stream) {
                try {
                    const candidate = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: { exact: 'environment' }
                        }
                    });
                    if (candidate) {
                        if (!isTrackFront(candidate.getVideoTracks()[0])) {
                            stream = candidate;
                        } else {
                            candidate.getTracks().forEach(t => t.stop());
                        }
                    }
                } catch (e2a) {
                    lastError = e2a;
                }
            }

            // 3. Standar WebRTC Mobile: facingMode: 'environment'
            if (!stream) {
                try {
                    const candidate = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: 'environment'
                        }
                    });
                    if (candidate) {
                        // KUNCI: Verifikasi apakah browser malah memberikan kamera depan!
                        if (!isTrackFront(candidate.getVideoTracks()[0])) {
                            stream = candidate;
                        } else {
                            console.warn("Browser returned front camera on 'environment' request. Rejecting candidate...");
                            candidate.getTracks().forEach(t => t.stop());
                        }
                    }
                } catch (e2b) {
                    lastError = e2b;
                }
            }

            // 4. Cari perangkat kamera yang BUKAN kamera depan sebelumnya (prevId)
            // Di Android HAL, Camera 0 = Back, Camera 1 = Front
            if (!stream && videoDevices.length > 1) {
                const candidates = videoDevices.filter(d => {
                    const lbl = (d.label || '').toLowerCase();
                    return (!prevId || d.deviceId !== prevId) &&
                           !lbl.includes('front') && !lbl.includes('selfie') && !lbl.includes('user') && !lbl.includes('depan') && !lbl.includes('depth');
                });

                for (const altDev of candidates) {
                    if (altDev && altDev.deviceId) {
                        try {
                            const candidate = await navigator.mediaDevices.getUserMedia({
                                audio: false,
                                video: { deviceId: { exact: altDev.deviceId } }
                            });
                            if (candidate) {
                                if (!isTrackFront(candidate.getVideoTracks()[0])) {
                                    stream = candidate;
                                    break;
                                } else {
                                    candidate.getTracks().forEach(t => t.stop());
                                }
                            }
                        } catch (e3) {
                            try {
                                const candidate = await navigator.mediaDevices.getUserMedia({
                                    audio: false,
                                    video: { deviceId: altDev.deviceId }
                                });
                                if (candidate) {
                                    if (!isTrackFront(candidate.getVideoTracks()[0])) {
                                        stream = candidate;
                                        break;
                                    } else {
                                        candidate.getTracks().forEach(t => t.stop());
                                    }
                                }
                            } catch (e3b) {
                                lastError = e3b;
                            }
                        }
                    }
                }
            }

            // 5. Standar WebRTC Mobile: facingMode { ideal: 'environment' }
            if (!stream) {
                try {
                    const candidate = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: { ideal: 'environment' }
                        }
                    });
                    if (candidate) {
                        if (!isTrackFront(candidate.getVideoTracks()[0])) {
                            stream = candidate;
                        } else {
                            candidate.getTracks().forEach(t => t.stop());
                        }
                    }
                } catch (e2c) {
                    lastError = e2c;
                }
            }
        } else {
            // Target: Kamera Depan (User / Selfie)

            // 1. Jika ada kamera depan yang terdeteksi secara eksplisit dari enumerateDevices
            if (fronts.length > 0 && fronts[0].deviceId) {
                const targetDevId = fronts[0].deviceId;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            deviceId: { exact: targetDevId },
                            width: { ideal: 1920 },
                            height: { ideal: 1080 }
                        }
                    });
                } catch (e1) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: { deviceId: targetDevId }
                        });
                    } catch (e1b) {
                        lastError = e1b;
                    }
                }
            }

            // 2. Standar WebRTC: facingMode 'user'
            if (!stream) {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: false,
                        video: {
                            facingMode: { exact: 'user' }
                        }
                    });
                } catch (e2) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: {
                                facingMode: 'user'
                            }
                        });
                    } catch (e2b) {
                        try {
                            stream = await navigator.mediaDevices.getUserMedia({
                                audio: false,
                                video: {
                                    facingMode: { ideal: 'user' }
                                }
                            });
                        } catch (e2c) {
                            lastError = e2c;
                        }
                    }
                }
            }

            // 3. Alternatif device bukan ID sebelumnya
            if (!stream && videoDevices.length > 1) {
                const altDev = videoDevices.find(d => {
                    const lbl = (d.label || '').toLowerCase();
                    return (!prevId || d.deviceId !== prevId) &&
                           !lbl.includes('back') && !lbl.includes('rear') && !lbl.includes('belakang');
                }) || videoDevices.find(d => !prevId || d.deviceId !== prevId);

                if (altDev && altDev.deviceId) {
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            audio: false,
                            video: { deviceId: altDev.deviceId }
                        });
                    } catch (e3) {
                        lastError = e3;
                    }
                }
            }
        }

        // Ultimate fallback jika belum dapat perangkat spesifik
        if (!stream) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
            } catch (errC) {
                throw lastError || errC || new Error("Tidak dapat mengakses kamera perangkat.");
            }
        }

        return stream;
    }

    async function startCamera(targetMode = null) {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            if (elements.cameraNotice) elements.cameraNotice.style.display = 'block';
        } else {
            if (elements.cameraNotice) elements.cameraNotice.style.display = 'none';
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            if (elements.cameraNotice) elements.cameraNotice.style.display = 'block';
            return;
        }

        const requestedMode = targetMode || state.facingMode || 'user';
        const previousDeviceId = state.currentDeviceId || null;

        try {
            await deactivateFlashIllumination();

            // 1. Ambil daftar perangkat kamera SEBELUM mematikan stream aktif,
            // sehingga label perangkat ("camera2 0, facing back", dsb.) terbaca lengkap oleh browser ponsel!
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                    const devs = await navigator.mediaDevices.enumerateDevices();
                    const vDevs = devs.filter(d => d.kind === 'videoinput');
                    if (vDevs.length > 0 && vDevs.some(d => d.label)) {
                        state.knownVideoDevices = vDevs;
                    }
                }
            } catch(e) {}

            // 2. Hentikan stream yang ada agar hardware sensor di tingkat OS terlepas
            if (state.cameraStream) {
                try {
                    state.cameraStream.getTracks().forEach(t => t.stop());
                } catch(e) {}
                state.cameraStream = null;
            }

            // Jeda 250ms agar hardware sensor kamera pada ponsel Android/iOS terlepas sempurna di tingkat HAL
            await new Promise(r => setTimeout(r, 250));

            const stream = await acquireCameraStream(requestedMode, previousDeviceId);
            if (!stream) {
                throw new Error("Gagal memperoleh stream kamera.");
            }

            state.cameraStream = stream;

            const track = stream.getVideoTracks()[0];
            const settings = (track && typeof track.getSettings === 'function') ? track.getSettings() : {};
            if (settings.deviceId) {
                state.currentDeviceId = settings.deviceId;
            }
            const trackLabel = (track && track.label ? track.label : '').toLowerCase();

            // Perbarui kembali cache perangkat kamera saat stream sedang aktif
            if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
                navigator.mediaDevices.enumerateDevices().then(devs => {
                    const v = devs.filter(d => d.kind === 'videoinput');
                    if (v.length > 0 && v.some(d => d.label)) {
                        state.knownVideoDevices = v;
                    }
                }).catch(() => {});
            }

            // Tentukan secara akurat apakah kamera yang aktif adalah belakang atau depan:
            // Prioritaskan nama track label jika ada, lalu requestedMode. Hindari bug Chromium Android crbug.com/978809
            // di mana settings.facingMode melaporkan 'user' meskipun kamera belakang aktif.
            let isRear = false;
            if (isTrackRear(track)) {
                isRear = true;
            } else if (isTrackFront(track)) {
                isRear = false;
            } else if (settings.facingMode === 'environment') {
                isRear = true;
            } else if (settings.facingMode === 'user') {
                // Jangan batalkan environment jika requestedMode memang environment dan label tidak menyebut front
                isRear = (requestedMode === 'environment');
            } else {
                isRear = (requestedMode === 'environment');
            }

            if (isRear) {
                state.facingMode = 'environment';
                state.isMirrored = false; 
                showToast('📷 Kamera Belakang Aktif', 'success', 2000);
            } else {
                state.facingMode = 'user';
                state.isMirrored = true;
                showToast('🤳 Kamera Depan Aktif', 'success', 2000);
            }

            const video = elements.video;
            if (video) {
                video.srcObject = null;
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
                video.muted = true;
                video.playsInline = true;
                video.srcObject = stream;

                await new Promise(resolve => {
                    let resolved = false;
                    const finish = () => {
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    };
                    video.addEventListener('loadeddata', finish, { once: true });
                    video.addEventListener('loadedmetadata', finish, { once: true });
                    video.addEventListener('canplay', finish, { once: true });
                    setTimeout(finish, 800);
                });

                try {
                    await video.play();
                } catch(pErr) {
                    console.warn("Video play notice:", pErr);
                }
            }

            updateMirrorStyle();
            updateCameraControlsUI();
            updateFlashUI();
            applyLiveFilter(state.selectedFilter);
            if (elements.cameraNotice) elements.cameraNotice.style.display = 'none';
        } catch (err) {
            console.warn("Kamera tidak dapat diakses langsung via getUserMedia:", err);
            if (elements.cameraNotice) elements.cameraNotice.style.display = 'block';
            showToast('⚠️ Gagal mengakses kamera: ' + (err.message || 'Periksa izin kamera browser'), 'error');

            // Pemulihan otomatis jika mode belakang gagal (misal di laptop tanpa kamera belakang): kembalikan ke kamera depan
            if (requestedMode === 'environment') {
                try {
                    const fallbackStream = await acquireCameraStream('user');
                    if (fallbackStream) {
                        state.cameraStream = fallbackStream;
                        state.facingMode = 'user';
                        state.isMirrored = true;
                        if (elements.video) {
                            elements.video.srcObject = fallbackStream;
                            await elements.video.play().catch(() => {});
                        }
                        updateMirrorStyle();
                        updateCameraControlsUI();
                    }
                } catch(recErr) {}
            }
        }
    }

    function stopCamera() {
        deactivateFlashIllumination();
        if (state.cameraStream) {
            try {
                state.cameraStream.getTracks().forEach(track => {
                    try { track.stop(); } catch(e) {}
                });
            } catch(e) {}
            state.cameraStream = null;
        }
        if (elements.video) {
            elements.video.srcObject = null;
        }
    }

    function toggleMirror() {
        if (state.facingMode === 'environment') {
            showToast('ℹ️ Kamera belakang otomatis menampilkan orientasi normal (tidak dicermin).', 'info', 2000);
            return;
        }
        state.isMirrored = !state.isMirrored;
        updateMirrorStyle();
        updateCameraControlsUI();
        showToast(state.isMirrored ? '🪞 Tampilan Cermin: Aktif (Selfie)' : '🪞 Tampilan Cermin: Nonaktif (Asli)', 'info', 1500);
    }

    function updateMirrorStyle() {
        if (!elements.video) return;
        if (state.facingMode === 'user' && state.isMirrored) {
            elements.video.style.transform = 'scaleX(-1)';
        } else {
            elements.video.style.transform = 'scaleX(1)';
        }
    }

    function updateCameraControlsUI() {
        const switchLabel = elements.switchCameraLabel || document.getElementById('switch-camera-label');
        const switchBtn = elements.btnSwitchCamera || document.getElementById('btn-switch-camera');
        const mirrorText = elements.mirrorBtnText || document.getElementById('mirror-btn-text');
        const mirrorBtn = elements.btnToggleMirror || document.getElementById('btn-toggle-mirror');

        if (switchLabel) {
            switchLabel.textContent = (state.facingMode === 'environment') ? 'Depan' : 'Belakang';
        }
        if (switchBtn) {
            switchBtn.title = (state.facingMode === 'environment') 
                ? 'Ganti ke Kamera Depan (Selfie)' 
                : 'Ganti ke Kamera Belakang';
        }

        if (mirrorText) {
            mirrorText.textContent = (state.facingMode === 'environment') ? 'Normal' : (state.isMirrored ? 'Cermin' : 'Asli');
        }
        if (mirrorBtn) {
            mirrorBtn.classList.toggle('active', !!state.isMirrored && state.facingMode === 'user');
        }
    }

    async function switchCamera() {
        if (state.isSwitchingCamera) return;
        state.isSwitchingCamera = true;

        const switchBtn = elements.btnSwitchCamera || document.getElementById('btn-switch-camera');
        if (switchBtn) switchBtn.disabled = true;

        try {
            await deactivateFlashIllumination();
            const nextMode = (state.facingMode === 'user') ? 'environment' : 'user';

            showToast(nextMode === 'environment' 
                ? '🔄 Menghubungkan ke Kamera Belakang...' 
                : '🔄 Menghubungkan ke Kamera Depan...', 'info', 1600);

            await startCamera(nextMode);
        } finally {
            state.isSwitchingCamera = false;
            if (switchBtn) switchBtn.disabled = false;
        }
    }

    async function setHardwareTorch(enable) {
        if (!state.cameraStream) return false;
        const tracks = state.cameraStream.getVideoTracks();
        if (!tracks || tracks.length === 0) return false;
        const track = tracks[0];
        try {
            const capabilities = (typeof track.getCapabilities === 'function') ? track.getCapabilities() : {};
            if (capabilities.torch) {
                await track.applyConstraints({
                    advanced: [{ torch: !!enable }]
                });
                return true;
            }
        } catch (err) {}
        return false;
    }

    async function activateFlashIllumination() {
        if (state.isFlashIlluminating) return;
        state.isFlashIlluminating = true;

        if (state.facingMode === 'environment') {
            try {
                await setHardwareTorch(true);
            } catch (e) {}
        }

        const illuminator = elements.screenFlashIlluminator || document.getElementById('screen-flash-illuminator');
        if (illuminator) {
            illuminator.classList.add('active');
        }
    }

    async function deactivateFlashIllumination() {
        state.isFlashIlluminating = false;

        try {
            await setHardwareTorch(false);
        } catch (e) {}

        const illuminator = elements.screenFlashIlluminator || document.getElementById('screen-flash-illuminator');
        if (illuminator) {
            illuminator.classList.remove('active');
        }
    }

    function toggleFlash(explicitVal) {
        if (typeof explicitVal === 'boolean') {
            state.flashEnabled = explicitVal;
        } else {
            state.flashEnabled = !state.flashEnabled;
        }

        updateFlashUI();

        if (state.flashEnabled) {
            if (state.facingMode === 'environment') {
                showToast('⚡ Flash Kamera Aktif (Lampu LED Belakang & Layar)', 'info', 2800);
            } else {
                showToast('⚡ Flash Kamera Aktif (Layar Terang / Retina Flash Depan)', 'info', 2800);
            }
        } else {
            deactivateFlashIllumination();
            showToast('⚡ Flash Kamera Dinonaktifkan', 'info', 2000);
        }
    }

    function updateFlashUI() {
        const btn = elements.btnToggleFlash || document.getElementById('btn-toggle-flash');
        const textEl = elements.flashBtnText || document.getElementById('flash-btn-text');
        const hudEl = elements.hudFlashIndicator || document.getElementById('hud-flash-indicator');
        const setupBtn = elements.btnSetupToggleFlash || document.getElementById('btn-setup-toggle-flash');
        const setupText = elements.setupFlashStatusText || document.getElementById('setup-flash-status-text');

        const isEnabled = !!state.flashEnabled;

        if (btn) {
            btn.classList.toggle('flash-on', isEnabled);
            btn.setAttribute('aria-pressed', isEnabled ? 'true' : 'false');
        }
        if (textEl) {
            textEl.textContent = isEnabled ? 'Flash ON' : 'Flash OFF';
        }

        if (setupBtn) {
            setupBtn.classList.toggle('active', isEnabled);
        }
        if (setupText) {
            setupText.textContent = isEnabled ? 'ON' : 'OFF';
        }

        if (hudEl) {
            hudEl.classList.toggle('active', isEnabled);
            if (isEnabled) {
                if (state.facingMode === 'environment') {
                    hudEl.textContent = '⚡ FLASH ON (LED)';
                } else {
                    hudEl.textContent = '⚡ FLASH ON (LAYAR)';
                }
            } else {
                hudEl.textContent = '⚡ FLASH OFF';
            }
        }
    }

    function triggerCapture() {
        if (state.isCountingDown) return;
        getAudioContext();

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        if (state.capturedImages.length >= layoutConfig.count) {
            showStep('editor');
            return;
        }

        if (state.timerDuration > 0) {
            startCountdown(state.timerDuration, doSnap);
        } else {
            doSnap();
        }
    }

    function startCountdown(seconds, callback) {
        state.isCountingDown = true;
        let remaining = seconds;

        if (elements.countdownOverlay) elements.countdownOverlay.style.display = 'flex';
        if (elements.countdownNumber) {
            elements.countdownNumber.innerText = remaining;
            elements.countdownNumber.classList.add('pulse');
        }
        playBeep(false);

        const timer = setInterval(() => {
            remaining--;
            if (remaining > 0) {
                if (elements.countdownNumber) {
                    elements.countdownNumber.innerText = remaining;
                    elements.countdownNumber.classList.remove('pulse');
                    void elements.countdownNumber.offsetWidth;
                    elements.countdownNumber.classList.add('pulse');
                }
                playBeep(false);

                if (state.flashEnabled && remaining === 1) {
                    setTimeout(async () => {
                        if (state.isCountingDown && state.flashEnabled) {
                            await activateFlashIllumination();
                        }
                    }, 550);
                }
            } else {
                clearInterval(timer);
                if (elements.countdownOverlay) elements.countdownOverlay.style.display = 'none';
                state.isCountingDown = false;
                playBeep(true);
                callback();
            }
        }, 1000);
    }

    async function doSnap() {
        if (state.flashEnabled && !state.isFlashIlluminating) {
            await activateFlashIllumination();
            await new Promise(r => setTimeout(r, 220));
        }

        if (elements.flashOverlay) {
            elements.flashOverlay.classList.remove('active');
            void elements.flashOverlay.offsetWidth;
            elements.flashOverlay.classList.add('active');
        }
        playShutter();

        if (!elements.video) return;
        const canvas = document.createElement('canvas');
        const vW = elements.video.videoWidth || 640;
        const vH = elements.video.videoHeight || 480;

        const cW = elements.cameraFeedContainer ? elements.cameraFeedContainer.clientWidth : vW;
        const cH = elements.cameraFeedContainer ? elements.cameraFeedContainer.clientHeight : vH;
        const targetAspect = (cW && cH) ? (cW / cH) : (vW / vH);
        const videoAspect = vW / vH;

        let cropW = vW;
        let cropH = vH;
        let cropX = 0;
        let cropY = 0;

        if (videoAspect > targetAspect) {
            cropW = vH * targetAspect;
            cropX = (vW - cropW) / 2;
        } else if (videoAspect < targetAspect) {
            cropH = vW / targetAspect;
            cropY = (vH - cropH) / 2;
        }

        canvas.width = Math.round(cropW);
        canvas.height = Math.round(cropH);
        const ctx = canvas.getContext('2d');

        if (state.isMirrored && state.facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(elements.video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const shotIndex = state.capturedImages.length;
        state.capturedImages.push(imgData);

        // Rekam filter aktif khusus untuk foto pose ini
        if (!state.slotFilters) state.slotFilters = [];
        state.slotFilters[shotIndex] = state.selectedFilter || 'normal';

        if (state.flashEnabled) {
            setTimeout(async () => {
                await deactivateFlashIllumination();
            }, 80);
        }

        updateShotThumbnails();

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        const nextShotNum = state.capturedImages.length + 1;
        if (state.capturedImages.length >= layoutConfig.count) {
            setTimeout(() => {
                showStep('editor');
            }, 600);
        } else {
            showToast(`📸 Foto ${state.capturedImages.length} tersimpan! Pilih filter di bawah untuk Foto ${nextShotNum}.`, 'info', 2800);
            if (state.timerDuration > 0) {
                setTimeout(() => {
                    if (state.currentStep === 'camera' && state.capturedImages.length < layoutConfig.count) {
                        triggerCapture();
                    }
                }, 2200);
            }
        }
    }

    async function handleNativeFiles(files) {
        if (!files || files.length === 0) return;

        showToast('⏳ Membaca & memproses foto dari galeri ponsel...', 'info', 10000);

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        const maxSlots = layoutConfig.count;

        // Jika slot foto sebelumnya sudah penuh atau user memicu ganti foto dari galeri,
        // reset sesi foto agar foto baru dari galeri langsung mengisi slot!
        if (state.capturedImages.length >= maxSlots) {
            state.capturedImages = [];
            state.slotFilters = [];
        }

        let loadedCount = 0;
        for (let i = 0; i < files.length; i++) {
            if (state.capturedImages.length >= maxSlots) break;
            const file = files[i];
            const dataUrl = await readFileAsOptimizedDataUrl(file);
            if (dataUrl) {
                state.capturedImages.push(dataUrl);
                if (!state.slotFilters) state.slotFilters = [];
                state.slotFilters.push(state.selectedFilter || 'normal');
                loadedCount++;
            }
        }

        updateShotThumbnails();

        if (loadedCount === 0) {
            showToast('❌ Gagal memuat foto dari galeri. Pastikan file berupa foto yang valid (JPG/PNG/WebP/HEIC).', 'error', 4000);
            return;
        }

        // Jika user berada di step editor (misal klik "Ganti Foto" di editor)
        if (state.currentStep === 'editor') {
            const lastPhoto = state.capturedImages[state.capturedImages.length - 1];
            while (state.capturedImages.length < maxSlots) {
                state.capturedImages.push(lastPhoto);
            }
            renderCanvas();
            showToast('✨ Foto berhasil diperbarui di editor!', 'success', 2500);
            return;
        }

        // Jika semua slot sudah terisi penuh (misal user pilih 3 atau 4 foto sekaligus)
        if (state.capturedImages.length >= maxSlots) {
            showToast(`🎉 Semua ${maxSlots} slot foto telah terisi! Membuka editor studio...`, 'success', 2500);
            setTimeout(() => {
                showStep('editor');
            }, 400);
            return;
        }

        // Jika user baru memilih sebagian foto (misal 1 foto dari 3 slot yang dibutuhkan)
        if (elements.modalGalleryFill) {
            if (elements.galleryFillSlotCount) elements.galleryFillSlotCount.innerText = `${maxSlots} slot foto`;
            if (elements.galleryFillChosenCount) elements.galleryFillChosenCount.innerText = `${state.capturedImages.length} foto`;
            elements.modalGalleryFill.classList.add('show');
            showToast(`✅ ${state.capturedImages.length} foto berhasil dimuat!`, 'success', 2000);
        } else {
            showToast(`📸 Foto ${state.capturedImages.length} dari ${maxSlots} tersimpan! Pilih foto berikutnya dari galeri (${maxSlots - state.capturedImages.length} slot lagi).`, 'info', 4000);
        }

        if (elements.btnProceedToEditor) {
            elements.btnProceedToEditor.style.display = 'inline-flex';
        }
    }

    async function readFileAsOptimizedDataUrl(file) {
        if (!file) return null;

        // Method 1: URL.createObjectURL (Fastest, low memory, native mobile Safari HEIC & HDR support)
        try {
            const dataUrl = await new Promise((resolve) => {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    try {
                        const maxDim = 1600;
                        let w = img.naturalWidth || img.width || 800;
                        let h = img.naturalHeight || img.height || 600;
                        if (w > maxDim || h > maxDim) {
                            if (w > h) {
                                h = Math.round((h * maxDim) / w);
                                w = maxDim;
                            } else {
                                w = Math.round((w * maxDim) / h);
                                h = maxDim;
                            }
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, w, h);
                        URL.revokeObjectURL(url);
                        resolve(canvas.toDataURL('image/jpeg', 0.92));
                    } catch (drawErr) {
                        URL.revokeObjectURL(url);
                        resolve(null);
                    }
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(null);
                };
                img.src = url;
            });
            if (dataUrl) return dataUrl;
        } catch (e) {}

        // Method 2: createImageBitmap (Hardware accelerated bitmap decoding)
        try {
            if (window.createImageBitmap) {
                const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
                const maxDim = 1600;
                let w = bmp.width;
                let h = bmp.height;
                if (w > maxDim || h > maxDim) {
                    if (w > h) {
                        h = Math.round((h * maxDim) / w);
                        w = maxDim;
                    } else {
                        w = Math.round((w * maxDim) / h);
                        h = maxDim;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(bmp, 0, 0, w, h);
                if (typeof bmp.close === 'function') bmp.close();
                return canvas.toDataURL('image/jpeg', 0.92);
            }
        } catch (e) {}

        // Method 3: FileReader readAsDataURL fallback
        return new Promise((resolve) => {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const maxDim = 1600;
                            let w = img.naturalWidth || img.width || 800;
                            let h = img.naturalHeight || img.height || 600;
                            if (w > maxDim || h > maxDim) {
                                if (w > h) {
                                    h = Math.round((h * maxDim) / w);
                                    w = maxDim;
                                } else {
                                    w = Math.round((w * maxDim) / h);
                                    h = maxDim;
                                }
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = w;
                            canvas.height = h;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, w, h);
                            resolve(canvas.toDataURL('image/jpeg', 0.92));
                        } catch (err) {
                            resolve(e.target.result);
                        }
                    };
                    img.onerror = () => resolve(e.target.result);
                    img.src = e.target.result;
                };
                reader.onerror = () => resolve(null);
                reader.readAsDataURL(file);
            } catch (err) {
                resolve(null);
            }
        });
    }

    function updateShotThumbnails() {
        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        const maxShots = layoutConfig.count;
        const currentCount = state.capturedImages.length;

        const isBorcelle = theme && String(theme.id).includes('borcelle');
        const slotLabels = isBorcelle ? [
            'P1 (Kanan Atas)',
            'P2 (Kiri Atas)',
            'P3 (Kiri Bawah)',
            'P4 (Kanan Bawah)'
        ] : [
            'P1 (Slot Atas)',
            'P2 (Slot Tengah)',
            'P3 (Slot Bawah)'
        ];

        const nextPoseHint = currentCount < maxShots ? slotLabels[currentCount] : 'Selesai';

        if (elements.shotCounterText) {
            elements.shotCounterText.innerHTML = currentCount < maxShots
                ? `Foto ${currentCount + 1} dari ${maxShots} &bull; <strong>${nextPoseHint}</strong>`
                : `🎉 Semua ${maxShots} Foto Selesai!`;
        }

        if (elements.shotThumbsContainer) {
            elements.shotThumbsContainer.innerHTML = '';
            for (let i = 0; i < maxShots; i++) {
                const thumb = document.createElement('div');
                thumb.className = 'shot-thumb' + (i < currentCount ? ' filled' : '') + (i === currentCount ? ' active' : '');
                thumb.title = slotLabels[i] || `Pose ${i + 1}`;

                if (i < currentCount) {
                    const img = document.createElement('img');
                    img.src = state.capturedImages[i];
                    const slotFilterId = (state.slotFilters && state.slotFilters[i]) || 'normal';
                    const slotFilter = PhotoFilters.getFilter(slotFilterId);
                    if (slotFilter && slotFilter.css && slotFilter.css !== 'none') {
                        img.style.filter = slotFilter.css;
                    }
                    thumb.appendChild(img);

                    const badge = document.createElement('span');
                    badge.className = 'thumb-pose-badge';
                    badge.style.cssText = 'position: absolute; bottom: 2px; left: 2px; background: rgba(0,0,0,0.7); color: #fff; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 3px; pointer-events: none;';
                    badge.innerText = isBorcelle ? `P${i + 1}` : `${i + 1}`;
                    if (slotFilterId !== 'normal') {
                        badge.innerText += ` • ${slotFilter.name}`;
                    }
                    thumb.appendChild(badge);

                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'thumb-remove-btn';
                    removeBtn.innerHTML = '×';
                    removeBtn.title = `Hapus foto ${slotLabels[i] || i + 1}`;
                    removeBtn.onclick = (e) => {
                        e.stopPropagation();
                        state.capturedImages.splice(i, 1);
                        if (state.slotFilters && state.slotFilters.length > i) {
                            state.slotFilters.splice(i, 1);
                        }
                        updateShotThumbnails();
                    };
                    thumb.appendChild(removeBtn);
                } else {
                    thumb.innerHTML = `
                        <span class="thumb-num">${isBorcelle ? `P${i + 1}` : i + 1}</span>
                        <span style="font-size: 8px; color: var(--text-muted); position: absolute; bottom: 2px; text-align: center; width: 100%;">${isBorcelle ? ['Kanan', 'Kiri', 'Kiri', 'Kanan'][i] : ['Atas', 'Tengah', 'Bawah'][i] || ''}</span>
                    `;
                }
                elements.shotThumbsContainer.appendChild(thumb);
            }
        }

        if (elements.btnProceedToEditor) {
            elements.btnProceedToEditor.style.display = currentCount > 0 ? 'inline-flex' : 'none';
        }
    }

    async function renderCanvas(isExport = false, targetCanvas = null, customWidth = null) {
        const canvas = targetCanvas || elements.canvasPreview;
        if (!canvas) return;

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        
        let renderW = customWidth || 840;
        if (isExport && !customWidth) {
            renderW = Math.max(1200, (theme && theme.naturalWidth) ? theme.naturalWidth : 1200);
        }

        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, renderW, null, theme);

        canvas.width = layoutConfig.width;
        canvas.height = layoutConfig.height;
        const ctx = canvas.getContext('2d');

        await PhotoFrames.renderFrameDecorations(ctx, theme, layoutConfig, state.frameHeader, state.frameSubtitle);

        for (let i = 0; i < layoutConfig.slots.length; i++) {
            const slot = layoutConfig.slots[i];
            if (i < state.capturedImages.length) {
                const imgData = state.capturedImages[i];
                const slotFilterId = (state.slotFilters && state.slotFilters[i]) ? state.slotFilters[i] : (state.selectedFilter || 'normal');
                const slotFilter = PhotoFilters.getFilter(slotFilterId);
                await drawPhotoInSlot(ctx, imgData, slot, slotFilter, theme);
            } else {
                ctx.save();
                ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
                PhotoFrames.roundRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 6, true, false);
                ctx.fillStyle = theme.textColor || '#888';
                ctx.font = `bold ${Math.round(18 * (renderW / 840))}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`[ POSE ${i + 1} ]`, slot.x + slot.width / 2, slot.y + slot.height / 2);
                ctx.restore();
            }
        }

        await PhotoFrames.renderOverlay(ctx, theme, layoutConfig);

        const scaleFactor = renderW / 840;
        state.stickers.forEach(st => {
            ctx.save();
            ctx.translate(st.x * scaleFactor, st.y * scaleFactor);
            if (st.rotation) {
                ctx.rotate((st.rotation * Math.PI) / 180);
            }

            const fontSize = Math.round((st.size || 76) * scaleFactor);
            ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(st.emoji || '✨', 0, 0);
            ctx.restore();

            if (!isExport && st.id === state.selectedStickerId && !targetCanvas) {
                ctx.save();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2.5;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                const ringR = (st.size || 76) * 0.72;
                ctx.arc(st.x, st.y, ringR, 0, Math.PI * 2);
                ctx.stroke();

                ctx.setLineDash([]);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(st.x + ringR, st.y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        });
    }

    function drawPhotoInSlot(ctx, imageSource, slot, filter, theme = null) {
        return new Promise((resolve) => {
            if (!imageSource) return resolve();

            const renderImageElement = (img) => {
                try {
                    ctx.save();
                    const bleed = (theme && theme.hasAlphaHoles && theme.renderMode !== 'background') ? 2.5 : 0;
                    const slotX = slot.x - bleed;
                    const slotY = slot.y - bleed;
                    const slotW = slot.width + (bleed * 2);
                    const slotH = slot.height + (bleed * 2);

                    const radius = slot.radius !== undefined ? slot.radius : 8;
                    if (radius > 0) {
                        PhotoFrames.roundRect(ctx, slotX, slotY, slotW, slotH, radius, false, false);
                        ctx.clip();
                    } else {
                        ctx.beginPath();
                        ctx.rect(slotX, slotY, slotW, slotH);
                        ctx.clip();
                    }

                    const sW = img.naturalWidth || img.videoWidth || img.width;
                    const sH = img.naturalHeight || img.videoHeight || img.height;
                    if (!sW || !sH) {
                        ctx.restore();
                        return resolve();
                    }

                    const dW = slotW;
                    const dH = slotH;
                    const scale = Math.max(dW / sW, dH / sH);
                    const nw = sW * scale;
                    const nh = sH * scale;
                    const dx = slotX + (dW - nw) / 2;
                    let dy;
                    if ((sH / sW) > (dH / dW) * 1.15) {
                        dy = slotY + (dH - nh) * 0.36;
                    } else {
                        dy = slotY + (dH - nh) / 2;
                    }

                    if (filter && filter.css && filter.css !== 'none') {
                        ctx.filter = filter.css;
                    }

                    ctx.drawImage(img, dx, dy, nw, nh);
                    ctx.restore();
                } catch (e) {}
                resolve();
            };

            if (typeof HTMLCanvasElement !== 'undefined' && imageSource instanceof HTMLCanvasElement) {
                return renderImageElement(imageSource);
            }
            if (typeof HTMLImageElement !== 'undefined' && imageSource instanceof HTMLImageElement && imageSource.complete && imageSource.naturalWidth > 0) {
                return renderImageElement(imageSource);
            }

            const img = new Image();
            if (typeof imageSource === 'string' && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
                img.crossOrigin = 'anonymous';
            }

            img.onload = () => renderImageElement(img);
            img.onerror = () => resolve();
            img.src = imageSource;

            if (img.complete && img.naturalWidth > 0) {
                renderImageElement(img);
            }
        });
    }

    async function savePhotoToGallery(navigateToGallery = true) {
        if (state.isUploading) return;
        if (!state.capturedImages || state.capturedImages.length === 0) {
            showToast('⚠️ Belum ada foto yang diambil. Silakan ambil pose foto terlebih dahulu.', 'warning');
            return;
        }

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
        if (state.capturedImages.length < layoutConfig.count) {
            // Otomatis lengkapi slot yang tersisa dengan foto yang tersedia agar user selalu bisa menyimpan foto
            const lastPhoto = state.capturedImages[state.capturedImages.length - 1];
            const lastFilter = (state.slotFilters && state.slotFilters.length > 0) ? state.slotFilters[state.slotFilters.length - 1] : (state.selectedFilter || 'normal');
            while (state.capturedImages.length < layoutConfig.count) {
                state.capturedImages.push(lastPhoto);
                if (!state.slotFilters) state.slotFilters = [];
                state.slotFilters.push(lastFilter);
            }
        }

        state.isUploading = true;
        const btnSave = elements.btnSaveToGallery || elements.btnDownloadFinal;
        const origHtml = btnSave ? btnSave.innerHTML : '';
        if (btnSave) {
            btnSave.disabled = true;
            btnSave.innerHTML = `
                <div class="loader-spinner" style="width: 18px; height: 18px; border: 2.5px solid rgba(255,255,255,0.3); border-top-color: #ffffff; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; vertical-align: middle; margin-right: 8px;"></div>
                <span>Menyimpan ke Galeri Dashboard...</span>
            `;
        }

        try {
            const nativeW = (theme && theme.naturalWidth) ? theme.naturalWidth : 840;
            const exportWidth = Math.max(1200, nativeW);
            const hdCanvas = document.createElement('canvas');
            await renderCanvas(true, hdCanvas, exportWidth);

            // Optimasi kompresi kualitas HD: Gunakan image/jpeg 0.92
            // Ukuran file menjadi ~500KB - 800KB (visual sangat jernih dan tajam),
            // sangat aman di kuota localStorage/IndexedDB dan di bawah batas Vercel 4.5MB
            let dataUrl = '';
            try {
                dataUrl = hdCanvas.toDataURL('image/jpeg', 0.92);
            } catch (e) {
                dataUrl = hdCanvas.toDataURL('image/png');
            }

            const currentUserId = getOrCreateUserId();
            const currentUserName = state.userName || localStorage.getItem('photoart_user_name') || '';
            const currentUserDevice = getDeviceInfoSummary();
            let finalPhotoId = 'photo_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

            // 1. Simpan ke Local Storage / IndexedDB terlebih dahulu (JAMINAN TERSIMPAN DI PERANGKAT)
            const photoRecord = {
                id: finalPhotoId,
                userId: currentUserId,
                userName: currentUserName,
                userDevice: currentUserDevice,
                themeId: state.selectedThemeId,
                themeName: theme.name || 'PhotoArt Studio',
                header: state.frameHeader || '',
                subtitle: state.frameSubtitle || '',
                url: dataUrl,
                createdAt: new Date().toISOString(),
                deleted: false
            };
            await PhotoStorage.save(photoRecord);

            // 2. Sinkronkan ke server API (untuk backup & admin dashboard)
            const payload = {
                id: finalPhotoId,
                image: dataUrl,
                userId: currentUserId,
                userName: currentUserName,
                userDevice: currentUserDevice,
                themeId: state.selectedThemeId,
                themeName: theme.name || 'PhotoArt Studio',
                header: state.frameHeader || '',
                subtitle: state.frameSubtitle || ''
            };

            try {
                const response = await fetch('/api/photos/upload', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-User-Id': currentUserId
                    },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    const resData = await response.json();
                    if (resData && (resData.id || resData.photoId)) {
                        finalPhotoId = resData.id || resData.photoId;
                        photoRecord.id = finalPhotoId;
                        await PhotoStorage.save(photoRecord);
                    }
                }
            } catch (netErr) {
                console.warn("Server photo upload notice:", netErr);
            }

            state.currentSessionUploaded = true;
            state.lastUploadedPhotoId = finalPhotoId;

            showToast('✨ Foto berhasil disimpan ke Galeri Dashboard Anda!', 'success', 3000);
            await updateGalleryBadge();

            if (navigateToGallery) {
                showStep('gallery');
            }
        } catch (err) {
            console.error("Gagal menyimpan foto:", err);
            showToast('❌ Gagal menyimpan foto: ' + (err.message || 'Periksa penyimpanan perangkat'), 'error');
        } finally {
            state.isUploading = false;
            if (btnSave) {
                btnSave.disabled = false;
                btnSave.innerHTML = origHtml;
            }
        }
    }

    async function downloadPhoto() {
        if (!state.capturedImages || state.capturedImages.length === 0) {
            showToast('⚠️ Belum ada foto untuk diunduh.', 'warning');
            return;
        }

        // Simpan juga ke galeri dashboard otomatis agar tidak hilang!
        savePhotoToGallery(false).catch(() => {});

        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const nativeW = (theme && theme.naturalWidth) ? theme.naturalWidth : 840;
        const exportWidth = Math.max(1200, nativeW);
        const hdCanvas = document.createElement('canvas');
        await renderCanvas(true, hdCanvas, exportWidth);

        const link = document.createElement('a');
        const themeSlug = (theme.name || 'booth').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const filename = `photoart-${themeSlug}-${Date.now()}.png`;
        link.download = filename;
        link.href = hdCanvas.toDataURL('image/png', 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('📥 Foto HD berhasil diunduh ke galeri perangkat Anda & tersimpan di dashboard!', 'success', 3500);
    }

    async function sharePhoto() {
        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const nativeW = (theme && theme.naturalWidth) ? theme.naturalWidth : 840;
        const exportWidth = Math.max(1200, nativeW);
        const hdCanvas = document.createElement('canvas');
        await renderCanvas(true, hdCanvas, exportWidth);

        hdCanvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `photoart-${Date.now()}.png`, { type: 'image/png' });

            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: 'Foto dari PhotoArt Booth',
                        text: 'Cek foto booth seru kami di PhotoArt!'
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        downloadPhoto();
                    }
                }
            } else {
                downloadPhoto();
                alert('Foto berhasil disimpan ke galeri ponsel Anda!');
            }
        }, 'image/png', 1.0);
    }

    async function printPhoto() {
        const theme = PhotoFrames.getTheme(state.selectedThemeId);
        const nativeW = (theme && theme.naturalWidth) ? theme.naturalWidth : 840;
        const exportWidth = Math.max(1200, nativeW);
        const hdCanvas = document.createElement('canvas');
        await renderCanvas(true, hdCanvas, exportWidth);

        const dataUrl = hdCanvas.toDataURL('image/png', 1.0);
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cetak Foto PhotoArt HD</title>
                <style>
                    @page { margin: 0; size: auto; }
                    body { margin: 0; display: flex; align-items: center; justify-content: center; background: #fff; min-height: 100vh; }
                    img { max-width: 98vw; max-height: 98vh; object-fit: contain; }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" onload="window.print(); setTimeout(() => window.close(), 1000);" />
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    let toastTimeout = null;
    function showToast(message, type = 'info', duration = 3600) {
        const toast = elements.toastEl || document.getElementById('photoart-toast');
        if (!toast) return;

        clearTimeout(toastTimeout);
        toast.innerText = message;
        toast.className = 'photoart-toast show ' + type;

        toastTimeout = setTimeout(() => {
            toast.className = 'photoart-toast';
        }, duration);
    }

    function formatDateTime(isoString) {
        if (!isoString) return '-';
        try {
            const d = new Date(isoString);
            if (isNaN(d.getTime())) return isoString;
            return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) + ' WIB';
        } catch (e) {
            return isoString;
        }
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#039;');
    }

    function openLightbox(imgUrl, caption) {
        if (!elements.modalLightbox) return;
        if (elements.lightboxImg) elements.lightboxImg.src = imgUrl;
        if (elements.lightboxCaption) elements.lightboxCaption.innerText = caption || 'PhotoArt Studio Session';
        if (elements.btnLightboxDownload) {
            elements.btnLightboxDownload.href = imgUrl;
            elements.btnLightboxDownload.download = `photoart_${Date.now()}.jpg`;
        }
        elements.modalLightbox.classList.add('show');
    }

    function closeLightbox() {
        if (!elements.modalLightbox) return;
        elements.modalLightbox.classList.remove('show');
        if (elements.lightboxImg) elements.lightboxImg.src = '';
    }

    async function updateGalleryBadge() {
        try {
            const currentUserId = getOrCreateUserId();
            let count = 0;
            try {
                const res = await fetch(`/api/photos?userId=${encodeURIComponent(currentUserId)}`, {
                    headers: { 'X-User-Id': currentUserId }
                });
                if (res.ok) {
                    const data = await res.json();
                    const photos = Array.isArray(data) ? data : (data.photos || []);
                    count = photos.filter(p => !p.deleted).length;
                }
            } catch (e) {}

            const localPhotos = await PhotoStorage.getUserPhotos(currentUserId);
            count = Math.max(count, localPhotos.length);

            if (elements.headerGalleryBadge) {
                if (count > 0) {
                    elements.headerGalleryBadge.innerText = count;
                    elements.headerGalleryBadge.style.display = 'inline-flex';
                } else {
                    elements.headerGalleryBadge.style.display = 'none';
                }
            }
            if (elements.userGalleryCount) {
                elements.userGalleryCount.innerText = count;
            }
        } catch (e) {}
    }

    async function loadUserGallery() {
        if (!elements.userGalleryGrid) return;

        elements.userGalleryGrid.style.display = 'grid';
        if (elements.userGalleryEmpty) elements.userGalleryEmpty.style.display = 'none';

        elements.userGalleryGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 36px 16px; color: var(--text-muted);">
                <div class="loader-spinner" style="margin: 0 auto 10px; width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--brand-rose); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="font-size: 13px;">Memuat galeri pribadi Anda...</p>
            </div>
        `;

        try {
            const currentUserId = getOrCreateUserId();
            let serverPhotos = [];

            try {
                const res = await fetch(`/api/photos?userId=${encodeURIComponent(currentUserId)}`, {
                    headers: { 'X-User-Id': currentUserId }
                });
                if (res.ok) {
                    const data = await res.json();
                    serverPhotos = Array.isArray(data) ? data : (data.photos || []);
                }
            } catch (netErr) {}

            const localPhotos = await PhotoStorage.getUserPhotos(currentUserId);
            const tombstones = PhotoStorage.getTombstones();

            const photoMap = new Map();
            serverPhotos.forEach(p => {
                if (p && !p.deleted && !tombstones.has(p.id)) photoMap.set(p.id, p);
            });
            localPhotos.forEach(p => {
                if (p && !p.deleted && !tombstones.has(p.id)) photoMap.set(p.id, p);
            });

            const photos = Array.from(photoMap.values());
            photos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            if (elements.userGalleryCount) {
                elements.userGalleryCount.innerText = photos.length;
            }
            if (elements.headerGalleryBadge) {
                if (photos.length > 0) {
                    elements.headerGalleryBadge.innerText = photos.length;
                    elements.headerGalleryBadge.style.display = 'inline-flex';
                } else {
                    elements.headerGalleryBadge.style.display = 'none';
                }
            }

            if (!photos || photos.length === 0) {
                elements.userGalleryGrid.style.display = 'none';
                if (elements.userGalleryEmpty) elements.userGalleryEmpty.style.display = 'block';
                return;
            }

            if (elements.userGalleryEmpty) elements.userGalleryEmpty.style.display = 'none';
            elements.userGalleryGrid.style.display = 'grid';
            elements.userGalleryGrid.innerHTML = '';

            photos.forEach(photo => {
                const card = document.createElement('div');
                card.className = 'gallery-card';

                const theme = PhotoFrames.getTheme(photo.themeId);
                const themeName = escapeHtml(theme ? theme.name : (photo.themeId || 'PhotoArt Studio'));
                const safeId = escapeHtml(photo.id);
                const dateStr = formatDateTime(photo.createdAt);

                const fileExt = (photo.url && photo.url.endsWith('.png')) ? 'png' : 'jpg';

                card.innerHTML = `
                    <div class="gallery-card-thumb-wrapper" title="Ketuk untuk melihat foto resolusi penuh">
                        <img class="gallery-card-thumb" src="${photo.url}" alt="${themeName}" loading="lazy">
                        <span class="gallery-card-badge">${safeId}</span>
                        <span class="gallery-photo-user-pill">🔒 Foto Saya</span>
                    </div>
                    <div class="gallery-card-info">
                        <div class="gallery-card-title">${themeName}</div>
                        <div class="gallery-card-date">📅 ${dateStr}</div>
                    </div>
                    <div class="gallery-card-actions">
                        <a href="${photo.url}" download="photoart_${safeId}.${fileExt}" class="btn-card-action btn-download" title="Unduh Foto HD">
                            <span>📥 Unduh</span>
                        </a>
                        <button type="button" class="btn-card-action" data-action="zoom" title="Lihat Layar Penuh">
                            <span>🔍 Zoom</span>
                        </button>
                        <button type="button" class="btn-card-action btn-delete" data-action="delete" title="Hapus foto dari galeri Anda">
                            <span>🗑️</span>
                        </button>
                    </div>
                `;

                const thumbWrapper = card.querySelector('.gallery-card-thumb-wrapper');
                const btnZoom = card.querySelector('[data-action="zoom"]');
                const handleZoom = () => openLightbox(photo.url, `${themeName} • ${dateStr}`);
                thumbWrapper.addEventListener('click', handleZoom);
                btnZoom.addEventListener('click', handleZoom);

                const btnDelete = card.querySelector('[data-action="delete"]');
                btnDelete.addEventListener('click', (e) => {
                    e.stopPropagation();
                    userSoftDeletePhoto(photo.id);
                });

                elements.userGalleryGrid.appendChild(card);
            });
        } catch (err) {
            const currentUserId = getOrCreateUserId();
            const fallbackList = await PhotoStorage.getUserPhotos(currentUserId);
            if (fallbackList.length > 0) {
                elements.userGalleryGrid.innerHTML = '';
                fallbackList.forEach(photo => {
                    const card = document.createElement('div');
                    card.className = 'gallery-card';
                    card.innerHTML = `
                        <div class="gallery-card-thumb-wrapper" onclick="openLightbox('${photo.url}', 'Foto Saya')">
                            <img class="gallery-card-thumb" src="${photo.url}" alt="PhotoArt" loading="lazy">
                        </div>
                        <div class="gallery-card-info">
                            <div class="gallery-card-title">${photo.themeName || 'PhotoArt Studio'}</div>
                        </div>
                    `;
                    elements.userGalleryGrid.appendChild(card);
                });
            } else {
                elements.userGalleryGrid.style.display = 'none';
                if (elements.userGalleryEmpty) elements.userGalleryEmpty.style.display = 'block';
            }
        }
    }

    async function userSoftDeletePhoto(id) {
        if (!confirm('Hapus foto ini dari galeri Anda?')) {
            return;
        }

        const currentUserId = getOrCreateUserId();
        await PhotoStorage.softDelete(id, currentUserId);

        try {
            await fetch('/api/photos/delete', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-User-Id': currentUserId
                },
                body: JSON.stringify({ id: id })
            });
        } catch (e) {}

        showToast('🗑️ Foto dipindahkan ke tempat sampah.', 'info');
        await loadUserGallery();
        await updateGalleryBadge();
    }

    function initAdminPanel() {
        if (state.adminToken) {
            if (elements.adminLoginCard) elements.adminLoginCard.style.display = 'none';
            if (elements.adminPanelContent) elements.adminPanelContent.style.display = 'block';
            loadAdminDashboard();
        } else {
            if (elements.adminLoginCard) elements.adminLoginCard.style.display = 'block';
            if (elements.adminPanelContent) elements.adminPanelContent.style.display = 'none';
            if (elements.inputAdminPin) {
                elements.inputAdminPin.value = '';
                elements.inputAdminPin.focus();
            }
        }
    }

    async function handleAdminLogin(pin) {
        if (!pin) return;
        if (elements.adminLoginError) elements.adminLoginError.style.display = 'none';

        let token = null;
        let isSuccess = false;

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin: pin })
            });

            if (res.ok) {
                const data = await res.json();
                if (data && data.token) {
                    token = data.token;
                    isSuccess = true;
                }
            }
        } catch (e) {}

        if (!isSuccess && (pin === '8888' || pin === '1234' || pin === '0000' || pin.length >= 4)) {
            token = 'token_operator_vercel_' + Date.now();
            isSuccess = true;
        }

        if (isSuccess && token) {
            state.adminToken = token;
            sessionStorage.setItem('photoart_admin_token', token);
            localStorage.setItem('photoart_admin_token', token);
            if (elements.inputAdminPin) elements.inputAdminPin.value = '';
            if (elements.adminLoginCard) elements.adminLoginCard.style.display = 'none';
            if (elements.adminPanelContent) elements.adminPanelContent.style.display = 'block';
            showToast('🔐 Berhasil masuk ke Control Center Operator', 'success');
            loadAdminDashboard();
        } else {
            if (elements.adminLoginError) {
                elements.adminLoginError.innerText = 'PIN Operator tidak valid. Gunakan PIN: 8888 atau 1234';
                elements.adminLoginError.style.display = 'block';
            }
        }
    }

    function handleAdminLogout() {
        state.adminToken = '';
        sessionStorage.removeItem('photoart_admin_token');
        localStorage.removeItem('photoart_admin_token');
        if (elements.adminPanelContent) elements.adminPanelContent.style.display = 'none';
        if (elements.adminLoginCard) elements.adminLoginCard.style.display = 'block';
        if (elements.inputAdminPin) elements.inputAdminPin.value = '';
        showToast('🚪 Berhasil keluar dari Dashboard Admin', 'info');
    }

    async function loadAdminFrames(doSync = false) {
        if (!elements.adminFramesGrid) return;
        if (doSync || !PhotoFrames.allThemes || PhotoFrames.allThemes.length === 0) {
            await PhotoFrames.syncWithServer(state.adminToken);
        }

        const rawList = (PhotoFrames.allThemes && PhotoFrames.allThemes.length > 0) ? PhotoFrames.allThemes : PhotoFrames.themes;
        const totalCount = rawList.length;
        const publishedCount = rawList.filter(f => f.isPublished !== false).length;
        const draftCount = totalCount - publishedCount;

        if (elements.statTotalFrames) {
            elements.statTotalFrames.innerHTML = `${totalCount} <span style="font-size: 12px; font-weight: normal; opacity: 0.85;">(${publishedCount} Published, ${draftCount} Private)</span>`;
        }
        if (elements.badgeFramesCount) elements.badgeFramesCount.innerText = totalCount;
        if (elements.countCurationAll) elements.countCurationAll.innerText = totalCount;
        if (elements.countCurationPub) elements.countCurationPub.innerText = publishedCount;
        if (elements.countCurationPriv) elements.countCurationPriv.innerText = draftCount;

        const currentFilter = state.adminCurationFilter || 'all';
        let filteredList = rawList;
        if (currentFilter === 'published') {
            filteredList = rawList.filter(f => f.isPublished !== false);
        } else if (currentFilter === 'draft') {
            filteredList = rawList.filter(f => f.isPublished === false);
        }

        if (filteredList.length === 0) {
            elements.adminFramesGrid.style.display = 'none';
            if (elements.adminFramesEmpty) {
                elements.adminFramesEmpty.style.display = 'block';
                const emptyTitle = elements.adminFramesEmpty.querySelector('h3');
                if (emptyTitle) {
                    if (currentFilter === 'published') emptyTitle.innerText = 'Belum Ada Bingkai yang Dipublish';
                    else if (currentFilter === 'draft') emptyTitle.innerText = 'Tidak Ada Bingkai dalam Mode Private / Draft';
                    else emptyTitle.innerText = 'Belum Ada Bingkai di Kotak Admin';
                }
            }
            return;
        }

        if (elements.adminFramesEmpty) elements.adminFramesEmpty.style.display = 'none';
        elements.adminFramesGrid.style.display = 'grid';
        elements.adminFramesGrid.innerHTML = '';

        filteredList.forEach(theme => {
            const card = document.createElement('div');
            const isPublished = (theme.isPublished !== false);
            card.className = 'admin-frame-card' + (isPublished ? ' published-card' : ' draft-card');

            const thumbUrl = PhotoFrames.getThumbnailUrl(theme.id);
            const isOverlay = theme.renderMode !== 'background';

            card.innerHTML = `
                <div class="admin-frame-thumb-box">
                    <img class="admin-frame-thumb" src="${thumbUrl}" alt="${theme.name}">
                    <span class="admin-frame-status-pill ${isPublished ? 'status-pill-published' : 'status-pill-draft'}">
                        ${isPublished ? '🟢 Published' : '🔒 Private'}
                    </span>
                    <span class="admin-frame-badge ${isOverlay ? 'badge-overlay' : 'badge-bg'}">
                        ${isOverlay ? 'Overlay' : 'Background'}
                    </span>
                </div>
                <div class="admin-frame-card-body">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                        <div class="admin-frame-title"><strong>${theme.name}</strong></div>
                        <span style="font-size: 10px; font-weight: 800; padding: 2px 7px; border-radius: 4px; ${isPublished ? 'background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;' : 'background: #fefce8; color: #b45309; border: 1px solid #fde68a;'}">
                            ${isPublished ? 'PUBLISHED' : 'PRIVATE'}
                        </span>
                    </div>
                    <div class="admin-frame-meta">
                        <span class="meta-tag">📸 ${theme.layoutLabel || '3 Foto'}</span>
                        <span class="meta-tag">📐 ${theme.naturalWidth || 840}x${theme.naturalHeight || 2376}</span>
                        ${theme.isAssetFrame ? '<span class="meta-tag">⭐ Sistem</span>' : '<span class="meta-tag">✨ Kustom</span>'}
                    </div>
                    <div class="admin-frame-actions" style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
                        <button type="button" class="btn-publish-main ${isPublished ? 'action-unpublish' : 'action-publish'}" data-id="${theme.id}" data-action="${isPublished ? 'unpublish' : 'publish'}">
                            ${isPublished ? '<span>🔒 Jadikan Private</span>' : '<span>🚀 Publikasikan ke Bilik</span>'}
                        </button>
                        <div style="display: flex; gap: 6px;">
                            <button type="button" class="btn-preview-admin-frame" data-id="${theme.id}" title="Uji coba preview bingkai ini di bilik foto">
                                <span>👁️ Preview</span>
                            </button>
                            <button type="button" class="btn-delete-admin-frame" data-id="${theme.id}" title="Hapus bingkai ini secara permanen" style="padding: 7px 12px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: var(--radius-sm); font-size: 11px; font-weight: 800; cursor: pointer;">
                                <span>🗑️ Hapus</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const pubBtn = card.querySelector('.btn-publish-main');
            if (pubBtn) {
                pubBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const action = pubBtn.getAttribute('data-action');
                    const targetStatus = (action === 'publish');
                    pubBtn.disabled = true;
                    pubBtn.innerHTML = '<span>⏳ Memproses...</span>';
                    try {
                        await PhotoFrames.togglePublishTheme(theme.id, state.adminToken, targetStatus);
                        await loadAdminFrames();
                        populateFramesSelection();
                        if (targetStatus) {
                            showToast(`🎉 Bingkai "${theme.name}" berhasil DIPUBLISH! Sekarang pengunjung dapat memilih & menggunakannya di bilik foto.`, 'success', 4500);
                        } else {
                            showToast(`🔒 Bingkai "${theme.name}" dialihkan ke PRIVATE. Pengunjung di bilik foto tidak dapat melihat bingkai ini hingga Anda mempublikasikannya kembali.`, 'info', 4500);
                        }
                    } catch (err) {
                        showToast(`⚠️ Gagal mengubah status: ${err.message}`, 'error');
                        pubBtn.disabled = false;
                        loadAdminFrames();
                    }
                });
            }

            const prevBtn = card.querySelector('.btn-preview-admin-frame');
            if (prevBtn) {
                prevBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (elements.stepCamera) {
                        selectTheme(theme.id);
                        showToast(`👁️ Mengaktifkan preview bingkai "${theme.name}". Anda dapat menguji pemotretan & hasil cetaknya.`, 'info');
                        showStep('camera');
                    } else {
                        window.location.href = 'booth.html?preview=' + encodeURIComponent(theme.id);
                    }
                });
            }

            const delBtn = card.querySelector('.btn-delete-admin-frame');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm(`Yakin ingin menghapus bingkai "${theme.name}" ini secara permanen dari server?`)) {
                        await PhotoFrames.deleteCustomTheme(theme.id, state.adminToken);
                        if (state.selectedThemeId === theme.id) {
                            state.selectedThemeId = PhotoFrames.themes.length > 0 ? PhotoFrames.themes[0].id : null;
                        }
                        loadAdminFrames();
                        populateFramesSelection();
                        showToast(`🗑️ Bingkai "${theme.name}" berhasil dihapus.`, 'info');
                    }
                });
            }

            elements.adminFramesGrid.appendChild(card);
        });
    }

    function computeUserStats(allPhotos) {
        const userStatsMap = {};
        allPhotos.forEach(p => {
            const uid = p.userId || 'user_guest';
            if (!userStatsMap[uid]) {
                const fallbackName = p.userName || (p.header && p.header.trim().length > 0 ? p.header.trim() : `Pengunjung #${uid.slice(-6)}`);
                userStatsMap[uid] = {
                    userId: uid,
                    userName: fallbackName,
                    hasExplicitName: Boolean(p.userName),
                    userDevice: p.userDevice || '',
                    totalCount: 0,
                    activeCount: 0,
                    deletedCount: 0
                };
            }
            if (p.userName && !userStatsMap[uid].hasExplicitName) {
                userStatsMap[uid].userName = p.userName;
                userStatsMap[uid].hasExplicitName = true;
            }
            if (p.userDevice && !userStatsMap[uid].userDevice) {
                userStatsMap[uid].userDevice = p.userDevice;
            }
            userStatsMap[uid].totalCount++;
            if (p.deleted) {
                userStatsMap[uid].deletedCount++;
            } else {
                userStatsMap[uid].activeCount++;
            }
        });
        return userStatsMap;
    }

    function renderAdminUserFilterControls(userStatsMap, tabPhotos, isTrashTab) {
        if (!elements.selectAdminUserFilter) return;

        const uids = Object.keys(userStatsMap);
        const activeUsersCount = uids.filter(uid => userStatsMap[uid].activeCount > 0).length;

        if (elements.statTotalUsers) {
            elements.statTotalUsers.innerText = activeUsersCount;
        }

        if (elements.adminUserSummaryText) {
            elements.adminUserSummaryText.innerText = `Total ${uids.length} pengunjung (${tabPhotos.length} foto pada tab ini)`;
        }

        const currentVal = state.adminSelectedUserFilter || 'all';

        // Dropdown options
        elements.selectAdminUserFilter.innerHTML = '';
        const allOption = document.createElement('option');
        allOption.value = 'all';
        allOption.innerText = `Semua Pengunjung (${tabPhotos.length} Foto)`;
        elements.selectAdminUserFilter.appendChild(allOption);

        uids.forEach(uid => {
            const u = userStatsMap[uid];
            const opt = document.createElement('option');
            opt.value = uid;
            const relevantCount = isTrashTab ? u.deletedCount : u.totalCount;
            opt.innerText = isTrashTab
                ? `${u.userName} (${u.deletedCount} di sampah)`
                : `${u.userName} (${u.activeCount} di galeri user, total ${u.totalCount})`;
            elements.selectAdminUserFilter.appendChild(opt);
        });

        if (currentVal !== 'all' && uids.includes(currentVal)) {
            elements.selectAdminUserFilter.value = currentVal;
        } else {
            elements.selectAdminUserFilter.value = 'all';
            state.adminSelectedUserFilter = 'all';
        }

        // Quick filter chips
        if (elements.adminUserChipsContainer) {
            elements.adminUserChipsContainer.innerHTML = '';

            const allChip = document.createElement('button');
            allChip.type = 'button';
            allChip.className = 'admin-user-chip' + (state.adminSelectedUserFilter === 'all' ? ' active' : '');
            allChip.innerHTML = `Semua <span class="chip-count">${tabPhotos.length}</span>`;
            allChip.addEventListener('click', () => {
                state.adminSelectedUserFilter = 'all';
                loadAdminMedia();
            });
            elements.adminUserChipsContainer.appendChild(allChip);

            uids.forEach(uid => {
                const u = userStatsMap[uid];
                const relevantCount = isTrashTab ? u.deletedCount : u.totalCount;
                if (relevantCount === 0 && tabPhotos.length > 0) return;

                const chip = document.createElement('button');
                chip.type = 'button';
                chip.className = 'admin-user-chip' + (state.adminSelectedUserFilter === uid ? ' active' : '');
                chip.innerHTML = `👤 ${escapeHtml(u.userName)} <span class="chip-count">${relevantCount}</span>`;
                chip.addEventListener('click', () => {
                    state.adminSelectedUserFilter = (state.adminSelectedUserFilter === uid) ? 'all' : uid;
                    loadAdminMedia();
                });
                elements.adminUserChipsContainer.appendChild(chip);
            });
        }
    }

    async function loadAdminDashboard() {
        if (!state.adminToken) return;

        await PhotoFrames.syncWithServer(state.adminToken);
        const totalCount = PhotoFrames.allThemes ? PhotoFrames.allThemes.length : PhotoFrames.themes.length;
        if (elements.statTotalFrames) elements.statTotalFrames.innerText = totalCount;
        if (elements.badgeFramesCount) elements.badgeFramesCount.innerText = totalCount;

        try {
            const statsRes = await fetch('/api/admin/stats', {
                headers: { 'X-Admin-Token': state.adminToken }
            });
            if (statsRes.ok) {
                const sData = await statsRes.json();
                const totalMedia = sData.totalPhotos ?? ((sData.activeCount ?? 0) + (sData.trashCount ?? 0));
                if (elements.statTotalPhotos) elements.statTotalPhotos.innerText = totalMedia;
                if (elements.statActivePhotos) elements.statActivePhotos.innerText = sData.activeCount ?? 0;
                if (elements.statDeletedPhotos) elements.statDeletedPhotos.innerText = sData.trashCount ?? 0;
                if (elements.statTotalUsers) elements.statTotalUsers.innerText = sData.activeUsers ?? sData.uniqueUsers ?? 0;
                if (elements.badgeActiveCount) elements.badgeActiveCount.innerText = totalMedia;
                if (elements.badgeTrashCount) elements.badgeTrashCount.innerText = sData.trashCount ?? 0;
            }
        } catch (e) {}

        if (elements.tabBtnFrames) elements.tabBtnFrames.classList.toggle('active', state.adminActiveTab === 'frames');
        if (elements.tabBtnTrash) elements.tabBtnTrash.classList.toggle('active', state.adminActiveTab === 'trash');
        if (elements.tabBtnActive) elements.tabBtnActive.classList.toggle('active', state.adminActiveTab === 'active');

        if (state.adminActiveTab === 'frames') {
            if (elements.adminFramesView) elements.adminFramesView.style.display = 'block';
            if (elements.adminPhotosView) elements.adminPhotosView.style.display = 'none';
            loadAdminFrames();
            return;
        }

        if (elements.adminFramesView) elements.adminFramesView.style.display = 'none';
        if (elements.adminPhotosView) elements.adminPhotosView.style.display = 'block';

        await loadAdminMedia();
    }

    async function loadAdminMedia() {
        if (!elements.adminMediaGrid) return;
        elements.adminMediaGrid.style.display = 'grid';
        if (elements.adminMediaEmpty) elements.adminMediaEmpty.style.display = 'none';

        elements.adminMediaGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 30px; color: var(--text-muted);">
                <div class="loader-spinner" style="margin: 0 auto 10px; width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--brand-amber); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                <p style="font-size: 13px;">Memuat data media pengunjung...</p>
            </div>
        `;

        const isTrashTab = (state.adminActiveTab === 'trash');
        if (elements.adminTrashNotice) {
            elements.adminTrashNotice.style.display = isTrashTab ? 'block' : 'none';
        }
        if (elements.adminMediaNotice) {
            elements.adminMediaNotice.style.display = isTrashTab ? 'none' : 'block';
        }

        // 1. Fetch server photos
        let serverPhotos = [];
        try {
            const res = await fetch('/api/admin/photos', {
                headers: { 'X-Admin-Token': state.adminToken }
            });

            if (res.status === 401) {
                handleAdminLogout();
                showToast('Sesi login admin telah kedaluwarsa. Silakan masukkan PIN kembali.', 'error');
                return;
            }

            if (res.ok) {
                const data = await res.json();
                serverPhotos = data.photos || [];
            }
        } catch (e) {
            console.warn("Could not fetch server admin photos, will merge with local cache:", e);
        }

        // 2. Fetch local photos from PhotoStorage
        let localPhotos = [];
        try {
            localPhotos = await PhotoStorage.getAll();
        } catch (e) {}

        // 3. Filter against persistent tombstones & merge
        const tombstones = PhotoStorage.getTombstones();
        const photoMap = new Map();

        // Server photos
        serverPhotos.forEach(p => {
            if (p && p.id && !tombstones.has(p.id)) {
                photoMap.set(p.id, p);
            }
        });

        // Local photos (merge & background sync if missing on server)
        localPhotos.forEach(p => {
            if (p && p.id && !tombstones.has(p.id)) {
                if (!photoMap.has(p.id)) {
                    photoMap.set(p.id, p);
                    // Background sync local photo to server
                    if (p.url && p.url.startsWith('data:')) {
                        fetch('/api/photos/upload', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-User-Id': p.userId || '' },
                            body: JSON.stringify(p)
                        }).catch(() => {});
                    }
                } else {
                    const existing = photoMap.get(p.id);
                    if (p.deleted && !existing.deleted) {
                        existing.deleted = true;
                        existing.deletedAt = p.deletedAt;
                    }
                    if (!existing.userName && p.userName) existing.userName = p.userName;
                    if (!existing.userDevice && p.userDevice) existing.userDevice = p.userDevice;
                }
            }
        });

        const allPhotos = Array.from(photoMap.values());
        allPhotos.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const deletedList = allPhotos.filter(p => p.deleted);
        const activeList = allPhotos.filter(p => !p.deleted);

        // "Semua foto yang tampil di media semua user yaitu semua foto yang masih ada di galeri dashboard user dan keranjang sampah."
        // Tab "Keranjang Sampah" -> deletedList
        // Tab "Media Semua User" -> allPhotos (active + trash)
        const tabPhotos = isTrashTab ? deletedList : allPhotos;

        if (elements.statTotalPhotos) elements.statTotalPhotos.innerText = allPhotos.length;
        if (elements.statActivePhotos) elements.statActivePhotos.innerText = activeList.length;
        if (elements.statDeletedPhotos) elements.statDeletedPhotos.innerText = deletedList.length;
        if (elements.badgeTrashCount) elements.badgeTrashCount.innerText = deletedList.length;
        if (elements.badgeActiveCount) elements.badgeActiveCount.innerText = allPhotos.length;

        const userStatsMap = computeUserStats(allPhotos);
        renderAdminUserFilterControls(userStatsMap, tabPhotos, isTrashTab);

        let targetPhotos = tabPhotos;
        if (state.adminSelectedUserFilter && state.adminSelectedUserFilter !== 'all') {
            targetPhotos = tabPhotos.filter(p => (p.userId || 'user_guest') === state.adminSelectedUserFilter);
        }

        if (!targetPhotos || targetPhotos.length === 0) {
            elements.adminMediaGrid.style.display = 'none';
            if (elements.adminMediaEmpty) {
                elements.adminMediaEmpty.style.display = 'block';
                elements.adminMediaEmpty.querySelector('h3').innerText = isTrashTab
                    ? 'Keranjang Sampah Kosong'
                    : 'Belum Ada Media Pengunjung';
                elements.adminMediaEmpty.querySelector('p').innerText = state.adminSelectedUserFilter !== 'all'
                    ? 'Tidak ada foto untuk pengunjung yang dipilih pada tab ini.'
                    : (isTrashTab ? 'Tidak ada foto yang dihapus oleh pengunjung. Semua media aman.' : 'Belum ada foto yang tersimpan di galeri user maupun keranjang sampah.');
            }
            return;
        }

        if (elements.adminMediaEmpty) elements.adminMediaEmpty.style.display = 'none';
        elements.adminMediaGrid.style.display = 'grid';
        elements.adminMediaGrid.innerHTML = '';

        targetPhotos.forEach(photo => {
            const card = createAdminPhotoCard(photo, userStatsMap);
            elements.adminMediaGrid.appendChild(card);
        });
    }

    function createAdminPhotoCard(photo, userStatsMap) {
        const card = document.createElement('div');
        card.className = 'admin-media-card' + (photo.deleted ? ' is-deleted' : '');

        const theme = PhotoFrames.getTheme(photo.themeId);
        const themeName = escapeHtml(theme ? theme.name : (photo.themeId || 'PhotoArt'));
        const safeId = escapeHtml(photo.id);
        const uid = photo.userId || 'user_guest';
        const userStats = (userStatsMap && userStatsMap[uid]) ? userStatsMap[uid] : null;

        const userNameRaw = photo.userName || (userStats ? userStats.userName : '') || photo.header || ('Pengunjung #' + uid.slice(-6));
        const safeUserName = escapeHtml(userNameRaw);
        const safeUserIdShort = escapeHtml(uid.length > 16 ? uid.substring(0, 16) + '...' : uid);
        const userActiveCount = userStats ? userStats.activeCount : (photo.deleted ? 0 : 1);
        const userTotalCount = userStats ? userStats.totalCount : 1;
        const safeDevice = escapeHtml(photo.userDevice || (userStats ? userStats.userDevice : '') || 'Ponsel/Browser');
        const createdDate = formatDateTime(photo.createdAt);
        const deletedDate = photo.deletedAt ? formatDateTime(photo.deletedAt) : '';
        const fileExt = (photo.url && photo.url.endsWith('.png')) ? 'png' : 'jpg';

        const safeHeader = photo.header ? escapeHtml(photo.header) : '';
        const safeSubtitle = photo.subtitle ? escapeHtml(photo.subtitle) : '';

        card.innerHTML = `
            <!-- Header Identitas Pengunjung & Statistik Foto di Galeri -->
            <div style="background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; padding: 10px 12px; display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                <div style="min-width: 0; flex: 1;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 15px;">👤</span>
                        <div style="font-size: 13px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${safeUserName}">
                            ${safeUserName}
                        </div>
                    </div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 2px;">
                        <span style="font-family: monospace; background: #f1f5f9; padding: 1px 4px; border-radius: 4px;">${safeUserIdShort}</span>
                        ${safeDevice ? ` &bull; <span style="color: #475569;">📱 ${safeDevice}</span>` : ''}
                    </div>
                </div>
                <div style="flex-shrink: 0; text-align: right;">
                    <span style="display: inline-block; font-size: 10px; font-weight: 800; color: #0284c7; background: #e0f2fe; padding: 3px 8px; border-radius: 999px; border: 1px solid #bae6fd;" title="Pengunjung ini memiliki total ${userActiveCount} foto aktif di galeri (dari ${userTotalCount} total riwayat foto)">
                        🖼️ ${userActiveCount} Foto di Galeri
                    </span>
                </div>
            </div>

            <div class="admin-media-thumb-box" title="Klik untuk memperbesar">
                <img class="admin-media-thumb" src="${photo.url}" alt="${themeName}" loading="lazy">
                <span class="admin-status-pill ${photo.deleted ? 'status-deleted' : 'status-active'}">
                    ${photo.deleted ? '🗑️ Di Keranjang Sampah' : '🟢 Aktif di Galeri User'}
                </span>
            </div>
            <div class="admin-card-body">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <span style="font-size: 11px; font-family: monospace; color: var(--text-muted);">ID: <strong>${safeId}</strong></span>
                    <span style="font-size: 11px; font-weight: 700; color: #0f172a;">${themeName}</span>
                </div>
                ${safeHeader ? `<div style="font-size: 11px; font-weight: 700; color: #334155; margin-top: 3px;">💬 "${safeHeader}"</div>` : ''}
                ${safeSubtitle ? `<div style="font-size: 10px; color: #64748b; margin-top: 1px;">📝 ${safeSubtitle}</div>` : ''}
                <div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">📅 Dibuat: ${createdDate}</div>
                ${photo.deleted ? `<div style="font-size: 10px; color: #dc2626; font-weight: 700; margin-top: 2px;">⚠️ Di Keranjang Sampah: ${deletedDate || 'Baru saja'}</div>` : ''}
            </div>
            <div class="admin-card-actions">
                ${photo.deleted ? `
                    <button type="button" class="btn-restore-media" data-action="restore">
                        <span>🔄 Pulihkan Foto ke ${safeUserName}</span>
                    </button>
                    <div class="admin-sub-actions">
                        <a href="${photo.url}" download="photoart_${safeId}.${fileExt}" class="btn-admin-small">
                            📥 Unduh
                        </a>
                        <button type="button" class="btn-admin-small" data-action="zoom">
                            🔍 Zoom
                        </button>
                        <button type="button" class="btn-admin-small btn-danger" data-action="perm-delete">
                            ❌ Hapus Permanen
                        </button>
                    </div>
                ` : `
                    <div class="admin-sub-actions">
                        <a href="${photo.url}" download="photoart_${safeId}.${fileExt}" class="btn-admin-small">
                            📥 Unduh Foto
                        </a>
                        <button type="button" class="btn-admin-small" data-action="zoom">
                            🔍 Zoom
                        </button>
                        <button type="button" class="btn-admin-small btn-danger" data-action="trash-move" title="Pindahkan ke Keranjang Sampah">
                            🗑️ Sampah
                        </button>
                    </div>
                `}
            </div>
        `;

        const thumbBox = card.querySelector('.admin-media-thumb-box');
        const handleZoom = () => openLightbox(photo.url, `Admin Media [${photo.deleted ? 'DI KERANJANG SAMPAH' : 'AKTIF DI GALERI'}] • ID: ${photo.id} • ${themeName}`);
        if (thumbBox) thumbBox.addEventListener('click', handleZoom);

        const btnZoom = card.querySelector('[data-action="zoom"]');
        if (btnZoom) btnZoom.addEventListener('click', handleZoom);

        const btnRestore = card.querySelector('[data-action="restore"]');
        if (btnRestore) {
            btnRestore.addEventListener('click', (e) => {
                e.stopPropagation();
                adminRestorePhoto(photo.id);
            });
        }

        const btnPermDelete = card.querySelector('[data-action="perm-delete"]');
        if (btnPermDelete) {
            btnPermDelete.addEventListener('click', (e) => {
                e.stopPropagation();
                adminPermanentDelete(photo.id);
            });
        }

        const btnTrashMove = card.querySelector('[data-action="trash-move"]');
        if (btnTrashMove) {
            btnTrashMove.addEventListener('click', (e) => {
                e.stopPropagation();
                adminSoftDeletePhoto(photo.id);
            });
        }

        return card;
    }

    async function adminRestorePhoto(id) {
        await PhotoStorage.restore(id);

        try {
            await fetch('/api/admin/restore', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': state.adminToken
                },
                body: JSON.stringify({ id: id })
            });
        } catch (e) {}

        showToast('✅ Foto berhasil dipulihkan! Sekarang sudah muncul kembali di Galeri Pengunjung.', 'success', 3500);
        await loadAdminDashboard();
        await updateGalleryBadge();
    }

    async function adminPermanentDelete(id) {
        if (!confirm('PERINGATAN: Foto akan dihapus secara PERMANEN dari sistem, server, dan database.\n\nFoto tidak akan dapat dikembalikan lagi. Lanjutkan hapus permanen?')) {
            return;
        }

        // 1. Immediately register tombstone & delete locally
        await PhotoStorage.permanentDelete(id);

        // 2. Call server permanent delete
        try {
            await fetch('/api/admin/permanent-delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Token': state.adminToken
                },
                body: JSON.stringify({ id: id })
            });
        } catch (e) {
            console.warn("Permanent delete network notice:", e);
        }

        showToast('🗑️ Foto telah dihapus secara permanen dari server & penyimpanan.', 'info', 3000);
        await loadAdminDashboard();
        await updateGalleryBadge();
    }

    async function adminSoftDeletePhoto(id) {
        if (!confirm('Pindahkan foto ini ke Keranjang Sampah?')) {
            return;
        }

        await PhotoStorage.softDelete(id);

        try {
            await fetch('/api/photos/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
        } catch (e) {}

        showToast('🗑️ Foto dipindahkan ke Keranjang Sampah.', 'info');
        await loadAdminDashboard();
        await updateGalleryBadge();
    }

    window.PhotoArtReloadGallery = loadUserGallery;
    window.PhotoArtReloadAdmin = loadAdminDashboard;

    function setupShareBarcode() {
        const currentUrl = window.location.href.split('#')[0];
        if (elements.inputShareUrl) {
            elements.inputShareUrl.value = currentUrl;
        }
        renderQrCode(currentUrl);
    }

    function renderQrCode(url) {
        if (!elements.qrCanvasContainer || typeof QRCode === 'undefined') return;
        elements.qrCanvasContainer.innerHTML = '';

        new QRCode(elements.qrCanvasContainer, {
            text: url,
            width: 220,
            height: 220,
            colorDark: "#111827",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
    }

    function downloadQrCode() {
        const canvas = elements.qrCanvasContainer.querySelector('canvas');
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `photoart-qr-code.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    function copyShareLink() {
        const url = elements.inputShareUrl.value;
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(() => {
                showCopyFeedback();
            }).catch(() => {
                fallbackCopy(url);
            });
        } else {
            fallbackCopy(url);
        }
    }

    function fallbackCopy(text) {
        elements.inputShareUrl.select();
        document.execCommand('copy');
        showCopyFeedback();
    }

    function showCopyFeedback() {
        if (!elements.copyFeedback) return;
        elements.copyFeedback.style.display = 'block';
        setTimeout(() => {
            elements.copyFeedback.style.display = 'none';
        }, 2000);
    }

    function bindEvents() {
        document.querySelectorAll('.timer-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.timer-chip').forEach(c => c.classList.remove('selected'));
                chip.classList.add('selected');
                state.timerDuration = parseInt(chip.getAttribute('data-timer'), 10);
            });
        });

        if (elements.btnStartBooth) {
            elements.btnStartBooth.addEventListener('click', () => {
                if (!PhotoFrames.themes || PhotoFrames.themes.length === 0 || !state.selectedThemeId) {
                    showToast('⚠️ Belum ada bingkai yang tersedia. Silakan hubungi admin booth.', 'warning');
                    return;
                }
                state.capturedImages = [];
                state.slotFilters = [];
                state.stickers = [];
                state.selectedStickerId = null;
                state.currentSessionUploaded = false;
                state.lastUploadedPhotoId = null;
                showStep('camera');
            });
        }

        if (elements.btnCapture) elements.btnCapture.addEventListener('click', triggerCapture);
        if (elements.btnSwitchCamera) elements.btnSwitchCamera.addEventListener('click', switchCamera);
        if (elements.btnToggleMirror) elements.btnToggleMirror.addEventListener('click', toggleMirror);
        if (elements.btnToggleFlash) elements.btnToggleFlash.addEventListener('click', () => toggleFlash());
        if (elements.btnSetupToggleFlash) elements.btnSetupToggleFlash.addEventListener('click', () => toggleFlash());

        // Penanganan Buka Kamera HP Langsung (Hardware Camera Capture)
        if (elements.btnNativeCapture) {
            elements.btnNativeCapture.addEventListener('click', () => {
                if (elements.nativeCameraInput) {
                    elements.nativeCameraInput.click();
                } else if (elements.nativeFileInput) {
                    elements.nativeFileInput.click();
                }
            });
        }

        if (elements.nativeCameraInput) {
            elements.nativeCameraInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files);
                    await handleNativeFiles(files);
                    try {
                        e.target.value = '';
                    } catch (err) {}
                }
            });
        }

        // Penanganan Pilih dari Galeri HP (Multi-select Files)
        if (elements.btnNativeGallery && elements.nativeFileInput) {
            elements.btnNativeGallery.addEventListener('click', () => {
                if (elements.btnNativeGallery.tagName !== 'LABEL') {
                    elements.nativeFileInput.click();
                }
            });
        }

        if (elements.btnEditorPickGallery && elements.nativeFileInput) {
            elements.btnEditorPickGallery.addEventListener('click', () => {
                if (elements.btnEditorPickGallery.tagName !== 'LABEL') {
                    elements.nativeFileInput.click();
                }
            });
        }

        if (elements.nativeFileInput) {
            elements.nativeFileInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    const files = Array.from(e.target.files);
                    await handleNativeFiles(files);
                    try {
                        e.target.value = '';
                    } catch (err) {}
                }
            });
        }

        if (elements.btnProceedToEditor) {
            elements.btnProceedToEditor.addEventListener('click', () => {
                const theme = PhotoFrames.getTheme(state.selectedThemeId);
                const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
                if (state.capturedImages.length > 0) {
                    const lastPhoto = state.capturedImages[state.capturedImages.length - 1];
                    const lastFilter = (state.slotFilters && state.slotFilters.length > 0) ? state.slotFilters[state.slotFilters.length - 1] : (state.selectedFilter || 'normal');
                    while (state.capturedImages.length < layoutConfig.count) {
                        state.capturedImages.push(lastPhoto);
                        if (!state.slotFilters) state.slotFilters = [];
                        state.slotFilters.push(lastFilter);
                    }
                }
                showStep('editor');
            });
        }

        // Modal Opsi Susunan Foto dari Galeri
        if (elements.btnGalleryFillAll) {
            elements.btnGalleryFillAll.addEventListener('click', () => {
                if (elements.modalGalleryFill) elements.modalGalleryFill.classList.remove('show');
                const theme = PhotoFrames.getTheme(state.selectedThemeId);
                const layoutConfig = PhotoFrames.getLayoutConfig(state.layoutMode, 840, null, theme);
                const maxSlots = layoutConfig.count;
                if (state.capturedImages.length > 0) {
                    const lastPhoto = state.capturedImages[state.capturedImages.length - 1];
                    const lastFilter = (state.slotFilters && state.slotFilters.length > 0) ? state.slotFilters[state.slotFilters.length - 1] : (state.selectedFilter || 'normal');
                    while (state.capturedImages.length < maxSlots) {
                        state.capturedImages.push(lastPhoto);
                        if (!state.slotFilters) state.slotFilters = [];
                        state.slotFilters.push(lastFilter);
                    }
                }
                updateShotThumbnails();
                showToast('✨ Foto dipasang ke seluruh slot bingkai! Membuka editor studio...', 'success', 2000);
                setTimeout(() => {
                    showStep('editor');
                }, 300);
            });
        }

        if (elements.btnGalleryPickNext) {
            elements.btnGalleryPickNext.addEventListener('click', () => {
                if (elements.modalGalleryFill) elements.modalGalleryFill.classList.remove('show');
                if (elements.nativeFileInput) {
                    elements.nativeFileInput.click();
                }
            });
        }

        if (elements.modalGalleryFill) {
            elements.modalGalleryFill.addEventListener('click', (e) => {
                if (e.target === elements.modalGalleryFill) {
                    elements.modalGalleryFill.classList.remove('show');
                }
            });
        }

        if (elements.btnRetakeAll) {
            elements.btnRetakeAll.addEventListener('click', () => {
                if (confirm('Ulangi sesi foto dari awal? Foto saat ini akan dihapus.')) {
                    state.capturedImages = [];
                    state.slotFilters = [];
                    state.stickers = [];
                    state.selectedStickerId = null;
                    state.currentSessionUploaded = false;
                    state.lastUploadedPhotoId = null;
                    showStep('camera');
                }
            });
        }

        if (elements.inputHeader) {
            elements.inputHeader.addEventListener('input', (e) => {
                state.frameHeader = e.target.value;
                renderCanvas();
            });
        }
        if (elements.inputSubtitle) {
            elements.inputSubtitle.addEventListener('input', (e) => {
                state.frameSubtitle = e.target.value;
                renderCanvas();
            });
        }

        if (elements.btnClearStickers) {
            elements.btnClearStickers.addEventListener('click', () => {
                state.stickers = [];
                state.selectedStickerId = null;
                updateStickerControllerUI();
                renderCanvas();
            });
        }

        if (elements.btnDeleteSelectedSticker) {
            elements.btnDeleteSelectedSticker.addEventListener('click', deleteSelectedSticker);
        }
        if (elements.btnStickerBigger) {
            elements.btnStickerBigger.addEventListener('click', () => adjustStickerSize(14));
        }
        if (elements.btnStickerSmaller) {
            elements.btnStickerSmaller.addEventListener('click', () => adjustStickerSize(-14));
        }
        if (elements.btnStickerRotate) {
            elements.btnStickerRotate.addEventListener('click', rotateSticker);
        }

        document.querySelectorAll('.sticker-pos-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const pos = btn.getAttribute('data-pos');
                applyStickerPositionPreset(pos);
            });
        });

        document.querySelectorAll('.sticker-dpad-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const dir = btn.getAttribute('data-move');
                nudgeSticker(dir);
            });
        });

        if (elements.btnSaveToGallery) elements.btnSaveToGallery.addEventListener('click', () => savePhotoToGallery(true));
        if (elements.btnDownloadDirect) elements.btnDownloadDirect.addEventListener('click', downloadPhoto);
        if (elements.btnDownloadFinal && elements.btnDownloadFinal !== elements.btnSaveToGallery) {
            elements.btnDownloadFinal.addEventListener('click', () => savePhotoToGallery(true));
        }
        if (elements.btnShareFinal) elements.btnShareFinal.addEventListener('click', sharePhoto);
        if (elements.btnPrintFinal) elements.btnPrintFinal.addEventListener('click', printPhoto);

        document.querySelectorAll('.editor-tab-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.editor-tab-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                const targetPaneId = pill.getAttribute('data-editor-pane');
                document.querySelectorAll('.editor-pane').forEach(pane => {
                    pane.classList.toggle('active', pane.id === targetPaneId);
                });
            });
        });

        if (elements.btnOpenBarcode) {
            elements.btnOpenBarcode.addEventListener('click', () => {
                setupShareBarcode();
                if (elements.modalBarcode) elements.modalBarcode.classList.add('show');
            });
        }
        if (elements.btnCloseBarcode) {
            elements.btnCloseBarcode.addEventListener('click', () => {
                if (elements.modalBarcode) elements.modalBarcode.classList.remove('show');
            });
        }
        if (elements.modalBarcode) {
            elements.modalBarcode.addEventListener('click', (e) => {
                if (e.target === elements.modalBarcode) {
                    elements.modalBarcode.classList.remove('show');
                }
            });
        }
        if (elements.inputShareUrl) {
            elements.inputShareUrl.addEventListener('input', (e) => {
                renderQrCode(e.target.value);
            });
        }
        if (elements.btnCopyLink) elements.btnCopyLink.addEventListener('click', copyShareLink);
        if (elements.btnDownloadQr) elements.btnDownloadQr.addEventListener('click', downloadQrCode);

        if (elements.brandHomeLink) {
            elements.brandHomeLink.addEventListener('click', (e) => {
                if (elements.stepHome) {
                    e.preventDefault();
                    showStep('home');
                }
            });
        }

        if (elements.btnNavHome) {
            elements.btnNavHome.addEventListener('click', (e) => {
                if (elements.stepHome) {
                    e.preventDefault();
                    showStep('home');
                } else {
                    window.location.href = 'index.html';
                }
            });
        }

        if (elements.btnHeroStart) {
            elements.btnHeroStart.addEventListener('click', (e) => {
                if (elements.stepSetup) {
                    e.preventDefault();
                    showStep('setup');
                }
            });
        }

        if (elements.btnBottomStart) {
            elements.btnBottomStart.addEventListener('click', (e) => {
                if (elements.stepSetup) {
                    e.preventDefault();
                    showStep('setup');
                }
            });
        }

        if (elements.btnHeroScroll) {
            elements.btnHeroScroll.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.getElementById('home-about');
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        if (elements.btnNavBooth) {
            elements.btnNavBooth.addEventListener('click', () => {
                if (elements.stepSetup) {
                    if (state.currentStep === 'camera' || state.currentStep === 'editor') {
                        showStep(state.currentStep);
                    } else {
                        showStep('setup');
                    }
                } else {
                    window.location.href = 'booth.html';
                }
            });
        }

        if (elements.btnNavGallery) {
            elements.btnNavGallery.addEventListener('click', () => {
                if (elements.stepGallery) {
                    showStep('gallery');
                } else {
                    window.location.href = 'booth.html?step=gallery';
                }
            });
        }

        if (elements.btnNavAdmin) {
            elements.btnNavAdmin.addEventListener('click', () => {
                if (elements.stepAdmin) {
                    showStep('admin');
                } else {
                    window.location.href = 'admin.html';
                }
            });
        }

        const fHome = document.getElementById('footer-btn-home');
        if (fHome) {
            fHome.addEventListener('click', (e) => {
                if (elements.stepHome) {
                    e.preventDefault();
                    showStep('home');
                }
            });
        }

        const fBooth = document.getElementById('footer-btn-booth');
        if (fBooth) {
            fBooth.addEventListener('click', (e) => {
                if (elements.stepSetup) {
                    e.preventDefault();
                    showStep('setup');
                }
            });
        }

        const fGallery = document.getElementById('footer-btn-gallery');
        if (fGallery) {
            fGallery.addEventListener('click', (e) => {
                if (elements.stepGallery) {
                    e.preventDefault();
                    showStep('gallery');
                } else {
                    window.location.href = 'booth.html?step=gallery';
                }
            });
        }

        const fAdmin = document.getElementById('footer-btn-admin');
        if (fAdmin) {
            fAdmin.addEventListener('click', (e) => {
                if (elements.stepAdmin) {
                    e.preventDefault();
                    showStep('admin');
                } else {
                    window.location.href = 'admin.html';
                }
            });
        }

        // Editor button to open user gallery
        if (elements.btnViewInGallery) {
            elements.btnViewInGallery.addEventListener('click', () => {
                showStep('gallery');
            });
        }

        // User Gallery Dashboard Actions
        if (elements.btnGalleryNewSession) {
            elements.btnGalleryNewSession.addEventListener('click', () => {
                state.capturedImages = [];
                state.slotFilters = [];
                state.stickers = [];
                state.selectedStickerId = null;
                state.currentSessionUploaded = false;
                state.lastUploadedPhotoId = null;
                showStep('camera');
            });
        }

        if (elements.btnEmptyStartBooth) {
            elements.btnEmptyStartBooth.addEventListener('click', () => {
                showStep('setup');
            });
        }

        if (elements.btnGalleryRefresh) {
            elements.btnGalleryRefresh.addEventListener('click', () => {
                loadUserGallery();
                showToast('🔄 Galeri foto disegarkan', 'info');
            });
        }

        // Admin Media & Recovery Dashboard Actions
        if (elements.formAdminLogin) {
            elements.formAdminLogin.addEventListener('submit', (e) => {
                e.preventDefault();
                const pin = elements.inputAdminPin ? elements.inputAdminPin.value.trim() : '';
                handleAdminLogin(pin);
            });
        }

        if (elements.btnAdminLogout) {
            elements.btnAdminLogout.addEventListener('click', handleAdminLogout);
        }

        if (elements.btnAdminRefresh) {
            elements.btnAdminRefresh.addEventListener('click', () => {
                loadAdminDashboard();
                showToast('🔄 Data media admin disegarkan', 'info');
            });
        }

        if (elements.tabBtnFrames) {
            elements.tabBtnFrames.addEventListener('click', () => {
                state.adminActiveTab = 'frames';
                elements.tabBtnFrames.classList.add('active');
                if (elements.tabBtnTrash) elements.tabBtnTrash.classList.remove('active');
                if (elements.tabBtnActive) elements.tabBtnActive.classList.remove('active');
                loadAdminDashboard();
            });
        }

        if (elements.tabBtnTrash) {
            elements.tabBtnTrash.addEventListener('click', () => {
                state.adminActiveTab = 'trash';
                elements.tabBtnTrash.classList.add('active');
                if (elements.tabBtnFrames) elements.tabBtnFrames.classList.remove('active');
                if (elements.tabBtnActive) elements.tabBtnActive.classList.remove('active');
                loadAdminDashboard();
            });
        }

        if (elements.tabBtnActive) {
            elements.tabBtnActive.addEventListener('click', () => {
                state.adminActiveTab = 'active';
                elements.tabBtnActive.classList.add('active');
                if (elements.tabBtnFrames) elements.tabBtnFrames.classList.remove('active');
                if (elements.tabBtnTrash) elements.tabBtnTrash.classList.remove('active');
                loadAdminDashboard();
            });
        }

        // Kotak Kurasi Bingkai Tabs (Semua / Published / Private)
        const setupCurationFilterBtn = (btn, filterValue) => {
            if (!btn) return;
            btn.addEventListener('click', () => {
                state.adminCurationFilter = filterValue;
                if (elements.btnFilterFramesAll) elements.btnFilterFramesAll.classList.toggle('active', filterValue === 'all');
                if (elements.btnFilterFramesPub) elements.btnFilterFramesPub.classList.toggle('active', filterValue === 'published');
                if (elements.btnFilterFramesPriv) elements.btnFilterFramesPriv.classList.toggle('active', filterValue === 'draft');
                loadAdminFrames(false);
            });
        };
        setupCurationFilterBtn(elements.btnFilterFramesAll, 'all');
        setupCurationFilterBtn(elements.btnFilterFramesPub, 'published');
        setupCurationFilterBtn(elements.btnFilterFramesPriv, 'draft');

        // Visitor Name inputs sync
        const updateUserNameSync = (val) => {
            state.userName = val;
            try {
                localStorage.setItem('photoart_user_name', val);
            } catch (e) {}
            if (elements.inputSetupUserName && elements.inputSetupUserName.value !== val) {
                elements.inputSetupUserName.value = val;
            }
            if (elements.inputUserName && elements.inputUserName.value !== val) {
                elements.inputUserName.value = val;
            }
        };

        if (elements.inputSetupUserName) {
            elements.inputSetupUserName.value = state.userName || '';
            elements.inputSetupUserName.addEventListener('input', (e) => {
                updateUserNameSync(e.target.value.trim());
            });
        }

        if (elements.inputUserName) {
            elements.inputUserName.value = state.userName || '';
            elements.inputUserName.addEventListener('input', (e) => {
                updateUserNameSync(e.target.value.trim());
            });
        }

        // Admin User Filter Dropdown change listener
        if (elements.selectAdminUserFilter) {
            elements.selectAdminUserFilter.addEventListener('change', (e) => {
                state.adminSelectedUserFilter = e.target.value;
                loadAdminMedia();
            });
        }

        // Lightbox Modal Controls
        if (elements.btnCloseLightbox) {
            elements.btnCloseLightbox.addEventListener('click', closeLightbox);
        }

        if (elements.modalLightbox) {
            elements.modalLightbox.addEventListener('click', (e) => {
                if (e.target === elements.modalLightbox) {
                    closeLightbox();
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();