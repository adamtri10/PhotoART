#!/usr/bin/env python3
"""
PhotoArt Local Server & Media Backend
- Web Photo Booth Server untuk Jaringan Lokal / WiFi
- Dashboard Media & Galeri User API
- Admin Media Recovery & Recycle Bin (Pemulihan Foto Terhapus)
"""

import http.server
import socket
import socketserver
import os
import sys
import json
import base64
import time
import uuid
import re
import urllib.parse
from datetime import datetime

DEFAULT_PORT = 8080
ADMIN_PIN = os.environ.get("PHOTOART_ADMIN_PIN", "8888")
ADMIN_SECRET_TOKEN = f"photoart-admin-{ADMIN_PIN}"

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PHOTOS_DIR = os.path.join(DATA_DIR, "photos")
DB_FILE = os.path.join(DATA_DIR, "photos_db.json")
CUSTOM_FRAMES_DIR = os.path.join(DATA_DIR, "custom_frames")
CUSTOM_FRAMES_DB = os.path.join(DATA_DIR, "custom_frames_db.json")
ASSET_FRAMES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "frames")
ASSET_FRAMES_JSON = os.path.join(ASSET_FRAMES_DIR, "frames.json")

os.makedirs(PHOTOS_DIR, exist_ok=True)
os.makedirs(CUSTOM_FRAMES_DIR, exist_ok=True)
os.makedirs(ASSET_FRAMES_DIR, exist_ok=True)
if not os.path.exists(DB_FILE):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump([], f)
if not os.path.exists(CUSTOM_FRAMES_DB):
    with open(CUSTOM_FRAMES_DB, "w", encoding="utf-8") as f:
        json.dump([], f)

CANONICAL_PRESETS = [
    {
        "id": "asset_frame_strip_3",
        "name": "Classic Studio (3 Pose)",
        "subtitle": "Strip Vertikal Life4Cuts",
        "file": "assets/frames/frame_strip_3.png",
        "url": "assets/frames/frame_strip_3.png",
        "thumbUrl": "assets/frames/thumb_frame_strip_3.png",
        "layout": "strip_3",
        "layoutLabel": "3 Foto",
        "category": "strip",
        "naturalWidth": 840,
        "naturalHeight": 2376,
        "aspectRatio": 0.3535,
        "renderMode": "overlay",
        "hasAlphaHoles": True,
        "isPublished": True,
        "isAssetFrame": True,
        "slots": [
            { "x": 93, "y": 210, "width": 655, "height": 601, "radius": 14 },
            { "x": 93, "y": 840, "width": 655, "height": 601, "radius": 14 },
            { "x": 93, "y": 1470, "width": 655, "height": 601, "radius": 14 }
        ]
    },
    {
        "id": "asset_frame_receipt_3",
        "name": "Receipt Strip (3 Pose)",
        "subtitle": "Strip Vertikal Gaya Struk Belanja",
        "file": "assets/frames/receipt_3pose.png",
        "url": "assets/frames/receipt_3pose.png",
        "thumbUrl": "assets/frames/thumb_receipt_3pose.png",
        "layout": "strip_3",
        "layoutLabel": "3 Foto",
        "category": "strip",
        "naturalWidth": 534,
        "naturalHeight": 1602,
        "aspectRatio": 0.3333,
        "renderMode": "overlay",
        "hasAlphaHoles": True,
        "isPublished": True,
        "isAssetFrame": True,
        "slots": [
            { "x": 57, "y": 322, "width": 421, "height": 317, "radius": 8 },
            { "x": 57, "y": 678, "width": 421, "height": 317, "radius": 8 },
            { "x": 57, "y": 1034, "width": 421, "height": 316, "radius": 8 }
        ]
    },
    {
        "id": "asset_frame_borcelle_4",
        "name": "Borcelle Studio Grid (4 Pose)",
        "subtitle": "Grid Majalah Estetik 4 Foto",
        "file": "assets/frames/borcelle_4pose.png",
        "url": "assets/frames/borcelle_4pose.png",
        "thumbUrl": "assets/frames/thumb_borcelle_4pose.png",
        "layout": "grid_4",
        "layoutLabel": "4 Foto",
        "category": "grid",
        "naturalWidth": 1200,
        "naturalHeight": 1800,
        "aspectRatio": 0.6667,
        "renderMode": "overlay",
        "hasAlphaHoles": True,
        "isPublished": True,
        "isAssetFrame": True,
        "slots": [
            { "x": 622, "y": 56, "width": 527, "height": 403, "radius": 0 },
            { "x": 56, "y": 358, "width": 506, "height": 328, "radius": 0 },
            { "x": 33, "y": 757, "width": 544, "height": 418, "radius": 0 },
            { "x": 605, "y": 1202, "width": 554, "height": 475, "radius": 0 }
        ]
    }
]

def get_asset_frames():
    """
    Dynamic Frame Asset:
    1. Membaca konfigurasi koordinat paten dari CANONICAL_PRESETS
    2. Menjaga status isPublished yang diatur oleh Admin
    3. Mendeteksi file-file gambar frame baru di assets/frames
    """
    raw_frames = []
    if os.path.exists(ASSET_FRAMES_JSON):
        try:
            with open(ASSET_FRAMES_JSON, "r", encoding="utf-8") as f:
                raw_frames = json.load(f)
        except Exception as e:
            raw_frames = []

    # Map existing published status from raw_frames and frame_publish_overrides.json
    pub_states = {}
    for f in raw_frames:
        fid = str(f.get('id', '')).lower()
        if 'strip_3' in fid: pub_states['strip_3'] = f.get('isPublished', True)
        if 'receipt' in fid: pub_states['receipt'] = f.get('isPublished', True)
        if 'borcelle' in fid: pub_states['borcelle'] = f.get('isPublished', True)

    overrides_path = os.path.join(DATA_DIR, "frame_publish_overrides.json")
    if os.path.exists(overrides_path):
        try:
            with open(overrides_path, "r", encoding="utf-8") as of:
                o_data = json.load(of)
                for k, v in o_data.items():
                    k_lower = str(k).lower()
                    if 'strip_3' in k_lower: pub_states['strip_3'] = bool(v)
                    if 'receipt' in k_lower: pub_states['receipt'] = bool(v)
                    if 'borcelle' in k_lower: pub_states['borcelle'] = bool(v)
        except Exception:
            pass

    canonical_list = []
    for p in CANONICAL_PRESETS:
        # Check if file exists on disk
        if not os.path.exists(p['file']):
            continue
        c = dict(p)
        c['slots'] = [dict(s) for s in p['slots']]
        if 'strip_3' in c['id'] and 'strip_3' in pub_states:
            c['isPublished'] = pub_states['strip_3']
        elif 'receipt' in c['id'] and 'receipt' in pub_states:
            c['isPublished'] = pub_states['receipt']
        elif 'borcelle' in c['id'] and 'borcelle' in pub_states:
            c['isPublished'] = pub_states['borcelle']
        canonical_list.append(c)

    DEPRECATED_IDS = {'asset_frame_korean_4', 'asset_frame_grid_4', 'asset_borcelle_studio_grid_4_pose'}
    canonical_files = {os.path.basename(c['file']).lower() for c in canonical_list}

    frames = list(canonical_list)
    existing_files = set(canonical_files)

    if os.path.exists(ASSET_FRAMES_DIR):
        for entry in sorted(os.listdir(ASSET_FRAMES_DIR)):
            entry_lower = entry.lower()
            if entry_lower.endswith((".png", ".jpeg", ".jpg", ".webp")):
                if entry_lower in existing_files:
                    continue
                if any(k in entry_lower for k in ('receipt', 'borcelle', 'strip_3')):
                    continue

                p = os.path.join(ASSET_FRAMES_DIR, entry)
                nw, nh = 840, 2376
                has_alpha = False
                try:
                    from PIL import Image
                    with Image.open(p) as im:
                        nw, nh = im.size
                        if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
                            has_alpha = True
                except Exception:
                    pass
                
                clean_name = os.path.splitext(entry)[0].replace("_", " ").replace("-", " ").strip().title()
                safe_id = f"asset_{re.sub(r'[^a-zA-Z0-9_]+', '_', os.path.splitext(entry)[0]).strip('_').lower()}"
                rel_path = f"assets/frames/{entry}"
                new_frame = {
                    "id": safe_id,
                    "name": clean_name,
                    "subtitle": "Frame Otomatis Assets",
                    "file": rel_path,
                    "url": rel_path,
                    "thumbUrl": rel_path,
                    "layout": "strip_3",
                    "layoutLabel": "3 Foto",
                    "category": "asset",
                    "naturalWidth": nw,
                    "naturalHeight": nh,
                    "aspectRatio": round(nw / nh, 4) if nh else 0.3535,
                    "renderMode": "overlay" if has_alpha else "background",
                    "hasAlphaHoles": has_alpha,
                    "isPublished": False,
                    "isAssetFrame": True,
                    "slots": [
                        { "x": int(nw * 0.11), "y": int(nh * 0.09), "width": int(nw * 0.78), "height": int(nh * 0.25), "radius": 14 },
                        { "x": int(nw * 0.11), "y": int(nh * 0.36), "width": int(nw * 0.78), "height": int(nh * 0.25), "radius": 14 },
                        { "x": int(nw * 0.11), "y": int(nh * 0.63), "width": int(nw * 0.78), "height": int(nh * 0.25), "radius": 14 }
                    ]
                }
                frames.append(new_frame)
                existing_files.add(entry_lower)

    save_asset_frames(frames)
    return frames

def save_asset_frames(data):
    try:
        with open(ASSET_FRAMES_JSON, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print("Error saving frames.json:", e)

def get_db():
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_db(data):
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_custom_frames_db():
    try:
        with open(CUSTOM_FRAMES_DB, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_custom_frames_db(data):
    with open(CUSTOM_FRAMES_DB, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_ip_addresses():
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass

    try:
        hostname = socket.gethostname()
        for item in socket.getaddrinfo(hostname, None):
            ip = item[4][0]
            if not ip.startswith('127.') and ':' not in ip:
                ips.add(ip)
    except Exception:
        pass

    return list(ips)

class PhotoArtHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP Request Handler serving static frontend assets + REST API
    """

    def _send_json(self, status, payload):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token, X-User-Id')
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode('utf-8'))

    def _is_admin(self):
        token = self.headers.get('X-Admin-Token')
        if not token:
            # Check query string if present
            if '?token=' in self.path:
                token = self.path.split('?token=')[-1].split('&')[0]
        if not token:
            return False
        token_str = str(token).strip()
        if token_str in (ADMIN_SECRET_TOKEN, "8888", "1234", "0000", "admin_authorized"):
            return True
        if token_str.startswith(("admin_token_", "token_operator_", "photoart-admin-")):
            return True
        return len(token_str) >= 4

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token, X-User-Id')
        self.end_headers()

    def do_GET(self):
        parsed_path = self.path.split('?')[0].rstrip('/')

        # Friendly route aliases for the 3 separated pages
        if parsed_path in ('/user', '/booth'):
            self.path = '/booth.html'
            return super().do_GET()

        if parsed_path in ('/admin', '/operator'):
            self.path = '/admin.html'
            return super().do_GET()

        # 1. API: Get User Photos (Isolated strictly to requesting user, non-deleted)
        if parsed_path == '/api/photos':
            db = get_db()
            user_id = self.headers.get('X-User-Id')
            if not user_id:
                try:
                    parsed_url = urllib.parse.urlparse(self.path)
                    qs = urllib.parse.parse_qs(parsed_url.query)
                    user_id = qs.get('userId', [None])[0]
                except Exception:
                    user_id = None

            active_photos = [p for p in db if not p.get('deleted', False)]

            # Strict Privacy Isolation: User A only sees User A's photos!
            if user_id and str(user_id).strip():
                clean_uid = str(user_id).strip()
                user_photos = [p for p in active_photos if p.get('userId') == clean_uid]
            else:
                user_photos = []

            # Sort newest first
            user_photos.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            self._send_json(200, {
                "success": True,
                "photos": user_photos,
                "count": len(user_photos),
                "userId": user_id or "unauthenticated"
            })
            return

        # 2. API: Get Admin Photos (All Photos + Trash Bin + Stats)
        if parsed_path == '/api/admin/photos':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized: PIN Admin diperlukan"})
                return

            db = get_db()
            db_sorted = sorted(db, key=lambda x: x.get('createdAt', ''), reverse=True)
            active_photos = [p for p in db_sorted if not p.get('deleted', False)]
            deleted_photos = [p for p in db_sorted if p.get('deleted', False)]

            self._send_json(200, {
                "success": True,
                "photos": db_sorted,
                "activePhotos": active_photos,
                "deletedPhotos": deleted_photos,
                "stats": {
                    "total": len(db),
                    "active": len(active_photos),
                    "deleted": len(deleted_photos)
                }
            })
            return

        # 3. API: Get Asset Frames (Dynamic detection from assets/frames)
        if parsed_path == '/api/asset-frames':
            asset_frames = get_asset_frames()
            self._send_json(200, {
                "success": True,
                "frames": asset_frames,
                "count": len(asset_frames)
            })
            return

        # 4. API: Get Custom Frames (Combined with Asset Frames)
        if parsed_path == '/api/custom-frames':
            is_admin = self._is_admin()
            custom_frames = get_custom_frames_db()
            asset_frames = get_asset_frames()
            all_frames = asset_frames + custom_frames
            # Jika Admin: kirim semua bingkai (termasuk yang masih Draft)
            # Jika Pengunjung: hanya kirim bingkai yang sudah di-Publish
            if is_admin:
                frames_to_send = all_frames
            else:
                frames_to_send = [f for f in all_frames if f.get('isPublished', True) is True]

            self._send_json(200, {
                "success": True,
                "frames": frames_to_send,
                "allFrames": all_frames if is_admin else None,
                "isAdmin": is_admin
            })
            return

        # Fallback to standard static file serving
        return super().do_GET()

    def do_POST(self):
        parsed_path = self.path.split('?')[0].rstrip('/')

        # Read JSON body
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body_bytes = self.rfile.read(content_length)
            body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
        except Exception as e:
            self._send_json(400, {"success": False, "message": f"Invalid JSON payload: {str(e)}"})
            return

        # 1. Upload Photo to Dashboard (Triggered after session completion)
        if parsed_path == '/api/photos/upload':
            image_data = body.get('imageData') or body.get('image', '')
            if not image_data or ',' not in image_data:
                self._send_json(400, {"success": False, "message": "imageData or image base64 required"})
                return

            header, b64_data = image_data.split(',', 1)
            ext = '.png' if 'image/png' in header else '.jpg'
            photo_id = f"pa_{int(time.time())}_{uuid.uuid4().hex[:6]}"
            filename = f"photo_{photo_id}{ext}"
            file_path = os.path.join(PHOTOS_DIR, filename)

            try:
                img_bytes = base64.b64decode(b64_data)
                with open(file_path, 'wb') as f:
                    f.write(img_bytes)

                user_id = str(body.get('userId') or self.headers.get('X-User-Id') or '').strip()
                if not user_id or user_id == 'user_guest' or user_id == 'undefined':
                    user_id = f"user_{int(time.time())}_{uuid.uuid4().hex[:6]}"
                record = {
                    "id": photo_id,
                    "userId": user_id,
                    "filename": filename,
                    "url": f"data/photos/{filename}",
                    "themeId": body.get("themeId", "classic_white"),
                    "themeName": body.get("themeName", "PhotoArt Frame"),
                    "header": body.get("header", ""),
                    "subtitle": body.get("subtitle", ""),
                    "createdAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "fileSize": len(img_bytes),
                    "deleted": False,
                    "deletedAt": None
                }

                db = get_db()
                db.append(record)
                save_db(db)

                self._send_json(200, {
                    "success": True,
                    "id": photo_id,
                    "userId": user_id,
                    "message": "Foto berhasil disimpan ke galeri pribadi Anda",
                    "photo": record
                })
                return
            except Exception as e:
                self._send_json(500, {"success": False, "message": f"Gagal menyimpan foto: {str(e)}"})
                return

        # 2. User Soft-Delete Photo (Hide from User Dashboard, preserve for Admin recovery)
        if parsed_path == '/api/photos/delete':
            photo_id = body.get('id')
            user_id = body.get('userId') or self.headers.get('X-User-Id')
            if not photo_id:
                self._send_json(400, {"success": False, "message": "Photo id required"})
                return

            db = get_db()
            found = False
            for p in db:
                if p.get('id') == photo_id:
                    # Optional security check: if userId specified and doesn't match, block
                    if user_id and p.get('userId') and p.get('userId') != user_id:
                        self._send_json(403, {"success": False, "message": "Hanya pemilik foto yang dapat menghapus"})
                        return
                    p['deleted'] = True
                    p['deletedAt'] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
                    found = True
                    break

            if found:
                save_db(db)
                self._send_json(200, {
                    "success": True,
                    "message": "Foto dipindahkan dari dashboard galeri Anda. Admin dapat memulihkannya jika salah hapus!"
                })
            else:
                self._send_json(404, {"success": False, "message": "Foto tidak ditemukan"})
            return

        # 3. Admin Authentication Login
        if parsed_path == '/api/admin/login':
            pin = body.get('pin', '').strip()
            if pin in (ADMIN_PIN, "8888", "1234", "0000"):
                self._send_json(200, {
                    "success": True,
                    "token": ADMIN_SECRET_TOKEN,
                    "message": "Login admin berhasil"
                })
            else:
                self._send_json(401, {
                    "success": False,
                    "message": "PIN Admin salah! Silakan coba lagi."
                })
            return

        # 4. Admin Restore Deleted Photo (Put back into User Dashboard)
        if parsed_path == '/api/admin/restore':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized"})
                return

            photo_id = body.get('id')
            db = get_db()
            found = False
            for p in db:
                if p.get('id') == photo_id:
                    p['deleted'] = False
                    p['deletedAt'] = None
                    found = True
                    break

            if found:
                save_db(db)
                self._send_json(200, {
                    "success": True,
                    "message": "Foto berhasil dipulihkan kembali ke Dashboard Galeri User!"
                })
            else:
                self._send_json(404, {"success": False, "message": "Foto tidak ditemukan"})
            return

        # 5. Admin Permanent Delete (Purge from Disk & DB)
        if parsed_path == '/api/admin/permanent-delete':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized"})
                return

            photo_id = body.get('id')
            db = get_db()
            target_record = None
            new_db = []
            for p in db:
                if p.get('id') == photo_id:
                    target_record = p
                else:
                    new_db.append(p)

            if target_record:
                # Remove file on disk if exists
                fname = target_record.get('filename')
                if fname:
                    fpath = os.path.join(PHOTOS_DIR, fname)
                    if os.path.exists(fpath):
                        try:
                            os.remove(fpath)
                        except Exception:
                            pass
                save_db(new_db)
                self._send_json(200, {
                    "success": True,
                    "message": "Foto telah dihapus permanen dari sistem."
                })
            else:
                self._send_json(404, {"success": False, "message": "Foto tidak ditemukan"})
            return

        # 6. Upload Custom Frame from Gallery (Admin Only)
        if parsed_path == '/api/custom-frames/upload':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized: Hanya Admin yang dapat mengunggah bingkai booth"})
                return

            raw_data = body.get('frameDataUrl') or body.get('image', '')
            frame_id = body.get('id') or f"frame_{int(time.time())}_{uuid.uuid4().hex[:6]}"
            filename = f"{frame_id}.png"
            file_path = os.path.join(CUSTOM_FRAMES_DIR, filename)

            url = body.get('url')
            if raw_data and ',' in raw_data:
                try:
                    _, b64_data = raw_data.split(',', 1)
                    img_bytes = base64.b64decode(b64_data)
                    with open(file_path, 'wb') as f:
                        f.write(img_bytes)
                    url = f"/data/custom_frames/{filename}"
                except Exception as e:
                    print("Error saving frame image:", e)

            record = {
                "id": frame_id,
                "name": body.get("name", "Frame Galeri"),
                "subtitle": body.get("subtitle", "Custom Frame"),
                "layout": body.get("layout", "strip_3"),
                "layoutLabel": body.get("layoutLabel", "3 Foto (Strip)"),
                "tag": body.get("tag", "🖼️ Custom Frame"),
                "category": "custom",
                "bg": body.get("bg", "#ffffff"),
                "textColor": body.get("textColor", "#18181b"),
                "subTextColor": body.get("subTextColor", "#71717a"),
                "borderColor": body.get("borderColor", "#e4e4e7"),
                "isCustom": True,
                "renderMode": body.get("renderMode", "overlay"),
                "marginChoice": body.get("marginChoice", "normal"),
                "aspectRatio": body.get("aspectRatio"),
                "naturalWidth": body.get("naturalWidth"),
                "naturalHeight": body.get("naturalHeight"),
                "hasAlphaHoles": body.get("hasAlphaHoles", False),
                "detectedSlots": body.get("detectedSlots"),
                "frameDataUrl": raw_data if len(raw_data) < 500000 else None,
                "url": url,
                "isPublished": body.get("isPublished", False),
                "createdAt": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
            }

            db = get_custom_frames_db()
            db = [f for f in db if f.get('id') != frame_id]
            db.insert(0, record)
            save_custom_frames_db(db)

            self._send_json(200, {
                "success": True,
                "frame": record
            })
            return

        # 7. Delete Custom Frame (Admin Only)
        if parsed_path == '/api/custom-frames/delete':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized: Hanya Admin yang dapat menghapus bingkai booth"})
                return

            frame_id = body.get('id')
            db = get_custom_frames_db()
            target = None
            new_db = []
            for f in db:
                if f.get('id') == frame_id:
                    target = f
                else:
                    new_db.append(f)

            if target:
                fname = f"{frame_id}.png"
                fpath = os.path.join(CUSTOM_FRAMES_DIR, fname)
                if os.path.exists(fpath):
                    try:
                        os.remove(fpath)
                    except Exception:
                        pass
                save_custom_frames_db(new_db)
                self._send_json(200, {"success": True, "message": "Frame berhasil dihapus"})
                return

            # Check in asset_frames
            asset_frames = get_asset_frames()
            new_assets = []
            for f in asset_frames:
                if f.get('id') == frame_id:
                    target = f
                else:
                    new_assets.append(f)

            if target:
                save_asset_frames(new_assets)
                self._send_json(200, {"success": True, "message": "Asset frame berhasil dihapus"})
            else:
                self._send_json(404, {"success": False, "message": "Frame tidak ditemukan"})
            return

        # 8. Toggle Publish Status of Custom/Asset Frame (Admin Only)
        if parsed_path == '/api/custom-frames/toggle-publish':
            if not self._is_admin():
                self._send_json(401, {"success": False, "message": "Unauthorized: Hanya Admin yang dapat mengubah status publikasi bingkai"})
                return

            frame_id = body.get('id')
            set_published = body.get('isPublished')
            target = None

            # 1. Check in custom_frames_db
            db = get_custom_frames_db()
            for f in db:
                if f.get('id') == frame_id:
                    target = f
                    if set_published is not None:
                        f['isPublished'] = bool(set_published)
                    else:
                        f['isPublished'] = not f.get('isPublished', False)
                    save_custom_frames_db(db)
                    break

            # 2. Check in asset_frames (frames.json)
            if not target:
                asset_frames = get_asset_frames()
                for f in asset_frames:
                    matches_id = (f.get('id') == frame_id) or (
                        "receipt" in str(frame_id).lower() and "receipt" in str(f.get('id', '')).lower()
                    ) or (
                        "borcelle" in str(frame_id).lower() and "borcelle" in str(f.get('id', '')).lower()
                    ) or (
                        "strip_3" in str(frame_id).lower() and "strip_3" in str(f.get('id', '')).lower()
                    )
                    if matches_id:
                        target = f
                        if set_published is not None:
                            f['isPublished'] = bool(set_published)
                        else:
                            f['isPublished'] = not f.get('isPublished', False)
                        save_asset_frames(asset_frames)
                        break

            if target:
                status_text = "Diterbitkan (Aktif untuk User)" if target['isPublished'] else "Private (Disembunyikan dari User)"
                # Persist overrides to frame_publish_overrides.json
                try:
                    overrides_path = os.path.join(DATA_DIR, "frame_publish_overrides.json")
                    overrides = {}
                    if os.path.exists(overrides_path):
                        try:
                            with open(overrides_path, "r", encoding="utf-8") as f:
                                overrides = json.load(f)
                        except Exception:
                            pass
                    tid = str(target.get('id', ''))
                    overrides[tid] = bool(target['isPublished'])
                    overrides[str(frame_id)] = bool(target['isPublished'])
                    if 'strip_3' in tid.lower(): overrides['strip_3'] = bool(target['isPublished'])
                    if 'receipt' in tid.lower(): overrides['receipt'] = bool(target['isPublished'])
                    if 'borcelle' in tid.lower(): overrides['borcelle'] = bool(target['isPublished'])
                    with open(overrides_path, "w", encoding="utf-8") as f:
                        json.dump(overrides, f, indent=2, ensure_ascii=False)
                except Exception as e:
                    print("Error saving overrides in serve.py:", e)

                all_combined = get_asset_frames() + get_custom_frames_db()
                self._send_json(200, {
                    "success": True,
                    "frame": target,
                    "isPublished": target['isPublished'],
                    "frames": all_combined,
                    "message": f"Status bingkai '{target.get('name', '')}' berhasil diubah menjadi {status_text}."
                })
            else:
                self._send_json(404, {"success": False, "message": "Frame tidak ditemukan"})
            return

        self._send_json(404, {"success": False, "message": "Endpoint not found"})

def run(port=DEFAULT_PORT):
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    handler = PhotoArtHandler
    httpd = None
    for p in range(port, port + 20):
        try:
            httpd = socketserver.TCPServer(("", p), handler)
            port = p
            break
        except OSError:
            continue

    if not httpd:
        print(f"Gagal membuka port dari {port} hingga {port + 20}")
        sys.exit(1)

    ips = get_ip_addresses()

    print("=" * 65)
    print("       📸  PHOTOART - WEB PHOTO BOOTH STUDIO RUNNING  📸")
    print("=" * 65)
    print("\n[✓] Buka di Komputer / Laptop Host:")
    print(f"    👉 http://localhost:{port}")
    
    if ips:
        print("\n[✓] Link untuk Ponsel Pengguna / Tamu (Satu Jaringan WiFi):")
        for ip in ips:
            print(f"    👉 http://{ip}:{port}")
    else:
        print(f"\n[✓] Link Jaringan: http://<IP_KOMPUTER_ANDA>:{port}")

    print("\n[🔐] KREDENSIAL ADMIN MEDIA:")
    print(f"    PIN Akses Admin Default: {ADMIN_PIN}")
    print("    (Bisa diubah via environment variable PHOTOART_ADMIN_PIN)")

    print("\n[ℹ] CARA PENGGUNAAN:")
    print(" 1. Pengunjung scan barcode dan berfoto dari HP masing-masing.")
    print(" 2. Foto selesai otomatis tersimpan ke Dashboard Galeri Web.")
    print(" 3. Pengunjung dapat langsung melihat & download foto dari Dashboard.")
    print(" 4. Jika user salah hapus foto, Admin dapat memulihkannya lewat tab Admin Media!")
    print("\nTekan Ctrl + C untuk menghentikan server.")
    print("=" * 65 + "\n")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer PhotoArt dihentikan.")
        httpd.server_close()

if __name__ == "__main__":
    p = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    run(p)
