from __future__ import absolute_import
import uuid
import scorched

from celery import shared_task
from celery import current_app
from celery.signals import after_task_publish
from django.conf import settings
from collections import namedtuple

from .helpers.IIIFImporter import WIPManifest, get_doc

# A named tuple for passing task-results from importing Manifests.
ImportResult = namedtuple('ImportResult', ['status', 'id', 'url', 'errors', 'warnings'])


@shared_task
def import_single_manifest(man_data, remote_url):
    """Import a single manifest.

    :param man_data: Pre-fetched text of data from remote_url
    :param remote_url: Url of manifest.
    :return: ImportResult with all information about the result of this task.
    """
    man = WIPManifest(remote_url, str(uuid.uuid4()), prefetched_data=man_data)
    errors = []
    warnings = []

    try:
        imp_success = man.create()
    except Exception as e:
        imp_success = False
        errors.append(str(e))

    if imp_success:
        warnings.extend(man.warnings)
        status = settings.SUCCESS
    else:
        warnings.extend(man.warnings)
        errors.extend(man.errors)
        status = settings.ERROR

    return ImportResult(status, man.id, man.remote_url, errors, warnings)


@shared_task
def get_document(remote_url):
    """Fetch a document remotely and return it's contents."""
    return get_doc(remote_url).text


@shared_task(ignore_result=True)
def commit_solr():
    """Commit changes to the solr server."""
    solr_con = scorched.SolrInterface(settings.SOLR_SERVER)
    solr_con.commit()


@after_task_publish.connect
def update_sent_state(sender=None, body=None, **kwargs):
    # Change task.status to 'SENT' for all tasks which are sent in.
    # This allows one to distinguish between PENDING tasks which have been
    # sent in and tasks which do not exist. State will change to
    # SUCCESS, FAILURE, etc. once the process terminates.
    task = current_app.tasks.get(sender)
    backend = task.backend if task else current_app.backend
    backend.store_result(body['id'], None, "SENT")
