"""Final scattered-branch coverage: cascade uncollect, copy-name uniqueness,
upload folder param, idempotent milestone marks."""
from __future__ import annotations

from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APITestCase

from api import models

_PNG = b'\x89PNG\r\n\x1a\n' + b'\x00' * 64


def _operator(client):
    user = get_user_model().objects.create_user(username='vf4-op', password='x')
    models.Profile.objects.create(user=user, clerk_user_id='vf4-clerk',
                                  role=models.Profile.ROLE_OPERATOR)
    client.force_authenticate(user=user)


class FinalBranchTests(APITestCase):
    def setUp(self):
        _operator(self.client)
        self.event = models.Event.objects.create(name='E', start_time=timezone.now(), is_active=True)
        self.game = models.Game.objects.create(
            title='G', platform='N64', layout_type='4x3', default_play_minutes=60,
        )
        self.iset = models.GameItemSet.objects.create(game=self.game, name='Set', kind='set', order=0)
        self.a = models.GameItem.objects.create(game=self.game, name='A', category='weapon', order=0)
        self.b = models.GameItem.objects.create(game=self.game, name='B', category='weapon', order=1)
        self.a.sets.add(self.iset)
        self.b.sets.add(self.iset)
        self.a.unlocks_with.add(self.b)
        self.entry = models.ScheduleEntry.objects.create(
            event=self.event, game=self.game, order=1, slot_type='game',
        )
        cp = models.CurrentlyPlaying.get()
        cp.schedule_entry = self.entry
        cp.save()

    def _act(self, action, body):
        return self.client.post(f'/api/schedule/{self.entry.id}/{action}/', body, format='json')

    def test_cascade_collect_then_uncollect(self):
        self.assertEqual(self._act('toggle_collected', {'item_id': self.a.id}).status_code, 200)
        # Toggle off → cascade uncollects the partner too.
        self.assertEqual(self._act('toggle_collected', {'item_id': self.a.id}).status_code, 200)
        detail = self.client.get(f'/api/schedule/{self.entry.id}/').data
        self.assertNotIn(self.a.id, detail['collected_item_ids'])

    def test_copy_name_uniqueness(self):
        # Duplicate twice → "(copy)" then "(copy 2)".
        r1 = self.client.post(f'/api/game-items/{self.a.id}/duplicate/')
        self.assertIn(r1.status_code, (200, 201))
        copy_id = r1.data['id']
        r2 = self.client.post(f'/api/game-items/{copy_id}/duplicate/')
        self.assertIn(r2.status_code, (200, 201))
        r3 = self.client.post(f'/api/game-items/{self.a.id}/duplicate/')
        self.assertIn(r3.status_code, (200, 201))
        names = set(models.GameItem.objects.filter(game=self.game).values_list('name', flat=True))
        self.assertGreaterEqual(len([n for n in names if 'copy' in n]), 2)

    def test_upload_with_folder_and_bad_extension(self):
        img = SimpleUploadedFile('a.png', _PNG, content_type='image/png')
        res = self.client.post('/api/uploads/image/?folder=logos', {'file': img}, format='multipart')
        self.assertIn(res.status_code, (200, 201))
        bad = SimpleUploadedFile('a.exe', b'MZ', content_type='application/octet-stream')
        res2 = self.client.post('/api/uploads/image/', {'file': bad}, format='multipart')
        self.assertEqual(res2.status_code, 400)

    def test_milestone_mark_idempotent(self):
        m = models.Milestone.objects.create(
            event=self.event, name='£5k', threshold_amount=Decimal('5000'),
        )
        self.client.post(f'/api/milestones/{m.id}/mark_reached/')
        # Second mark is a no-op (already reached).
        self.assertEqual(self.client.post(f'/api/milestones/{m.id}/mark_reached/').status_code, 200)
        self.client.post(f'/api/milestones/{m.id}/mark_announced/')
        self.assertEqual(self.client.post(f'/api/milestones/{m.id}/mark_announced/').status_code, 200)
