import json

import scorched
from urllib.request import urlopen

from django.conf import settings
from misirlou.helpers.validator import Validator
from misirlou.models.manifest import Manifest


class ManifestImportError(Exception):
    pass


class WIPManifest:
    # A class for manifests that are being built
    def __init__(self, remote_url, shared_id):
        self.remote_url = remote_url
        self.id = shared_id
        self.json = {}
        self.meta = []
        self.errors = {'validation': []}
        self.warnings = {}
        self.in_db = False

    def create(self):
        """ Go through the steps of validating and indexing this manifest.
        Return False if error hit, True otherwise."""
        try:
            self.__validate()
            self.__retrieve_json()
            self.__check_db_duplicates()
            self.__solr_index()
        except ManifestImportError:
            return False

        # If check_db_duplicates has found the manifest, if so return now.
        if self.in_db:
            return True

        # otherwise create this manifest in the database.
        try:
            self.__create_db_entry()
        except:
            self.__solr_delete()
            raise
        return True

    def __validate(self):
        """Validate from proper IIIF API formatting"""
        v = Validator(self.remote_url)
        result = v.do_test()
        if result.get('status'):
            self.warnings = result.get('warnings')
            return
        else:
            self.errors = result.get('error')
            raise ManifestImportError

    def __retrieve_json(self):
        """Download and parse json from remote.
        Change remote_url to the manifests @id (which is the
        manifests own description of its URL)"""
        manifest_resp = urlopen(self.remote_url)
        manifest_data = manifest_resp.read().decode('utf-8')
        self.json = json.loads(manifest_data)
        self.remote_url = self.json.get('@id')

    def __check_db_duplicates(self):
        """Check for duplicates in DB. Delete all but 1. Set
        self.id to the existing duplicate."""
        old_entry = Manifest.objects.filter(remote_url=self.remote_url)
        if old_entry.count() > 0:
            temp = old_entry[0]
            for man in old_entry:
                if man != temp:
                    man.delete()
            temp.save()
            self.id = str(temp.id)
            self.in_db = True

    def __solr_index(self):
        """Parse values from manifest and index in solr"""
        solr_con = scorched.SolrInterface(settings.SOLR_SERVER)

        document = {'id': self.id,
                    'type': self.json.get('@type'),
                    'remote_url': self.remote_url,
                    'metadata': []}

        multilang_fields = ["description", "attribution", "label", "date"]
        for field in multilang_fields:
            if not self.json.get(field):
                continue

            value = self.json.get(field)
            if type(value) is not list:
                document[field] = value
                continue

            found_default = False
            for v in value:
                if v.get('@language').lower() == "en":
                    document[field] = v.get('@value')
                    found_default = True
                    continue
                key = field + '_txt_' + v.get('@language')
                document[key] = v.get('@value')
            if not found_default:
                v = value[0]
                document[field] = v.get('@value')

        if self.json.get('metadata'):
            meta = self.json.get('metadata')
        else:
            meta = {}
        for m in meta:
            label = settings.SOLR_MAP.get(m.get('label').lower())
            value = m.get('value')

            """The label is not mapped to a field, and the value is not a list,
            so simply dump the value into the metadata field"""
            if not label and type(value) is not list:
                document['metadata'].append(m.get('value'))

            """The label is unknown, but the value has multiple languages.
            Dump the english into metadata, create separate language metadata
            fields for the non-english metadata"""
            if not label and type(value) is list:
                for v in value:
                    if v.get('@language').lower() == "en":
                        document['metadata'].append(m.get('value'))
                    else:
                        key = 'metadata_txt_' + v.get('@language').lower()
                        if not document[key]:
                            document[key] = []
                        document[key].append(v.get('@value'))

            """If the label is known, and the value is not a list, simply
            add the value to the document with its label"""
            if label and type(value) is not list:
                    document[label] = value

            """The label is known and the value is a list, add the
            multilang labels and attempt to set english as default, or
            set the first value as default."""
            if label and type(value) is list:
                found_default = False
                for v in value:
                    if v.get('@language').lower() == "en":
                        document[label] = v.get('@value')
                        found_default = True
                        continue

                    document[label + "_txt_" + v.get('@language')] \
                        = v.get('@value')
                if not found_default:
                    v = value[0]
                    document[label] = v.get('@value')

        document['manifest'] = json.dumps(self.json)
        solr_con.add(document)
        solr_con.commit()

    def __solr_delete(self):
        """ Delete document of self from solr"""
        solr_con = scorched.SolrInterface(settings.SOLR_SERVER)
        solr_con.delete_by_ids([self.id])
        solr_con.commit()

    def __create_db_entry(self):
        """Create new DB entry with given id"""
        manifest = Manifest(remote_url=self.remote_url, id=self.id)
        manifest.save()
