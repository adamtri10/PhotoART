"""
Vercel Serverless Function Handler for PhotoArt API
Supports /api/photos, /api/custom-frames, /api/admin/*
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import time
import urllib.parse
import uuid

# Base directory paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
TMP_DIR = "/tmp"

# Storage files (in /tmp for serverless writable environment)
TMP_PHOTOS_DB = os.path.join(TMP_DIR, "photos_db.json")
TMP_FRAMES_DB = os.path.join(TMP_DIR, "custom_frames_db.json")

def get_photos_db():
    if os.path.exists(TMP_PHOTOS_DB):
        try:
            with open(TMP_PHOTOS_DB, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    fallback_path = os.path.join(DATA_DIR, "photos_db.json")
    if os.path.exists(fallback_path):
        try:
            with open(fallback_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_photos_db(data):
    try:
        with open(TMP_PHOTOS_DB, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save photos error:", e)

def get_frames_db():
    if os.path.exists(TMP_FRAMES_DB):
        try:
            with open(TMP_FRAMES_DB, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    fallback_path = os.path.join(DATA_DIR, "custom_frames_db.json")
    if os.path.exists(fallback_path):
        try:
            with open(fallback_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return []

def save_frames_db(data):
    try:
        with open(TMP_FRAMES_DB, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print("Save frames error:", e)


class handler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token, X-User-Id")

    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path.rstrip('/')
        qs = urllib.parse.parse_qs(parsed_url.query)

        # 1. GET /api/photos: Get photos for specific user
        if path == "/api/photos":
            user_id = self.headers.get("X-User-Id")
            if not user_id:
                user_id = qs.get("userId", [None])[0]
            if not user_id:
                self._send_json(200, [])
                return
            
            photos = get_photos_db()
            user_photos = [p for p in photos if p.get("userId") == user_id and not p.get("deleted", False)]
            self._send_json(200, user_photos)
            return

        # 2. GET /api/custom-frames: List custom frames
        if path == "/api/custom-frames":
            frames = get_frames_db()
            admin_token = self.headers.get("X-Admin-Token")
            if not admin_token:
                # Filter to only published frames for guests
                frames = [f for f in frames if f.get("isPublished", True)]
            self._send_json(200, {"success": True, "frames": frames})
            return

        # 3. GET /api/admin/stats
        if path == "/api/admin/stats":
            admin_token = self.headers.get("X-Admin-Token")
            if not admin_token:
                self._send_json(401, {"error": "Unauthorized"})
                return
            photos = get_photos_db()
            active = [p for p in photos if not p.get("deleted", False)]
            deleted = [p for p in photos if p.get("deleted", False)]
            frames = get_frames_db()
            self._send_json(200, {
                "success": True,
                "totalPhotos": len(photos),
                "activeCount": len(active),
                "trashCount": len(deleted),
                "totalFrames": len(frames)
            })
            return

        # 4. GET /api/admin/photos
        if path == "/api/admin/photos":
            admin_token = self.headers.get("X-Admin-Token")
            if not admin_token:
                self._send_json(401, {"error": "Unauthorized"})
                return
            photos = get_photos_db()
            active = [p for p in photos if not p.get("deleted", False)]
            deleted = [p for p in photos if p.get("deleted", False)]
            self._send_json(200, {
                "success": True,
                "stats": {
                    "total": len(photos),
                    "active": len(active),
                    "deleted": len(deleted)
                },
                "photos": photos,
                "activePhotos": active,
                "deletedPhotos": deleted
            })
            return

        self._send_json(404, {"error": f"Endpoint {path} not found"})

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        path = parsed_url.path.rstrip('/')

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            body_bytes = self.rfile.read(content_length) if content_length > 0 else b"{}"
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception as e:
            self._send_json(400, {"success": False, "error": f"Invalid JSON payload: {str(e)}"})
            return

        # 1. POST /api/photos/upload
        if path == "/api/photos/upload":
            image_data = body.get("image") or body.get("imageData", "")
            if not image_data:
                self._send_json(400, {"success": False, "error": "Image data required"})
                return

            user_id = self.headers.get("X-User-Id") or body.get("userId") or f"user_{int(time.time())}_{uuid.uuid4().hex[:6]}"
            photo_id = f"photo_{int(time.time())}_{uuid.uuid4().hex[:6]}"
            new_photo = {
                "id": photo_id,
                "userId": user_id,
                "themeId": body.get("themeId", "strip_3"),
                "themeName": body.get("themeName", "PhotoArt Studio"),
                "header": body.get("header", ""),
                "subtitle": body.get("subtitle", ""),
                "url": image_data,  # Data URL preserved for serverless environments
                "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "deleted": False
            }

            photos = get_photos_db()
            photos.insert(0, new_photo)
            save_photos_db(photos[:60])

            self._send_json(200, {
                "success": True,
                "id": photo_id,
                "url": image_data,
                "message": "Photo saved successfully"
            })
            return

        # 2. POST /api/photos/delete
        if path == "/api/photos/delete":
            photo_id = body.get("id")
            user_id = self.headers.get("X-User-Id") or body.get("userId")
            if not photo_id:
                self._send_json(400, {"success": False, "error": "Missing photo id"})
                return

            photos = get_photos_db()
            found = False
            for p in photos:
                if p.get("id") == photo_id:
                    if user_id and p.get("userId") != user_id:
                        self._send_json(403, {"success": False, "error": "Unauthorized delete"})
                        return
                    p["deleted"] = True
                    p["deletedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
                    found = True
                    break

            if found:
                save_photos_db(photos)
                self._send_json(200, {"success": True, "message": "Photo deleted"})
            else:
                self._send_json(404, {"success": False, "error": "Photo not found"})
            return

        # 3. POST /api/admin/login
        if path == "/api/admin/login":
            pin = str(body.get("pin", "")).strip()
            # Valid PINs: 8888, 1234, 0000
            if pin in ("8888", "1234", "0000"):
                token = f"admin_token_{int(time.time())}_{uuid.uuid4().hex[:8]}"
                self._send_json(200, {"success": True, "token": token})
            else:
                self._send_json(401, {"success": False, "error": "PIN Operator tidak valid. Gunakan PIN: 8888 atau 1234"})
            return

        # 4. POST /api/admin/restore
        if path == "/api/admin/restore":
            admin_token = self.headers.get("X-Admin-Token")
            if not admin_token:
                self._send_json(401, {"error": "Unauthorized"})
                return
            photo_id = body.get("id")
            photos = get_photos_db()
            found = False
            for p in photos:
                if p.get("id") == photo_id:
                    p["deleted"] = False
                    p.pop("deletedAt", None)
                    found = True
                    break
            if found:
                save_photos_db(photos)
                self._send_json(200, {"success": True, "message": "Photo restored"})
            else:
                self._send_json(404, {"success": False, "error": "Photo not found"})
            return

        self._send_json(404, {"error": f"Endpoint {path} not found"})

