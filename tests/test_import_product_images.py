"""Use synthetic photos and temporary repositories; never import the real catalog."""

import importlib.util
import io
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image


spec = importlib.util.spec_from_file_location("product_image_import", Path(__file__).resolve().parents[1] / "scripts/import-product-images.py")
importer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(importer)


class ProductImageImportTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        self.repo = self.base / "repo"
        self.data = self.repo / "src/data"
        self.data.mkdir(parents=True)
        self.private = self.base / "private"
        self.private.mkdir()
        self.catalog_path = self.data / "products.json"
        self.catalog = [{"id": "0005", "precio": 12500.5, "taxRate": 19, "stock": 0.5}, {"id": "5", "precio": 0, "stock": 0}]
        self.catalog_path.write_text(json.dumps(self.catalog), encoding="utf-8")
        self.catalog_bytes = self.catalog_path.read_bytes()
        self.enrichment_path = self.data / "product-enrichment.json"
        self.enrichment = {"0005": {"specs": [{"label": "Modelo", "value": "Comprobado", "verified": True}]}, "5": {"specs": []}}
        self.enrichment_path.write_text(json.dumps(self.enrichment), encoding="utf-8")
        self.source = self.private / "capture.png"
        self.pixels = Image.new("RGBA", (4, 3), (16, 32, 64, 255))
        self.pixels.putpixel((0, 0), (70, 80, 90, 0))
        self.pixels.save(self.source)
        self.manifest = self.private / "manifest.json"
        self.record = {"sku": "0005", "sourcePath": self.source.name, "alt": "Fotografía comprobada", "provenance": "capture-rendered"}
        self.write_manifest([self.record])

    def tearDown(self):
        self.temporary.cleanup()

    def write_manifest(self, records):
        self.manifest.write_text(json.dumps(records), encoding="utf-8")

    def prepare(self):
        return importer.prepare_import(self.repo, self.manifest)

    def test_dry_run_does_not_write_files_and_preserves_exact_sku(self):
        before = self.enrichment_path.read_bytes()
        plan = self.prepare()
        self.assertFalse((self.repo / "public").exists())
        self.assertFalse(plan["auditPath"].exists())
        self.assertEqual(self.enrichment_path.read_bytes(), before)
        self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)
        self.assertEqual(plan["merged"]["0005"]["gallery"][0]["src"], "/products/whatsapp/0005-1.webp")
        self.assertEqual(plan["merged"]["5"], self.enrichment["5"])

    def test_lossless_import_preserves_dimensions_pixels_and_commercial_data(self):
        source_bytes = self.source.read_bytes()
        plan = self.prepare()
        importer.apply_import(plan)
        output = self.repo / "public/products/whatsapp/0005-1.webp"
        with Image.open(output) as image:
            self.assertEqual(image.size, self.pixels.size)
            self.assertEqual(image.convert("RGBA").tobytes(), self.pixels.tobytes())
        merged = json.loads(self.enrichment_path.read_text(encoding="utf-8"))
        self.assertEqual(merged["0005"]["specs"], self.enrichment["0005"]["specs"])
        self.assertEqual(merged["5"], self.enrichment["5"])
        self.assertEqual(set(merged["0005"]["gallery"][0]), {"src", "alt", "verified"})
        self.assertTrue(merged["0005"]["gallery"][0]["verified"])
        self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)
        self.assertEqual(self.source.read_bytes(), source_bytes)

    def test_private_audit_marks_rendered_capture_and_is_not_merged_into_public_data(self):
        plan = self.prepare()
        importer.apply_import(plan)
        audit = json.loads(plan["auditPath"].read_text(encoding="utf-8"))
        row = audit["images"][0]
        self.assertEqual(row["provenance"], "capture-rendered")
        self.assertEqual(row["sourceSha256"], importer.sha(self.source.read_bytes()))
        self.assertEqual(row["sourcePath"], str(self.source.resolve()))
        self.assertFalse(plan["auditPath"].is_relative_to(self.repo))
        self.assertNotIn("sourcePath", self.enrichment_path.read_text(encoding="utf-8"))
        self.write_manifest([{key: value for key, value in self.record.items() if key != "provenance"}])
        self.assertEqual(self.prepare()["audit"]["images"][0]["provenance"], "unspecified")

    def test_rerun_reuses_photo_and_additive_import_keeps_existing_gallery(self):
        importer.apply_import(self.prepare())
        repeat = self.prepare()
        self.assertEqual(len(repeat["files"]), 0)
        self.assertEqual(len(repeat["merged"]["0005"]["gallery"]), 1)
        reused_photo = self.repo / "public/products/whatsapp/0005-1.webp"
        approved_bytes = reused_photo.read_bytes()
        enrichment_bytes = self.enrichment_path.read_bytes()
        reused_photo.write_bytes(b"replaced after validation")
        with self.assertRaisesRegex(ValueError, "photo changed after validation"):
            importer.apply_import(repeat)
        self.assertEqual(self.enrichment_path.read_bytes(), enrichment_bytes)
        reused_photo.write_bytes(approved_bytes)
        second = self.private / "second.png"
        Image.new("RGB", (3, 2), (180, 30, 60)).save(second)
        third = self.private / "third.png"
        Image.new("RGB", (3, 2), (20, 130, 60)).save(third)
        self.write_manifest([self.record, {**self.record, "sourcePath": second.name}, {**self.record, "sourcePath": third.name}, self.record])
        plan = self.prepare()
        self.assertEqual(len(plan["files"]), 2)
        self.assertEqual([photo["src"] for photo in plan["merged"]["0005"]["gallery"]], [
            "/products/whatsapp/0005-1.webp", "/products/whatsapp/0005-2.webp", "/products/whatsapp/0005-3.webp",
        ])
        self.assertEqual(plan["merged"]["0005"]["specs"], self.enrichment["0005"]["specs"])

    def test_unknown_numeric_whitespace_skus_and_nonlocal_sources_are_rejected(self):
        for sku in ["00005", " 0005", 5]:
            with self.subTest(sku=sku):
                self.write_manifest([{**self.record, "sku": sku}])
                with self.assertRaisesRegex(ValueError, "exactly"):
                    self.prepare()
        for source_path in ["blob:foto", "https://example.com/foto.jpg", "//example.com/foto.jpg"]:
            with self.subTest(source=source_path):
                self.write_manifest([{**self.record, "sourcePath": source_path}])
                with self.assertRaisesRegex(ValueError, "local file"):
                    self.prepare()
        self.assertFalse((self.repo / "public").exists())

    def test_ambiguous_json_private_manifest_and_invented_provenance_are_rejected(self):
        self.manifest.write_text('[{"sku":"0005","sku":"5"}]', encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "Duplicate JSON key"):
            self.prepare()
        self.write_manifest([{**self.record, "provenance": "guessed-original"}])
        with self.assertRaisesRegex(ValueError, "provenance"):
            self.prepare()
        public_manifest = self.repo / "manifest.json"
        public_manifest.write_text(json.dumps([self.record]), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "private"):
            importer.prepare_import(self.repo, public_manifest)

    def test_changed_catalog_or_enrichment_is_not_overwritten(self):
        for path in [self.catalog_path, self.enrichment_path]:
            with self.subTest(path=path):
                plan = self.prepare()
                before = path.read_bytes()
                path.write_bytes(before + b"\n")
                with self.assertRaisesRegex(ValueError, "changed after validation"):
                    importer.apply_import(plan)
                self.assertEqual(path.read_bytes(), before + b"\n")
                self.assertFalse((self.repo / "public").exists())
                path.write_bytes(before)

    def test_official_replacement_keeps_other_skus_specs_and_lossless_pixels(self):
        importer.apply_import(self.prepare())
        existing = json.loads(self.enrichment_path.read_text(encoding="utf8"))
        existing["5"]["gallery"] = [{"src": "/products/whatsapp/5-1.webp", "alt": "Other SKU", "verified": True}]
        self.enrichment_path.write_text(json.dumps(existing), encoding="utf8")
        official_record = {**self.record, "provenance": "download-original", "sourcePage": "https://manufacturer.example/product/exact-model", "evidence": "Exact model and finish"}
        self.write_manifest([official_record, official_record])
        plan = importer.prepare_import(self.repo, self.manifest, "official", True)
        importer.apply_import(plan)
        merged = json.loads(self.enrichment_path.read_text(encoding="utf8"))
        self.assertEqual(merged["0005"]["gallery"], [{"src": "/products/official/0005-1.webp", "alt": self.record["alt"], "verified": True}])
        self.assertEqual(merged["0005"]["specs"], existing["0005"]["specs"])
        self.assertEqual(merged["5"], existing["5"])
        self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)
        with Image.open(self.repo / "public/products/official/0005-1.webp") as output:
            self.assertEqual(output.convert("RGBA").tobytes(), self.pixels.tobytes())
        self.assertEqual(plan["audit"]["replacedGalleries"], ["0005"])
        self.assertEqual(plan["audit"]["images"][0]["sourcePage"], official_record["sourcePage"])
        self.assertNotIn("sourcePage", self.enrichment_path.read_text(encoding="utf8"))
        repeat = importer.prepare_import(self.repo, self.manifest, "official", True)
        self.assertEqual(len(repeat["files"]), 0)
        self.assertEqual(repeat["merged"], merged)

    def test_collection_cannot_escape_public_image_directory(self):
        with self.assertRaisesRegex(ValueError, "Collection"):
            importer.prepare_import(self.repo, self.manifest, "../../outside", True)
        self.assertFalse((self.repo / "public").exists())


if __name__ == "__main__":
    unittest.main()
