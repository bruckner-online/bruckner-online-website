"""Failure-path tests: python3 -m unittest discover -s src/scripts/edition."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import generate


class GenerationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.stage = Path(self.temporary.name)
        self.edition = self.stage / 'src/edition'
        source = self.stage / 'src/data/editions/a.xml'
        source.parent.mkdir(parents=True)
        source.write_text(f'<TEI xmlns="{generate.TEI[1:-1]}"><idno type="Bruckner_Kopisten">id1</idno></TEI>')
        files = ['a.html', 'facs/id1.html', 'toc.html']
        files += [f'meta/{name}.html' for name in ('about', 'introduction', 'userguide',
                  'methodology', 'authors_note', 'Tabelle_1', 'Tabelle_2', 'Tabelle_3', 'Tabelle_4',
                  'Tabelle_5')]
        for name in files:
            path = self.edition / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('<div>content</div>')
        (self.edition / 'meta/edition_file_mappings.properties').write_text('a.xml=id1\n')
        self.entry = dict(id='id1', filename='a', title='A', copyist_name='A')
        self.index([self.entry])
        for number in range(1, 6):
            path = self.stage / f'src/data/meta/Tabelle_{number}.xml'
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('<TEI/>')

    def index(self, entries):
        (self.edition / 'edition_index.json').write_text(json.dumps(entries))

    def test_valid_contract(self):
        generate.validate(self.stage)

    def test_rejects_missing_facsimile(self):
        (self.edition / 'facs/id1.html').unlink()
        with self.assertRaises(AssertionError):
            generate.validate(self.stage)

    def test_rejects_duplicate_id(self):
        self.index([self.entry, self.entry])
        with self.assertRaises(AssertionError):
            generate.validate(self.stage)

    def test_rejects_stale_output(self):
        (self.edition / 'facs/stale.html').write_text('stale')
        with self.assertRaises(AssertionError):
            generate.validate(self.stage)

    def test_rejects_incorrect_mapping(self):
        (self.edition / 'meta/edition_file_mappings.properties').write_text('a.xml=wrong\n')
        with self.assertRaises(AssertionError):
            generate.validate(self.stage)

    def test_promotion_rolls_back(self):
        root = self.stage / 'workspace'
        for name in ('src/data/editions', 'src/data/meta', 'src/edition'):
            path = root / name
            path.mkdir(parents=True)
            (path / 'original').write_text(name)
        rename = Path.rename

        def fail_on_last(source, target):
            if source == self.edition:
                raise OSError('Simulated promotion failure')
            return rename(source, target)

        with patch.object(generate, 'ROOT', root), patch.object(Path, 'rename', fail_on_last):
            with self.assertRaises(OSError):
                generate.promote(self.stage)
        for name in ('src/data/editions', 'src/data/meta', 'src/edition'):
            self.assertEqual((root / name / 'original').read_text(), name)


if __name__ == '__main__':
    unittest.main()
