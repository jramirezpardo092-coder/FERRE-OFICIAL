"""Import manually approved, local product images without changing catalog data.

Requires existing Pillow with WebP support (the bundled Codex Python has it).
Manifest: a private JSON array of {sku: string, sourcePath: string, alt: string,
provenance?: "capture-rendered" | "download-original" | "unspecified",
kind?: supported ProductImage kind or research photo label, caption?: string}.
Supported kinds: manufacturer-render, supplier-render, technical-diagram,
profile-detail, component-detail, pair-detail. manufacturer-packshot and
manufacturer-marketing-image normalize to ordinary images without a kind.
Captions, when supplied, must be nonempty. Other kind values are rejected.
Additive reruns retain omitted kind/caption metadata from an approved gallery
entry only when reusing its exact image bytes. Explicit values take precedence;
a research photo kind explicitly removes an existing kind without clearing an
omitted caption. --replace-gallery rebuilds metadata solely from the manifest.
Relative source paths resolve from the manifest directory. Keep the manifest
outside the repository. Its mapping is authoritative; no SKU/model is inferred.
Default is dry-run. --write publishes lossless WebP files and merges gallery,
then writes a private audit beside the manifest. Photos keep their dimensions;
there is no crop, resize, generative edit, or claim that a screenshot is original.
Use --collection official for manufacturer assets. --replace-gallery replaces
only the galleries of SKUs present in the approved manifest, preserving specs.
"""

import argparse
import copy
import hashlib
import io
import json
import os
import re
import tempfile
from pathlib import Path


PRODUCT_IMAGE_KINDS = frozenset({
    "manufacturer-render", "supplier-render", "technical-diagram",
    "profile-detail", "component-detail", "pair-detail",
})
RESEARCH_PHOTO_KINDS = frozenset({"manufacturer-packshot", "manufacturer-marketing-image"})
PRIVATE_EVIDENCE_FIELDS = (
    "sourcePage", "imageUrl", "evidence", "exactVariant", "sourceEvidence",
    "manufacturerEvidence", "additionalSources", "provenanceDetail", "extractionMethod",
    "sourcePdfPage", "sourcePdfObjectId", "originalDownloadPath", "licenseStatus",
    "researchKind", "visualReview", "parentVisualReview", "kind", "caption",
)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"Duplicate JSON key: {key}")
        result[key] = value
    return result


def read_json(path):
    data = path.read_bytes()
    return json.loads(data.decode("utf-8-sig"), object_pairs_hook=unique_object), data


def encode_photo(data):
    try:
        from PIL import Image, ImageCms, ImageOps, features
    except ImportError as error:
        raise ValueError("Use an existing Python runtime with Pillow and WebP support; no packages are installed by this script.") from error
    if not features.check("webp"):
        raise ValueError("This Pillow runtime has no WebP encoder.")
    with Image.open(io.BytesIO(data)) as source:
        if source.format not in {"JPEG", "PNG", "WEBP"} or getattr(source, "n_frames", 1) != 1:
            raise ValueError("Only a single JPEG, PNG or WebP photograph is supported.")
        source_format = source.format
        profile = source.info.get("icc_profile", b"")
        image = ImageOps.exif_transpose(source)
        if image.mode == "CMYK":
            if not profile:
                raise ValueError("CMYK photograph needs its color profile; refusing to guess colors.")
            srgb = ImageCms.createProfile("sRGB")
            image = ImageCms.profileToProfile(image, ImageCms.ImageCmsProfile(io.BytesIO(profile)), srgb, outputMode="RGB")
            profile = ImageCms.ImageCmsProfile(srgb).tobytes()
        elif image.mode not in {"RGB", "RGBA", "L", "LA", "P"}:
            raise ValueError(f"Unsupported image mode: {image.mode}")
        elif image.mode not in {"RGB", "RGBA"}:
            image = image.convert("RGBA" if "A" in image.mode or "transparency" in image.info else "RGB")
        output = io.BytesIO()
        # Preserve the actual photo and color profile; omit EXIF/XMP metadata.
        image.save(output, format="WEBP", lossless=True, exact=True, method=6, icc_profile=profile)
        return output.getvalue(), image.size, source_format, Image.__version__


def prepare_import(repo_root, manifest_path, collection="whatsapp", replace_gallery=False):
    if collection not in {"whatsapp", "official"}:
        raise ValueError("Collection must be whatsapp or official.")
    repo_root = Path(repo_root).resolve()
    manifest_path = Path(manifest_path).resolve(strict=True)
    if manifest_path.is_relative_to(repo_root):
        raise ValueError("Keep the private source manifest outside the repository.")
    catalog_path = repo_root / "src/data/products.json"
    enrichment_path = repo_root / "src/data/product-enrichment.json"
    catalog, catalog_bytes = read_json(catalog_path)
    enrichment, enrichment_bytes = read_json(enrichment_path)
    records, manifest_bytes = read_json(manifest_path)
    if not isinstance(catalog, list) or not isinstance(enrichment, dict):
        raise ValueError("Catalog must be an array and enrichment must be a SKU-keyed object.")
    ids = [product.get("id") for product in catalog if isinstance(product, dict)]
    if len(ids) != len(catalog) or any(not isinstance(sku, str) for sku in ids) or len(set(ids)) != len(ids):
        raise ValueError("Catalog SKUs must be unique strings.")
    if not isinstance(records, list) or not records:
        raise ValueError("Manifest must be a nonempty array of approved image records.")
    known_skus = set(ids)
    output_dir = (repo_root / "public/products" / collection).resolve()
    if not output_dir.is_relative_to(repo_root / "public"):
        raise ValueError("Image output directory must remain inside this repository's public directory.")
    merged = copy.deepcopy(enrichment)
    files, inventory, audit_rows, verified_files = {}, {}, [], {}
    replaced_skus = set()

    for number, record in enumerate(records, 1):
        if not isinstance(record, dict):
            raise ValueError(f"Manifest row {number} is not an object.")
        sku, source_path, alt = (record.get(key) for key in ("sku", "sourcePath", "alt"))
        if not isinstance(sku, str) or sku not in known_skus:
            raise ValueError(f"Row {number}: SKU must match the catalog exactly, including leading zeros.")
        if not re.fullmatch(r"[A-Za-z0-9_-]+", sku):
            raise ValueError(f"Row {number}: SKU cannot safely become a filename without changing its code.")
        if not isinstance(alt, str) or not alt.strip():
            raise ValueError(f"Row {number}: a nonempty description of the approved photograph is required.")
        if not isinstance(source_path, str) or not source_path.strip() or source_path.lower().startswith(("blob:", "http:", "https:", "data:", "file:", "//", "\\\\")):
            raise ValueError(f"Row {number}: sourcePath must identify a downloaded/captured local file.")
        provenance = record.get("provenance", "unspecified")
        if not isinstance(provenance, str) or provenance not in {"capture-rendered", "download-original", "unspecified"}:
            raise ValueError(f"Row {number}: unsupported provenance value.")
        kind = record.get("kind")
        if "kind" in record and (not isinstance(kind, str) or kind not in PRODUCT_IMAGE_KINDS | RESEARCH_PHOTO_KINDS):
            raise ValueError(f"Row {number}: unsupported image kind; refusing to treat an unrecognized image type as a photograph.")
        caption = record.get("caption")
        if "caption" in record and (not isinstance(caption, str) or not caption.strip()):
            raise ValueError(f"Row {number}: caption must be a nonempty string when supplied.")
        source_path = Path(source_path).expanduser()
        if not source_path.is_absolute():
            source_path = manifest_path.parent / source_path
        source_path = source_path.resolve(strict=True)
        if not source_path.is_file():
            raise ValueError(f"Row {number}: sourcePath is not a file.")
        source_bytes = source_path.read_bytes()
        encoded, size, source_format, pillow_version = encode_photo(source_bytes)
        digest = sha(encoded)

        if sku not in inventory:
            matches = []
            for existing in output_dir.glob(f"{sku}-*.webp"):
                match = re.fullmatch(rf"{re.escape(sku)}-(\d+)\.webp", existing.name)
                if not match:
                    continue
                if not existing.resolve().is_relative_to(output_dir) or not existing.is_file():
                    raise ValueError("Existing generated photo points outside the output directory.")
                matches.append((int(match.group(1)), existing))
            matches.sort(key=lambda pair: pair[0])
            by_hash = {}
            for _, existing in matches:
                by_hash.setdefault(sha(existing.read_bytes()), existing)
            inventory[sku] = {"by_hash": by_hash, "next": max((slot for slot, _ in matches), default=0) + 1}
        state = inventory[sku]
        target = state["by_hash"].get(digest)
        if target is None:
            target = output_dir / f"{sku}-{state['next']}.webp"
            state["next"] += 1
            state["by_hash"][digest] = target
            files[target] = encoded
        public_src = f"/products/{collection}/{target.name}"
        verified_files[target] = digest
        entry = merged.setdefault(sku, {})
        if not isinstance(entry, dict) or not isinstance(entry.get("gallery", []), list):
            raise ValueError(f"Existing enrichment/gallery for {sku} is malformed; review it before merging.")
        if replace_gallery and sku not in replaced_skus:
            entry["gallery"] = []
            replaced_skus.add(sku)
        gallery = entry.setdefault("gallery", [])
        found = next((index for index, item in enumerate(gallery) if isinstance(item, dict) and isinstance(item.get("src"), str) and item["src"].lstrip("/") == public_src.lstrip("/")), None)
        preserved_metadata = {}
        if not replace_gallery and target not in files and found is not None and gallery[found].get("verified") is True:
            # Legacy manifests predate the manual approval of some image caveats.
            # Retain only valid public metadata from the identical reused image.
            previous = gallery[found]
            previous_kind = previous.get("kind")
            previous_caption = previous.get("caption")
            if "kind" not in record and isinstance(previous_kind, str) and previous_kind in PRODUCT_IMAGE_KINDS:
                preserved_metadata["kind"] = previous_kind
            if "caption" not in record and isinstance(previous_caption, str) and previous_caption.strip():
                preserved_metadata["caption"] = previous_caption.strip()
        approved = {"src": public_src, "alt": alt.strip(), "verified": True}
        approved.update(preserved_metadata)
        if kind in PRODUCT_IMAGE_KINDS:
            approved["kind"] = kind
        if caption is not None:
            approved["caption"] = caption.strip()
        if found is None:
            gallery.append(approved)
        else:
            gallery[found] = approved
        audit_rows.append({
            "sku": sku, "sourcePath": str(source_path), "sourceSha256": sha(source_bytes),
            "sourceFormat": source_format, "provenance": provenance, "publicSrc": public_src,
            "webpSha256": digest, "webpBytes": len(encoded), "width": size[0], "height": size[1],
            "encoding": "WebP lossless", "pillowVersion": pillow_version, "resized": False, "cropped": False,
            # Research evidence stays in the private audit, never in the public product DTO.
            **{key: record[key] for key in PRIVATE_EVIDENCE_FIELDS if key in record},
            **({"preservedGalleryMetadata": preserved_metadata} if preserved_metadata else {}),
        })

    return {
        "catalogPath": catalog_path, "catalogBytes": catalog_bytes,
        "enrichmentPath": enrichment_path, "enrichmentBytes": enrichment_bytes,
        "merged": merged, "files": files,
        "reusedFiles": {target: digest for target, digest in verified_files.items() if target not in files},
        "auditPath": manifest_path.with_name(f"{manifest_path.stem}.import-audit.json"),
        "audit": {"manifestSha256": sha(manifest_bytes), "catalogSha256": sha(catalog_bytes),
                  "collection": collection, "replacedGalleries": sorted(replaced_skus), "images": audit_rows},
    }


def atomic_write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, prefix=".image-import-", delete=False) as temporary:
        temporary.write(data)
        temporary_path = Path(temporary.name)
    try:
        os.replace(temporary_path, path)
    finally:
        temporary_path.unlink(missing_ok=True)


def apply_import(plan):
    def check_snapshot():
        for name in ("catalog", "enrichment"):
            if plan[f"{name}Path"].read_bytes() != plan[f"{name}Bytes"]:
                raise ValueError("Catalog/enrichment changed after validation; run again to avoid overwriting new work.")
        # A reused path must still contain the approved photograph, not a later replacement.
        for target, digest in plan["reusedFiles"].items():
            if not target.is_file() or sha(target.read_bytes()) != digest:
                raise ValueError("A previously imported photo changed after validation; run again before reusing it.")
    check_snapshot()
    for target, encoded in plan["files"].items():
        if target.exists():
            if target.read_bytes() != encoded:
                raise ValueError("A destination photo changed after validation; refusing to overwrite it.")
        else:
            atomic_write(target, encoded)
    check_snapshot()
    # Only enrichment.gallery is changed; products.json is never written.
    atomic_write(plan["enrichmentPath"], (json.dumps(plan["merged"], ensure_ascii=False, indent=2) + "\n").encode("utf-8"))
    atomic_write(plan["auditPath"], (json.dumps({**plan["audit"], "applied": True}, ensure_ascii=False, indent=2) + "\n").encode("utf-8"))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", required=True, type=Path, help="Private JSON manifest outside the repository")
    parser.add_argument("--repo-root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--write", action="store_true", help="Publish prepared WebP files and merge gallery; otherwise read-only dry-run")
    parser.add_argument("--collection", choices=("whatsapp", "official"), default="whatsapp")
    parser.add_argument("--replace-gallery", action="store_true", help="Replace galleries and image metadata for manifest SKUs only, keeping specifications; omitted kind/caption are not inherited")
    args = parser.parse_args()
    try:
        plan = prepare_import(args.repo_root, args.manifest, args.collection, args.replace_gallery)
        if args.write:
            apply_import(plan)
    except (ValueError, OSError) as error:
        parser.error(str(error))
    print(json.dumps({
        "dryRun": not args.write, "newFiles": len(plan["files"]),
        "images": [{key: row[key] for key in ("sku", "publicSrc", "provenance", "width", "height", "webpBytes")} for row in plan["audit"]["images"]],
        "privateAudit": str(plan["auditPath"]) if args.write else None,
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
