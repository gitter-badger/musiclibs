import uuid
from django.db import models
from django.dispatch import receiver
from django.db.models.signals import post_delete


class Manifest(models.Model):
    """Generic model to backup imported manifests in a database"""
    id = models.UUIDField(default=uuid.uuid4, primary_key=True)
    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
    remote_url = models.TextField()

    class Meta:
        ordering = ('created',)
        app_label = 'misirlou'

    def get_absolute_url(self):
        from django.core.urlresolvers import reverse
        return reverse('manifest-detail', args=[str(self.id)])

    def re_index(self, commit=True):
        import misirlou.tasks as tasks
        text_id = str(self.id)
        tasks.create_manifest.apply_async(args=[self.remote_url, text_id, commit],
                                          task_id=text_id)


@receiver(post_delete, sender=Manifest)
def solr_delete(sender, instance, **kwargs):
    import scorched
    from django.conf import settings
    solr_conn = scorched.SolrInterface(settings.SOLR_SERVER)
    response = solr_conn.query(id=instance.id).execute()
    if response.result.docs:
        solr_conn.delete_by_ids([x['id'] for x in response.result.docs])
        if kwargs.get("commit", True):
            solr_conn.commit()
