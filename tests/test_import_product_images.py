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

    def test_supported_image_kinds_and_captions_survive_import_and_rerun(self):
        for kind in ["manufacturer-render", "supplier-render", "technical-diagram", "profile-detail", "component-detail", "pair-detail"]:
            with self.subTest(kind=kind):
                self.write_manifest([{**self.record, "kind": kind, "caption": "  Vista de referencia; no muestra el largo completo.  "}])
                plan = self.prepare()
                expected = {
                    "src": "/products/whatsapp/0005-1.webp", "alt": self.record["alt"], "verified": True,
                    "kind": kind, "caption": "Vista de referencia; no muestra el largo completo.",
                }
                self.assertEqual(plan["merged"]["0005"]["gallery"], [expected])
                importer.apply_import(plan)
                enrichment_bytes = self.enrichment_path.read_bytes()
                repeat = self.prepare()
                self.assertEqual(repeat["files"], {})
                self.assertEqual(repeat["merged"]["0005"]["gallery"], [expected])
                importer.apply_import(repeat)
                self.assertEqual(self.enrichment_path.read_bytes(), enrichment_bytes)
                self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)

    def test_research_photo_labels_normalize_without_a_kind_and_preserve_caption(self):
        for kind in ["manufacturer-packshot", "manufacturer-marketing-image"]:
            with self.subTest(kind=kind):
                self.write_manifest([{**self.record, "kind": "manufacturer-render", "caption": "Previous description"}])
                importer.apply_import(self.prepare())
                self.write_manifest([{**self.record, "kind": kind, "researchKind": kind, "caption": "Fotografía del envase original."}])
                plan = self.prepare()
                self.assertEqual(plan["files"], {})
                self.assertEqual(plan["merged"]["0005"]["gallery"], [{
                    "src": "/products/whatsapp/0005-1.webp", "alt": self.record["alt"], "verified": True,
                    "caption": "Fotografía del envase original.",
                }])
                self.assertEqual(plan["audit"]["images"][0]["kind"], kind)
                self.assertEqual(plan["audit"]["images"][0]["researchKind"], kind)
                importer.apply_import(plan)
                self.assertEqual(self.prepare()["merged"], plan["merged"])

    def test_legacy_manifest_rerun_keeps_manually_approved_caveats_for_reused_image(self):
        importer.apply_import(self.prepare())
        existing = json.loads(self.enrichment_path.read_text(encoding="utf-8"))
        caveats = {"kind": "profile-detail", "caption": "Detalle del perfil; no muestra el largo completo."}
        existing["0005"]["gallery"][0].update(caveats)
        self.enrichment_path.write_text(json.dumps(existing), encoding="utf-8")
        plan = self.prepare()
        self.assertEqual(plan["files"], {})
        self.assertEqual(plan["merged"], existing)
        self.assertEqual(plan["audit"]["images"][0]["preservedGalleryMetadata"], caveats)
        importer.apply_import(plan)
        before = self.enrichment_path.read_bytes()
        repeat = self.prepare()
        importer.apply_import(repeat)
        self.assertEqual(self.enrichment_path.read_bytes(), before)
        self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)

    def test_explicit_metadata_updates_only_the_supplied_caveat(self):
        original = {"kind": "profile-detail", "caption": "Detalle aprobado del perfil."}
        for changes in [{"kind": "component-detail"}, {"caption": "Descripción actualizada."}]:
            with self.subTest(changes=changes):
                self.write_manifest([{**self.record, **original}])
                importer.apply_import(self.prepare())
                self.write_manifest([{**self.record, **changes}])
                plan = self.prepare()
                photo = plan["merged"]["0005"]["gallery"][0]
                self.assertEqual({key: photo[key] for key in original}, {**original, **changes})
                self.assertEqual(plan["audit"]["images"][0]["preservedGalleryMetadata"], {
                    key: value for key, value in original.items() if key not in changes
                })

    def test_explicit_photo_kind_clears_old_kind_but_retains_omitted_caption(self):
        caption = "Solo muestra una pieza del par vendido."
        for kind in ["manufacturer-packshot", "manufacturer-marketing-image"]:
            with self.subTest(kind=kind):
                self.write_manifest([{**self.record, "kind": "pair-detail", "caption": caption}])
                importer.apply_import(self.prepare())
                self.write_manifest([{**self.record, "kind": kind}])
                plan = self.prepare()
                photo = plan["merged"]["0005"]["gallery"][0]
                self.assertNotIn("kind", photo)
                self.assertEqual(photo["caption"], caption)
                self.assertEqual(plan["audit"]["images"][0]["preservedGalleryMetadata"], {"caption": caption})
                importer.apply_import(plan)
                self.assertEqual(self.prepare()["merged"], plan["merged"])

    def test_replace_gallery_does_not_inherit_omitted_caveats(self):
        self.write_manifest([{**self.record, "kind": "supplier-render", "caption": "Vista anterior."}])
        importer.apply_import(self.prepare())
        self.write_manifest([self.record])
        plan = importer.prepare_import(self.repo, self.manifest, replace_gallery=True)
        self.assertEqual(plan["files"], {})
        self.assertEqual(plan["merged"]["0005"]["gallery"], [{
            "src": "/products/whatsapp/0005-1.webp", "alt": self.record["alt"], "verified": True,
        }])
        self.assertNotIn("preservedGalleryMetadata", plan["audit"]["images"][0])
        self.assertEqual(plan["merged"]["0005"]["specs"], self.enrichment["0005"]["specs"])
        importer.apply_import(plan)
        self.assertEqual(self.prepare()["merged"], plan["merged"])

    def test_new_bytes_at_missing_gallery_path_do_not_inherit_old_caveats(self):
        existing = {**self.enrichment}
        existing["0005"]["gallery"] = [{
            "src": "/products/whatsapp/0005-1.webp", "alt": "Missing original", "verified": True,
            "kind": "profile-detail", "caption": "Description of the missing original.",
        }]
        self.enrichment_path.write_text(json.dumps(existing), encoding="utf-8")
        plan = self.prepare()
        self.assertEqual(len(plan["files"]), 1)
        self.assertEqual(set(plan["merged"]["0005"]["gallery"][0]), {"src", "alt", "verified"})
        self.assertNotIn("preservedGalleryMetadata", plan["audit"]["images"][0])

    def test_kind_and_caption_are_independently_optional(self):
        for extra in [{"kind": "profile-detail"}, {"caption": "Vista del envase."}, {"researchKind": "manufacturer-packshot"}]:
            with self.subTest(extra=extra):
                self.write_manifest([{**self.record, **extra}])
                gallery = self.prepare()["merged"]["0005"]["gallery"][0]
                self.assertEqual(gallery, {
                    "src": "/products/whatsapp/0005-1.webp", "alt": self.record["alt"], "verified": True,
                    **{key: value for key, value in extra.items() if key in {"kind", "caption"}},
                })

    def test_unknown_or_malformed_image_kinds_are_rejected_before_any_write(self):
        before = self.enrichment_path.read_bytes()
        for kind in ["unknown-render", "product-illustration", "manufacturer-render ", "", None, False, 1, [], {}]:
            with self.subTest(kind=kind):
                self.write_manifest([{**self.record, "kind": kind}])
                with self.assertRaisesRegex(ValueError, "unsupported image kind"):
                    self.prepare()
                self.assertEqual(self.enrichment_path.read_bytes(), before)
                self.assertEqual(self.catalog_path.read_bytes(), self.catalog_bytes)
                self.assertFalse((self.repo / "public").exists())

    def test_empty_or_nonstring_captions_are_rejected_before_any_write(self):
        before = self.enrichment_path.read_bytes()
        for caption in ["", " \n\t ", None, False, 1, [], {}]:
            with self.subTest(caption=caption):
                self.write_manifest([{**self.record, "caption": caption}])
                with self.assertRaisesRegex(ValueError, "caption must be a nonempty string"):
                    self.prepare()
                self.assertEqual(self.enrichment_path.read_bytes(), before)
                self.assertFalse((self.repo / "public").exists())

    def test_extraction_details_and_source_evidence_remain_only_in_private_audit(self):
        evidence = {
            "sourcePage": "https://manufacturer.example/catalog.pdf",
            "imageUrl": "https://manufacturer.example/catalog.pdf#page=10",
            "evidence": "Exact model identified in the manufacturer catalog.",
            "exactVariant": True,
            "provenanceDetail": "extract-embedded-image",
            "extractionMethod": "Lossless extraction of original embedded image; no page cropping.",
            "sourcePdfPage": 10,
            "sourcePdfObjectId": "300 0",
            "originalDownloadPath": str(self.private / "catalog.pdf"),
            "sourceEvidence": [{"url": "https://manufacturer.example/product", "claim": "Exact model and finish."}],
            "manufacturerEvidence": "https://manufacturer.example/catalog.pdf#page=10",
            "additionalSources": ["https://supplier.example/product"],
            "licenseStatus": "No express open license verified.",
            "visualReview": "Original inspected.",
            "parentVisualReview": "Approved source and exact variant.",
            "researchKind": "manufacturer-reference",
        }
        self.write_manifest([{**self.record, **evidence, "kind": "supplier-render", "caption": "Vista de referencia del modelo."}])
        plan = self.prepare()
        importer.apply_import(plan)
        audit = json.loads(plan["auditPath"].read_text(encoding="utf-8"))
        for key, value in evidence.items():
            with self.subTest(key=key):
                self.assertEqual(audit["images"][0][key], value)
        public_text = self.enrichment_path.read_text(encoding="utf-8")
        gallery = json.loads(public_text)["0005"]["gallery"][0]
        self.assertEqual(set(gallery), {"src", "alt", "verified", "kind", "caption"})
        self.assertNotIn(str(self.private), public_text)
        self.assertNotIn("https://", public_text)
        self.assertFalse(plan["auditPath"].is_relative_to(self.repo))

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
        official_record = {
            **self.record, "provenance": "download-original",
            "sourcePage": "https://manufacturer.example/product/exact-model", "evidence": "Exact model and finish",
            "kind": "component-detail", "caption": "Vista de un componente; no incluye el mueble.",
        }
        self.write_manifest([official_record, official_record])
        plan = importer.prepare_import(self.repo, self.manifest, "official", True)
        importer.apply_import(plan)
        merged = json.loads(self.enrichment_path.read_text(encoding="utf8"))
        self.assertEqual(merged["0005"]["gallery"], [{
            "src": "/products/official/0005-1.webp", "alt": self.record["alt"], "verified": True,
            "kind": official_record["kind"], "caption": official_record["caption"],
        }])
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
