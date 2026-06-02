"""
Superhero Forge — Test Suite
Tests all API endpoints, helpers, and security measures.
Uses Flask test client with isolated temp directories.
"""

import json
import os
import shutil
import tempfile
import unittest
from unittest.mock import patch, MagicMock

import app as _app_module


class ForgeTestCase(unittest.TestCase):
    """Base class: creates temp dirs, patches module paths, cleans up."""

    def setUp(self):
        self._tmpdir = tempfile.mkdtemp(prefix="forge_test_")

        # Temp paths
        self.config_file = os.path.join(self._tmpdir, "config.json")
        self.data_dir = os.path.join(self._tmpdir, "data")
        self.chars_dir = os.path.join(self.data_dir, "characters")
        self.teams_dir = os.path.join(self.data_dir, "teams")
        self.stories_dir = os.path.join(self.data_dir, "stories")
        self.images_dir = os.path.join(self._tmpdir, "images")
        self.storage_file = os.path.join(self.data_dir, "forge-data.json")

        for d in (self.chars_dir, self.teams_dir, self.stories_dir, self.images_dir):
            os.makedirs(d, exist_ok=True)

        # Write a clean config
        with open(self.config_file, "w") as f:
            json.dump({
                "model": "llama3.2",
                "ollama_url": "http://localhost:11434",
                "ollama_api_key": "",
                "port": 7432,
                "secret_key": "dGVzdHNlY3JldGtleTEyMzQ1Njc4OTA=",
            }, f)

        # Patch module-level globals
        self._orig = {
            "CONFIG_FILE": _app_module.CONFIG_FILE,
            "DATA_DIR": _app_module.DATA_DIR,
            "CHARACTERS_DIR": _app_module.CHARACTERS_DIR,
            "TEAMS_DIR": _app_module.TEAMS_DIR,
            "STORIES_DIR": _app_module.STORIES_DIR,
            "IMAGES_DIR": _app_module.IMAGES_DIR,
            "STORAGE_FILE": _app_module.STORAGE_FILE,
        }
        _app_module.CONFIG_FILE = self.config_file
        _app_module.DATA_DIR = self.data_dir
        _app_module.CHARACTERS_DIR = self.chars_dir
        _app_module.TEAMS_DIR = self.teams_dir
        _app_module.STORIES_DIR = self.stories_dir
        _app_module.IMAGES_DIR = self.images_dir
        _app_module.STORAGE_FILE = self.storage_file
        _app_module.config = _app_module.load_config()

        self.app = _app_module.app
        self.app.secret_key = b"testsecretkey123456789012345"
        self.client = self.app.test_client()

    def tearDown(self):
        # Restore original module paths
        _app_module.CONFIG_FILE = self._orig["CONFIG_FILE"]
        _app_module.DATA_DIR = self._orig["DATA_DIR"]
        _app_module.CHARACTERS_DIR = self._orig["CHARACTERS_DIR"]
        _app_module.TEAMS_DIR = self._orig["TEAMS_DIR"]
        _app_module.STORIES_DIR = self._orig["STORIES_DIR"]
        _app_module.IMAGES_DIR = self._orig["IMAGES_DIR"]
        _app_module.STORAGE_FILE = self._orig["STORAGE_FILE"]
        _app_module.config = _app_module.load_config()
        shutil.rmtree(self._tmpdir, ignore_errors=True)


# ===========================================================================
# 1. Health & Status
# ===========================================================================
class TestHealthEndpoint(ForgeTestCase):

    def test_health_returns_ok(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["version"], _app_module.FORGE_VERSION)
        self.assertIn("model", data)

    def test_health_model_matches_config(self):
        r = self.client.get("/health")
        data = r.get_json()
        self.assertEqual(data["model"], _app_module.config.get("model", "llama3.2"))


class TestStatusEndpoint(ForgeTestCase):

    @patch.object(_app_module, "ollama_is_running", return_value=False)
    @patch.object(_app_module, "ollama_models", return_value=[])
    def test_status_local_mode(self, mock_models, mock_running):
        _app_module.config["ollama_api_key"] = ""
        r = self.client.get("/api/status")
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertFalse(data["ollama_running"])
        self.assertEqual(data["mode"], "local")

    @patch.object(_app_module, "ollama_is_running", return_value=True)
    @patch.object(_app_module, "ollama_models", return_value=["llama3.2"])
    def test_status_running(self, mock_models, mock_running):
        r = self.client.get("/api/status")
        data = r.get_json()
        self.assertTrue(data["ollama_running"])
        self.assertIn("llama3.2", data["models"])


class TestModelsEndpoint(ForgeTestCase):

    @patch.object(_app_module, "ollama_models", return_value=["llama3.2", "mistral"])
    def test_list_models(self, mock_models):
        r = self.client.get("/api/models")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json(), ["llama3.2", "mistral"])


# ===========================================================================
# 2. Config
# ===========================================================================
class TestConfigEndpoint(ForgeTestCase):

    def test_get_config_redacts_api_key(self):
        _app_module.config["ollama_api_key"] = "sk-secret-key-12345"
        r = self.client.get("/api/config")
        data = r.get_json()
        self.assertNotIn("ollama_api_key", data)
        self.assertNotIn("secret_key", data)
        self.assertTrue(data["has_api_key"])
        self.assertEqual(data["mode"], "remote")

    def test_get_config_no_api_key(self):
        _app_module.config["ollama_api_key"] = ""
        r = self.client.get("/api/config")
        data = r.get_json()
        self.assertFalse(data["has_api_key"])
        self.assertEqual(data["mode"], "local")

    def test_update_config_model(self):
        r = self.client.post("/api/config",
                             json={"model": "mistral", "ollama_url": "http://localhost:11434"})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data["ok"])
        cfg = _app_module.load_config()
        self.assertEqual(cfg["model"], "mistral")

    def test_update_config_strips_trailing_slash(self):
        r = self.client.post("/api/config",
                             json={"ollama_url": "http://localhost:11434/"})
        data = r.get_json()
        self.assertTrue(data["ok"])
        cfg = _app_module.load_config()
        self.assertFalse(cfg["ollama_url"].endswith("/"))


# ===========================================================================
# 3. Characters CRUD
# ===========================================================================
class TestCharactersCRUD(ForgeTestCase):

    def test_list_characters_empty(self):
        r = self.client.get("/api/characters")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json(), [])

    def test_save_and_list_character(self):
        char = {"name": "Solar Flare", "real_name": "Jane Doe", "powers": ["heat"]}
        r = self.client.post("/api/characters", json=char)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

        r2 = self.client.get("/api/characters")
        chars = r2.get_json()
        self.assertEqual(len(chars), 1)
        self.assertEqual(chars[0]["name"], "Solar Flare")

    def test_save_character_path_traversal(self):
        """`../` gets stripped by basename; save_character is safe."""
        r = self.client.post("/api/characters",
                             json={"name": "../../../etc/passwd"})
        # basename strips path -> saves as passwd.json (safe outcome)
        self.assertEqual(r.status_code, 200)
        files = os.listdir(self.chars_dir)
        self.assertIn("passwd.json", files)

    def test_delete_character(self):
        self.client.post("/api/characters", json={"name": "Phantom"})
        r = self.client.delete("/api/characters/phantom")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_delete_character_not_found(self):
        r = self.client.delete("/api/characters/nonexistent")
        self.assertEqual(r.status_code, 404)

    def test_delete_character_path_traversal(self):
        """URL-encoded traversal in DELETE is handled by _safe_name."""
        r = self.client.delete("/api/characters/..%2F..%2Fetc%2Fpasswd")
        # _safe_name rejects names with / in them -> 400 or 404
        # URL %2F is decoded by Flask routing, then _safe_name strips via basename
        self.assertIn(r.status_code, (400, 404))

    def test_save_character_sanitizes_name(self):
        r = self.client.post("/api/characters", json={"name": "Dark Star"})
        self.assertTrue(r.get_json()["ok"])
        files = os.listdir(self.chars_dir)
        self.assertIn("dark_star.json", files)

    def test_save_character_generated_schema(self):
        """Generated heroes use {name, real_name, alignment, powers:[str], stats:{...}}."""
        char = {
            "name": "Tempest",
            "real_name": "Eli Storm",
            "alignment": "hero",
            "powers": ["Wind control", "Lightning"],
            "weaknesses": ["Calm emotions"],
            "backstory": "Raised in a storm.",
            "personality": "fierce, loyal",
            "stats": {"strength": 7, "speed": 9},
            "appearance": "Grey cloak, crackling aura",
        }
        r = self.client.post("/api/characters", json=char)
        self.assertTrue(r.get_json()["ok"])
        # Read it back via GET
        r2 = self.client.get("/api/characters")
        chars = r2.get_json()
        self.assertEqual(len(chars), 1)
        self.assertEqual(chars[0]["name"], "Tempest")
        self.assertEqual(chars[0]["powers"], ["Wind control", "Lightning"])
        # Slug is derived from `name` (lowercased, underscored)
        files = os.listdir(self.chars_dir)
        self.assertIn("tempest.json", files)

    def test_delete_character_uses_name_slug(self):
        """The slug used for DELETE is derived from the name field."""
        self.client.post("/api/characters", json={"name": "Solar Flare"})
        # The frontend calls DELETE /api/characters/solar_flare
        r = self.client.delete("/api/characters/solar_flare")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])
        files = os.listdir(self.chars_dir)
        self.assertNotIn("solar_flare.json", files)


# ===========================================================================
# 4. Teams CRUD
# ===========================================================================
class TestTeamsCRUD(ForgeTestCase):

    def test_list_teams_empty(self):
        r = self.client.get("/api/teams")
        self.assertEqual(r.get_json(), [])

    def test_save_and_list_team(self):
        team = {"name": "Night Watch", "members": ["Phantom", "Shadow"]}
        r = self.client.post("/api/teams", json=team)
        self.assertTrue(r.get_json()["ok"])

        r2 = self.client.get("/api/teams")
        teams = r2.get_json()
        self.assertEqual(len(teams), 1)
        self.assertEqual(teams[0]["name"], "Night Watch")

    def test_delete_team(self):
        self.client.post("/api/teams", json={"name": "Alpha"})
        r = self.client.delete("/api/teams/alpha")
        self.assertEqual(r.status_code, 200)

    def test_delete_team_not_found(self):
        r = self.client.delete("/api/teams/nonexistent")
        self.assertEqual(r.status_code, 404)

    def test_team_path_traversal(self):
        """`../` is stripped by basename; save_team is safe."""
        r = self.client.post("/api/teams", json={"name": "../../etc/shadow"})
        # basename strips to shadow.json — safe
        self.assertEqual(r.status_code, 200)
        files = os.listdir(self.teams_dir)
        self.assertIn("shadow.json", files)


# ===========================================================================
# 5. Stories CRUD
# ===========================================================================
class TestStoriesCRUD(ForgeTestCase):

    def test_list_stories_empty(self):
        r = self.client.get("/api/stories")
        self.assertEqual(r.get_json(), [])

    def test_save_and_list_story(self):
        story = {"title": "Battle of Brooklyn", "content": "It was a dark night..."}
        r = self.client.post("/api/stories", json=story)
        self.assertTrue(r.get_json()["ok"])

        r2 = self.client.get("/api/stories")
        stories = r2.get_json()
        self.assertEqual(len(stories), 1)
        self.assertEqual(stories[0]["title"], "Battle of Brooklyn")

    def test_save_story_generates_unique_filename(self):
        """Two stories with same title should not collide (timestamp in name)."""
        import time
        story1 = {"title": "Rising", "content": "Part 1"}
        self.client.post("/api/stories", json=story1)
        time.sleep(1.01)  # ensure different timestamp
        story2 = {"title": "Rising", "content": "Part 2"}
        self.client.post("/api/stories", json=story2)
        files = [f for f in os.listdir(self.stories_dir) if f.endswith(".json")]
        self.assertEqual(len(files), 2)

    def test_delete_story(self):
        self.client.post("/api/stories", json={"title": "Fallout"})
        files = os.listdir(self.stories_dir)
        if files:
            name = files[0].replace(".json", "")
            r = self.client.delete(f"/api/stories/{name}")
            self.assertEqual(r.status_code, 200)

    def test_story_path_traversal(self):
        """`../` stripped by basename; save_story is safe."""
        r = self.client.post("/api/stories", json={"title": "../../../etc/passwd"})
        self.assertEqual(r.status_code, 200)
        files = os.listdir(self.stories_dir)
        # basename strips to passwd_<ts>.json
        self.assertTrue(any("passwd" in f for f in files))


# ===========================================================================
# 6. Store (key-value)
# ===========================================================================
class TestStoreEndpoint(ForgeTestCase):

    def test_list_keys_empty(self):
        r = self.client.get("/api/store")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["keys"], [])

    def test_set_and_get(self):
        self.client.post("/api/store/mykey", json={"value": "hello"})
        r = self.client.get("/api/store/mykey")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["value"], "hello")

    def test_get_not_found(self):
        r = self.client.get("/api/store/missing")
        self.assertEqual(r.status_code, 404)

    def test_delete(self):
        self.client.post("/api/store/k", json={"value": "v"})
        r = self.client.delete("/api/store/k")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["deleted"])

    def test_prefix_filter(self):
        self.client.post("/api/store/user_1", json={"value": "a"})
        self.client.post("/api/store/user_2", json={"value": "b"})
        self.client.post("/api/store/team_1", json={"value": "c"})
        r = self.client.get("/api/store?prefix=user_")
        self.assertEqual(sorted(r.get_json()["keys"]), ["user_1", "user_2"])

    def test_villain_pool_round_trip(self):
        """The forge-villains store key holds an array of villain objects."""
        villains = [
            {
                "id": "villain-1",
                "name": "Plague",
                "real_name": "Victor Dark",
                "alignment": "villain",
                "powers": ["Toxic gas"],
                "weaknesses": ["Fire"],
                "backstory": "Failed chemist.",
                "personality": "ruthless",
                "threat_level": "metro",
                "goal": "Contaminate the city",
                "stats": {"strength": 5, "speed": 4},
                "appearance": "Hazard suit",
                "isVillain": True,
                "targetTeams": ["nocturnal-knights"],
                "nkAlignment": "enemy",
            },
            {
                "id": "villain-2",
                "name": "Cipher",
                "real_name": "Mira Vox",
                "alignment": "villain",
                "powers": ["Mind control", "Illusion"],
                "threat_level": "global",
                "goal": "World domination",
                "isVillain": True,
                "targetTeams": [],
                "nkAlignment": "enemy",
            },
        ]
        import json
        # Save the array
        r = self.client.post(
            "/api/store/forge-villains",
            json={"value": json.dumps(villains)},
        )
        self.assertEqual(r.status_code, 200)
        # Read it back
        r2 = self.client.get("/api/store/forge-villains")
        self.assertEqual(r2.status_code, 200)
        body = r2.get_json()
        self.assertEqual(body["key"], "forge-villains")
        loaded = json.loads(body["value"])
        self.assertEqual(len(loaded), 2)
        self.assertEqual(loaded[0]["name"], "Plague")
        self.assertEqual(loaded[0]["threat_level"], "metro")
        self.assertEqual(loaded[1]["goal"], "World domination")
        # List via prefix to confirm visibility
        r3 = self.client.get("/api/store?prefix=forge-")
        self.assertIn("forge-villains", r3.get_json()["keys"])


# ===========================================================================
# 7. Images
# ===========================================================================
class TestImagesEndpoint(ForgeTestCase):

    # Minimal valid 1x1 PNG
    PNG_B64 = ("data:image/png;base64,"
               "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
               "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")

    def test_list_images_empty(self):
        r = self.client.get("/api/images")
        self.assertEqual(r.get_json(), [])

    def test_save_and_list_image(self):
        r = self.client.post("/api/images/test-hero", json={"data": self.PNG_B64})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertTrue(data["ok"])
        self.assertEqual(data["ext"], ".png")

        r2 = self.client.get("/api/images")
        self.assertIn("test-hero", r2.get_json())

    def test_get_image(self):
        self.client.post("/api/images/retrieval-test", json={"data": self.PNG_B64})
        r = self.client.get("/api/images/retrieval-test")
        self.assertEqual(r.status_code, 200)

    def test_get_image_not_found(self):
        r = self.client.get("/api/images/nope")
        self.assertEqual(r.status_code, 404)

    def test_delete_image(self):
        self.client.post("/api/images/del-me", json={"data": self.PNG_B64})
        r = self.client.delete("/api/images/del-me")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_delete_image_not_found(self):
        r = self.client.delete("/api/images/nonexistent")
        self.assertEqual(r.status_code, 404)

    def test_image_no_data(self):
        r = self.client.post("/api/images/bad", json={})
        self.assertEqual(r.status_code, 400)

    def test_image_jpeg_detection(self):
        jpg_b64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=="
        r = self.client.post("/api/images/jpg-test", json={"data": jpg_b64})
        data = r.get_json()
        self.assertEqual(data.get("ext"), ".jpg")

    def test_image_path_traversal_in_id(self):
        r = self.client.post("/api/images/../../etc/passwd", json={"data": self.PNG_B64})
        self.assertFalse(os.path.exists(os.path.join(self._tmpdir, "etc")))


# ===========================================================================
# 8. Generation endpoints (mocked Ollama)
# ===========================================================================
class TestHeroGeneration(ForgeTestCase):

    @patch.object(_app_module, "ollama_generate")
    def test_generate_hero_success(self, mock_gen):
        mock_gen.return_value = json.dumps({
            "name": "Nova", "real_name": "Sara Vega", "alignment": "hero",
            "powers": ["flight", "energy blast"], "weaknesses": ["electricity"],
            "backstory": "Born from a star.", "personality": "bold",
            "stats": {"strength": 7, "speed": 9, "durability": 6,
                      "intelligence": 8, "energy": 10},
            "appearance": "Glowing golden aura"
        })
        r = self.client.post("/api/generate/hero", json={"extra": "space hero"})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertEqual(data["name"], "Nova")
        self.assertIn("source_model", data)
        files = os.listdir(self.chars_dir)
        self.assertTrue(any("nova" in f for f in files))

    @patch.object(_app_module, "ollama_generate")
    def test_generate_hero_bad_json(self, mock_gen):
        mock_gen.return_value = "This is not JSON at all"
        r = self.client.post("/api/generate/hero", json={})
        self.assertEqual(r.status_code, 422)

    @patch.object(_app_module, "ollama_generate")
    def test_generate_hero_connection_error(self, mock_gen):
        import requests as req
        mock_gen.side_effect = req.exceptions.ConnectionError("refused")
        _app_module.config["ollama_api_key"] = ""
        r = self.client.post("/api/generate/hero", json={})
        self.assertEqual(r.status_code, 503)
        self.assertIn("not running", r.get_json()["error"])

    @patch.object(_app_module, "ollama_generate")
    def test_generate_hero_auth_error(self, mock_gen):
        import requests as req
        mock_resp = MagicMock()
        mock_resp.status_code = 401
        mock_gen.side_effect = req.exceptions.HTTPError(response=mock_resp)
        r = self.client.post("/api/generate/hero", json={})
        self.assertEqual(r.status_code, 401)

    @patch.object(_app_module, "ollama_generate")
    def test_generate_hero_timeout(self, mock_gen):
        import requests as req
        mock_gen.side_effect = req.exceptions.Timeout("timed out")
        r = self.client.post("/api/generate/hero", json={})
        self.assertEqual(r.status_code, 504)


class TestVillainGeneration(ForgeTestCase):

    @patch.object(_app_module, "ollama_generate")
    def test_generate_villain_success(self, mock_gen):
        mock_gen.return_value = json.dumps({
            "name": "Plague", "real_name": "Victor Dark", "alignment": "villain",
            "powers": ["toxic gas"], "weaknesses": ["fire"],
            "backstory": "A failed chemist.", "personality": "ruthless",
            "threat_level": "metro", "goal": "contamination",
            "stats": {"strength": 5, "speed": 4, "durability": 7,
                      "intelligence": 9, "energy": 6},
            "appearance": "Hazard suit"
        })
        r = self.client.post("/api/generate/villain", json={"extra": "bio-terrorist"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("Plague", r.get_json()["name"])


class TestRecruitGeneration(ForgeTestCase):

    @patch.object(_app_module, "ollama_generate")
    def test_generate_recruit_success(self, mock_gen):
        mock_gen.return_value = json.dumps({
            "name": "Shield", "real_name": "Marcus Wall",
            "role": "tank", "powers": ["force field"],
            "personality": "stoic", "why_recruit": "needs protection"
        })
        r = self.client.post("/api/generate/recruit",
                             json={"team": ["Nova", "Phantom"]})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.get_json()["name"], "Shield")


class TestStoryGeneration(ForgeTestCase):

    @patch.object(_app_module, "ollama_generate")
    def test_generate_story_success(self, mock_gen):
        mock_gen.return_value = "The night was dark and full of heroes."
        r = self.client.post("/api/generate/story",
                             json={"heroes": ["Nova"], "villains": ["Plague"],
                                   "setting": "a dark city"})
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertIn("content", data)
        self.assertIn("source_model", data)
        files = os.listdir(self.stories_dir)
        self.assertTrue(len(files) > 0)


# ===========================================================================
# 9. Chat endpoint
# ===========================================================================
class TestChatEndpoint(ForgeTestCase):

    @patch("app.requests")
    def test_chat_local_mode(self, mock_requests):
        _app_module.config["ollama_api_key"] = ""
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"message": {"content": "Hello hero!"}}
        mock_requests.post.return_value = mock_resp
        mock_requests.exceptions = __import__("requests").exceptions

        r = self.client.post("/api/chat",
                             json={"messages": [{"role": "user", "content": "Hi"}]})
        self.assertEqual(r.status_code, 200)
        self.assertIn("text", r.get_json()["content"][0])


# ===========================================================================
# 10. Model pull
# ===========================================================================
class TestPullEndpoint(ForgeTestCase):

    def test_pull_rejected_in_remote_mode(self):
        _app_module.config["ollama_api_key"] = "sk-test"
        r = self.client.post("/api/pull", json={"model": "llama3.2"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("not available", r.get_json()["error"].lower())

    @patch.object(_app_module, "_is_remote", return_value=False)
    def test_pull_accepts_local(self, mock_remote):
        r = self.client.post("/api/pull", json={"model": "llama3.2"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])


# ===========================================================================
# 11. Remote access
# ===========================================================================
class TestRemoteStatus(ForgeTestCase):

    @patch.object(_app_module, "shutil")
    def test_remote_status(self, mock_shutil):
        mock_shutil.which.return_value = None
        r = self.client.get("/api/remote")
        self.assertEqual(r.status_code, 200)
        data = r.get_json()
        self.assertIn("enabled", data)
        self.assertIn("pin_set", data)
        self.assertFalse(data["cloudflared"])

    @patch.object(_app_module, "shutil")
    def test_remote_status_with_cloudflared(self, mock_shutil):
        mock_shutil.which.return_value = "/usr/local/bin/cloudflared"
        r = self.client.get("/api/remote")
        self.assertTrue(r.get_json()["cloudflared"])


# ===========================================================================
# 12. PIN guard
# ===========================================================================
class TestPINGuard(ForgeTestCase):

    def _set_pin(self, pin_value):
        """Persist PIN in temp config so load_config() reads it."""
        _app_module.config["remote_pin"] = pin_value
        _app_module.save_config(_app_module.config)

    def test_pin_verify_correct(self):
        self._set_pin("1234")
        r = self.client.post("/api/verify-pin", json={"pin": "1234"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.get_json()["ok"])

    def test_pin_verify_incorrect(self):
        self._set_pin("1234")
        r = self.client.post("/api/verify-pin", json={"pin": "9999"})
        self.assertEqual(r.status_code, 401)
        self.assertFalse(r.get_json()["ok"])

    def test_pin_verify_no_pin_set(self):
        self._set_pin("")
        r = self.client.post("/api/verify-pin", json={"pin": "anything"})
        self.assertTrue(r.get_json()["ok"])

    def test_pin_page_loads(self):
        r = self.client.get("/forge-pin")
        self.assertEqual(r.status_code, 200)
        self.assertIn(b"SUPERHERO FORGE", r.data)


# ===========================================================================
# 13. Security helpers
# ===========================================================================
class TestSafeName(ForgeTestCase):

    def test_normal_name(self):
        self.assertEqual(_app_module._safe_name("hero"), "hero.json")

    def test_strips_directory(self):
        self.assertEqual(_app_module._safe_name("subdir/hero"), "hero.json")

    def test_rejects_dotdot(self):
        """`..` in the basename is still rejected; path prefixes are stripped."""
        # `os.path.basename` strips `../etc/` leaving `passwd`, which is safe
        result = _app_module._safe_name("../etc/passwd")
        self.assertEqual(result, "passwd.json")  # safe — no path escape possible
        # But `..` alone (not a path component) IS rejected
        self.assertEqual(_app_module._safe_name(".."), "")

    def test_rejects_backslash(self):
        self.assertEqual(_app_module._safe_name("..\\windows\\system32"), "")

    def test_adds_extension(self):
        self.assertEqual(_app_module._safe_name("myhero", ".json"), "myhero.json")

    def test_preserves_existing_extension(self):
        self.assertEqual(_app_module._safe_name("myhero.json", ".json"), "myhero.json")


class TestExtractJson(ForgeTestCase):

    def test_clean_json(self):
        self.assertEqual(_app_module.extract_json('{"name": "Nova"}')["name"], "Nova")

    def test_markdown_wrapped_json(self):
        text = '```json\n{"name": "Nova"}\n```'
        self.assertEqual(_app_module.extract_json(text)["name"], "Nova")

    def test_code_fence_json(self):
        text = '```\n{"name": "Nova"}\n```'
        self.assertEqual(_app_module.extract_json(text)["name"], "Nova")

    def test_json_with_surrounding_text(self):
        text = 'Here is the result: {"name": "Nova"} End'
        self.assertEqual(_app_module.extract_json(text)["name"], "Nova")

    def test_invalid_json(self):
        self.assertIn("error", _app_module.extract_json("just some random text"))

    def test_empty_string(self):
        self.assertIn("error", _app_module.extract_json(""))


class TestIsRemote(ForgeTestCase):

    def test_local_mode(self):
        _app_module.config["ollama_api_key"] = ""
        self.assertFalse(_app_module._is_remote())

    def test_remote_mode(self):
        _app_module.config["ollama_api_key"] = "sk-test-key"
        self.assertTrue(_app_module._is_remote())


class TestHeaders(ForgeTestCase):

    def test_local_headers_no_auth(self):
        _app_module.config["ollama_api_key"] = ""
        hdrs = _app_module._headers()
        self.assertNotIn("Authorization", hdrs)

    def test_remote_headers_with_auth(self):
        _app_module.config["ollama_api_key"] = "sk-test-key"
        hdrs = _app_module._headers()
        self.assertIn("Authorization", hdrs)
        self.assertTrue(hdrs["Authorization"].startswith("Bearer "))


# ===========================================================================
# 14. Static routes
# ===========================================================================
class TestStaticRoutes(ForgeTestCase):

    def test_index_page(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)

    def test_health_no_auth_required(self):
        r = self.client.get("/health")
        self.assertEqual(r.status_code, 200)

    # ── New template-based UI ─────────────────────────────────────────
    def test_index_renders_base_template(self):
        """`/` returns a Jinja2-rendered HTML page, not the old static file."""
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        html = r.data.decode()
        # Bootstrap + Alpine CDN
        self.assertIn("bootstrap@5", html)
        self.assertIn("alpinejs", html)
        # App shell
        self.assertIn("Superhero Forge", html)
        # Version meta tag
        self.assertIn('name="forge-version"', html)
        # All five tabs present
        for tab in ["teams", "characters", "villains", "story", "settings"]:
            self.assertIn(f"activeTab === '{tab}'", html)

    def test_index_has_version_meta(self):
        r = self.client.get("/")
        html = r.data.decode()
        # Version tag should be present and non-empty
        import re
        m = re.search(r'<meta name="forge-version" content="([^"]+)"', html)
        self.assertTrue(m is not None, "forge-version meta tag missing")
        self.assertTrue(len(m.group(1)) > 0)

    def test_index_includes_teams_partial(self):
        r = self.client.get("/")
        html = r.data.decode()
        # Teams tab content
        self.assertIn("New Team", html)
        self.assertIn("Roster", html)
        # Alpine bindings
        self.assertIn("openTeamCreator", html)
        self.assertIn("saveTeam", html)
        self.assertIn("deleteTeam", html)

    def test_index_includes_settings_partial(self):
        r = self.client.get("/")
        html = r.data.decode()
        self.assertIn("Ollama Status", html)
        self.assertIn("Active Model", html)
        self.assertIn("Connection", html)

    def test_static_assets_serve(self):
        for path in ["/static/css/theme.css", "/static/js/app.js"]:
            r = self.client.get(path)
            self.assertEqual(r.status_code, 200, f"{path} not served")
            self.assertGreater(len(r.data), 0, f"{path} is empty")

    def test_index_includes_characters_partial(self):
        r = self.client.get("/")
        html = r.data.decode()
        # Characters tab content
        self.assertIn("Generate Hero", html)
        self.assertIn("Generate Villain", html)
        self.assertIn("No characters yet", html)
        # Alpine bindings (present in the partial)
        self.assertIn("openGenerator", html)
        self.assertIn("generateCharacter", html)
        self.assertIn("selectCharacter", html)
        self.assertIn("deleteCharacter", html)
        # Field compatibility helpers (present in the partial)
        self.assertIn("charName", html)
        self.assertIn("charPowers", html)
        self.assertIn("charStats", html)

    def test_app_js_exposes_character_methods(self):
        """The Alpine component defines all the character CRUD methods."""
        r = self.client.get("/static/js/app.js")
        self.assertEqual(r.status_code, 200)
        js = r.data.decode()
        for method in [
            "loadCharacters", "selectCharacter", "closeCharacter",
            "deleteCharacter", "openGenerator", "generateCharacter",
            "charName", "charInitials", "charPowers", "charOrigin",
            "charStats", "charStatKeys", "charType", "charTypeLabel",
            "charTypeBadgeClass", "filteredCharacters",
        ]:
            self.assertIn(method, js, f"app.js missing {method}")

    def test_index_includes_villains_partial(self):
        r = self.client.get("/")
        html = r.data.decode()
        # Villains tab content
        self.assertIn("Generate Villain", html)
        self.assertIn("No active threats", html)
        # Threat levels in dropdown
        for level in ["street", "metro", "global", "cosmic"]:
            self.assertIn(f'value="{level}"', html)
        # Alpine bindings (present in the partial)
        self.assertIn("openVillainGenerator", html)
        self.assertIn("generateVillain", html)
        self.assertIn("villainGenerateForm", html)
        self.assertIn("toggleVillainTarget", html)
        # Field helpers (present in the partial — those referenced in the template)
        self.assertIn("villName", html)
        self.assertIn("villGoal", html)
        self.assertIn("villTargetTeamNames", html)
        self.assertIn("villThreatLevel", html)

    def test_app_js_exposes_villain_methods(self):
        """Alpine component defines all villain pool + generation methods."""
        r = self.client.get("/static/js/app.js")
        self.assertEqual(r.status_code, 200)
        js = r.data.decode()
        for method in [
            "loadVillains", "selectVillain", "closeVillain",
            "deleteVillain", "addCharacterAsVillain",
            "openVillainGenerator", "closeVillainGenerator", "generateVillain",
            "toggleVillainTarget",
            "villName", "villPowers", "villGoal", "villThreatLevel",
            "villThreatBadgeClass", "villTargetTeams", "villTargetTeamNames",
            "filteredVillains",
        ]:
            self.assertIn(method, js, f"app.js missing {method}")

    def test_index_includes_story_partial(self):
        """Story tab content renders (toolbar, modal, generator)."""
        r = self.client.get("/")
        html = r.data.decode()
        # Toolbar
        self.assertIn("Generate Story", html)
        self.assertIn("No stories yet", html)
        # Generator form
        self.assertIn("a dark city at night", html)
        # Alpine bindings
        self.assertIn("openStoryGenerator", html)
        self.assertIn("generateStory", html)
        self.assertIn("storyGenerateForm", html)
        self.assertIn("toggleStoryHero", html)
        self.assertIn("toggleStoryVillain", html)
        # Field helpers (used in template)
        self.assertIn("storyTitle", html)
        self.assertIn("storySetting", html)
        self.assertIn("storyContent", html)
        self.assertIn("storyModel", html)
        self.assertIn("storyTimestamp", html)
        self.assertIn("storyWordCount", html)
        self.assertIn("storyPreview", html)
        # Theme
        self.assertIn("forge-surface", html)
        self.assertIn("story-content", html)

    def test_app_js_exposes_story_methods(self):
        """Alpine component defines all story CRUD + generation methods."""
        r = self.client.get("/static/js/app.js")
        self.assertEqual(r.status_code, 200)
        js = r.data.decode()
        for method in [
            "loadStories", "selectStory", "closeStory", "deleteStory",
            "openStoryGenerator", "closeStoryGenerator", "generateStory",
            "toggleStoryHero", "toggleStoryVillain", "pickFromActiveRoster",
            "storyTitle", "storySetting", "storyHeroes", "storyVillains",
            "storyContent", "storyModel", "storyTimestamp",
            "storyWordCount", "storyPreview", "filteredStories",
        ]:
            self.assertIn(method, js, f"app.js missing {method}")

    def test_story_listing_endpoint_round_trip(self):
        """The /api/stories GET endpoint returns a list (used by loadStories)."""
        r = self.client.get("/api/stories")
        self.assertEqual(r.status_code, 200)
        self.assertIsInstance(r.get_json(), list)


# ===========================================================================
# 15. PDF export
# ===========================================================================
class TestPDFExport(ForgeTestCase):

    def test_pdf_missing_reportlab(self):
        r = self.client.post("/api/export-pdf", json={
            "members": [], "images": {},
            "teamName": "Test", "teamColor": "#534AB7"
        })
        self.assertIn(r.status_code, (200, 500))

    def test_pdf_with_member(self):
        try:
            from reportlab.lib.pagesizes import letter  # noqa
            has_rl = True
        except ImportError:
            has_rl = False

        if not has_rl:
            self.skipTest("reportlab not installed")

        member = {
            "heroName": "Test Hero", "realName": "John Test", "role": "leader",
            "stats": {"strength": 8, "speed": 7},
            "powers": [{"name": "Flight", "desc": "Can fly"}],
            "origin": "Born on a test server.",
            "nkAlignment": "member", "color": "#534AB7",
        }
        r = self.client.post("/api/export-pdf", json={
            "members": [member], "images": {},
            "teamName": "Test Squad", "teamColor": "#534AB7"
        })
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.content_type, "application/pdf")


# ===========================================================================
# 16. Auto-update
# ===========================================================================
class TestUpdateCheck(ForgeTestCase):

    @patch.object(_app_module, "check_for_updates",
                  return_value=(False, "abc1234", "abc1234"))
    def test_no_update(self, mock_check):
        r = self.client.get("/api/update/check")
        self.assertFalse(r.get_json()["has_update"])

    @patch.object(_app_module, "check_for_updates",
                  return_value=(True, "abc1234", "def5678"))
    def test_update_available(self, mock_check):
        r = self.client.get("/api/update/check")
        self.assertTrue(r.get_json()["has_update"])

    @patch.object(_app_module, "pull_update",
                  return_value=(True, "Already up to date"))
    def test_pull_update(self, mock_pull):
        r = self.client.post("/api/update/pull")
        self.assertTrue(r.get_json()["ok"])


# ===========================================================================
# 17. Restart endpoint
# ===========================================================================
class TestRestart(ForgeTestCase):

    def test_restart_returns_ok(self):
        with patch.object(_app_module.threading, "Thread"):
            r = self.client.post("/api/restart")
            self.assertEqual(r.status_code, 200)
            self.assertTrue(r.get_json()["ok"])


if __name__ == "__main__":
    unittest.main()