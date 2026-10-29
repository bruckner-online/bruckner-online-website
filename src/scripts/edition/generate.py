"""Build an isolated Kopisten artifact and publish only after contract validation."""
import hashlib
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path
from xml.etree import ElementTree

ROOT = Path.cwd()
SCRIPT = Path(__file__).resolve().parent
TEI = '{http://www.tei-c.org/ns/1.0}'


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def inventory(root):
    return {str(p.relative_to(root)): digest(p)
            for p in sorted(root.rglob('*')) if p.is_file()}


def validate(stage, known_duplicates=None):
    edition = stage / 'src/edition'
    sources = sorted((stage / 'src/data/editions').glob('*.xml'))
    assert sources, 'No edition XML files'
    expected = {}
    for source in sources:
        tree = ElementTree.parse(source)
        ids = tree.findall(f'.//{TEI}idno[@type="Bruckner_Kopisten"]')
        assert len(ids) == 1 and ids[0].text, f'Invalid ID in {source.name}'
        expected[source.stem] = ids[0].text
    entries = json.loads((edition / 'edition_index.json').read_text())
    assert isinstance(entries, list) and entries, 'Empty edition index'
    filenames, ids = set(), set()
    for entry in entries:
        assert all(isinstance(entry.get(k), str) and entry[k].strip()
                   for k in ('id', 'filename', 'title', 'copyist_name')), 'Invalid index entry'
        name, identifier = entry['filename'], entry['id']
        assert re.fullmatch(r'[\w-]+', name) and re.fullmatch(r'[\w-]+', identifier), 'Unsafe path'
        assert name not in filenames, 'Duplicate filename'
        assert expected.get(name) == identifier, 'Index/source mismatch'
        filenames.add(name)
        ids.add(identifier)
    assert filenames == set(expected), 'Index does not cover all sources'
    duplicates = {identifier: sorted(name for name, value in expected.items() if value == identifier)
                  for identifier in ids if list(expected.values()).count(identifier) > 1}
    assert duplicates == (known_duplicates or {}), 'Unexpected duplicate source IDs'
    required = {'edition_index.json', 'toc.html', 'meta/edition_file_mappings.properties'}
    required.update(f'{name}.html' for name in filenames)
    required.update(f'facs/{identifier}.html' for identifier in ids)
    required.update(f'meta/{name}.html' for name in (
        'about', 'introduction', 'userguide', 'methodology', 'authors_note',
        'Tabelle_1', 'Tabelle_2', 'Tabelle_3', 'Tabelle_4', 'Tabelle_5'))
    actual = set(inventory(edition))
    assert actual == required, f'Output contract mismatch: missing={required-actual}, extra={actual-required}'
    for name in required:
        assert (edition / name).read_text().strip(), f'Empty output: {name}'
    mappings = (edition / 'meta/edition_file_mappings.properties').read_text().splitlines()
    assert len(mappings) == len(expected), 'Invalid mapping count'
    assert dict(line.split('=', 1) for line in mappings) == {
        f'{name}.xml': identifier for name, identifier in expected.items()
    }, 'Invalid facsimile mappings'
    for number in range(1, 6):
        ElementTree.parse(stage / f'src/data/meta/Tabelle_{number}.xml')


def promote(stage):
    # Same-filesystem renames; roll back all prior replacements on failure.
    paths = ['src/data/editions', 'src/data/meta', 'src/edition']
    moved, installed = [], []
    try:
        for name in paths:
            destination = ROOT / name
            backup = stage / 'backup' / name
            backup.parent.mkdir(parents=True, exist_ok=True)
            destination.parent.mkdir(parents=True, exist_ok=True)
            if destination.exists():
                destination.rename(backup)
                moved.append((backup, destination))
            (stage / name).rename(destination)
            installed.append(destination)
    except BaseException:
        for destination in reversed(installed):
            shutil.rmtree(destination)
        for backup, destination in reversed(moved):
            backup.rename(destination)
        raise


def main():
    lock = json.loads((SCRIPT / 'source.json').read_text())
    assert re.fullmatch('[0-9a-f]{40}', lock['revision']), 'Source must be a full commit SHA'
    assert re.fullmatch('[0-9a-f]{64}', lock['archiveSha256']), 'Invalid archive checksum'
    url = f"{lock['repository']}/archive/{lock['revision']}.tar.gz"
    with tempfile.TemporaryDirectory(prefix='.edition-stage-', dir=ROOT) as temporary:
        stage = Path(temporary)
        archive = stage / 'source.tar.gz'
        subprocess.run(['curl', '-fL', '--retry', '3', url, '-o', str(archive)], check=True)
        assert digest(archive) == lock['archiveSha256'], 'Source archive checksum mismatch'
        with tarfile.open(archive) as tar:
            for member in tar.getmembers():
                path = Path(member.name)
                assert not path.is_absolute() and '..' not in path.parts, 'Unsafe archive path'
                assert member.isfile() or member.isdir(), 'Unsupported archive member'
            tar.extractall(stage / 'download')
        source = stage / 'download' / f"bruckner-kopisten-data-{lock['revision']}" / 'data'
        for name in ('editions', 'meta'):
            destination = stage / 'src/data' / name
            destination.mkdir(parents=True)
            for xml in sorted((source / name).glob('*.xml')):
                ElementTree.parse(xml)
                shutil.copyfile(xml, destination / xml.name)
        source_hashes = inventory(stage / 'src/data')
        shutil.copytree(ROOT / 'src/scripts', stage / 'src/scripts',
                        ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
        (stage / 'saxon').mkdir()
        shutil.copyfile('/opt/saxon/saxon9he.jar', stage / 'saxon/saxon9he.jar')
        subprocess.run(['ant', '-f', 'src/scripts/ant/build.xml',
                        f"-Dartifact-date={lock['date']}"], cwd=stage, check=True)
        validate(stage, lock.get('knownDuplicateIds'))
        provenance = {
            'schemaVersion': 1, 'source': dict(lock, archiveUrl=url),
            'sourceFiles': source_hashes,
            'generatorFiles': inventory(stage / 'src/scripts'),
            'tools': {'saxon9he.jar': digest(Path('/opt/saxon/saxon9he.jar')),
                      'ant-contrib.jar': digest(Path('/usr/share/ant/lib/ant-contrib-1.0b3.jar')),
                      'java': subprocess.check_output(['java', '-version'], stderr=subprocess.STDOUT, text=True).strip(),
                      'ant': subprocess.check_output(['ant', '-version'], text=True).strip()},
            'artifactFiles': {**{f'src/edition/{k}': v for k, v in inventory(stage / 'src/edition').items()},
                              **{f'src/data/{k}': v for k, v in inventory(stage / 'src/data').items()}},
        }
        (stage / 'src/edition/provenance.json').write_text(
            json.dumps(provenance, indent=2, sort_keys=True) + '\n')
        promote(stage)
        print(f"Published validated Kopisten artifact from {lock['revision']}")


if __name__ == '__main__':
    main()
