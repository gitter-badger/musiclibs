from misirlou.helpers.IIIFImporter import ManifestPreImporter
from misirlou.tests.mis_test import MisirlouTestSetup

class PreImporterTestCase(MisirlouTestSetup):
    def test_get_top_manifest(self):
        """ If there are no nested manifests, simply return the top level url."""
        pre_importer = ManifestPreImporter("http://localhost:8888/misirlou/tests/manifest.json")
        url_list = pre_importer.get_all_urls()
        self.assertListEqual(['http://localhost:8888/misirlou/tests/manifest.json'], url_list)

    def test_get_embeded_manifest(self):
        """ Get a manifest embeded in a collection. """
        pre_importer = ManifestPreImporter("http://localhost:8888/misirlou/tests/collection_bottom.json")
        url_list = pre_importer.get_all_urls()
        self.assertListEqual(['http://localhost:8888/misirlou/tests/manifest.json'], url_list)

    def test_get_nested_col(self):
        """ Get only manifest URLs when scarping through nested collections."""
        pre_importer = ManifestPreImporter("http://localhost:8888/misirlou/tests/collection_top.json")
        url_list = pre_importer.get_all_urls()
        self.assertListEqual(['http://localhost:8888/misirlou/tests/manifest.json'], url_list)