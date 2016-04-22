from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic

import datetime


class Comment(models.Model):
	user = models.ForeignKey(User, related_name='comments')
	content_type = models.ForeignKey(ContentType)
	object_id = models.PositiveIntegerField()
	commentable = generic.GenericForeignKey('content_type', 'object_id')

	body = models.TextField()
	created_at = models.DateTimeField()
	updated_at = models.DateTimeField()

	def save(self, *args, **kwargs):
		self.updated_at = datetime.datetime.now()
		if self.created_at is None:
			self.created_at = self.updated_at

		super(Comment, self).save(*args, **kwargs)

	def get_absolute_url(self):
		return self.commentable.get_absolute_url() + ('#comment-%d' % self.id)


class Commentable(models.Model):
	comments = generic.GenericRelation(Comment)

	def get_comments(self):
		return self.comments.select_related('user').order_by('created_at')

	class Meta:
		abstract = True
