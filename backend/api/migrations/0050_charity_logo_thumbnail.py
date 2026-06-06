from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0049_charity'),
    ]

    operations = [
        migrations.AddField(
            model_name='charity',
            name='logo_thumbnail_url',
            field=models.CharField(
                blank=True,
                max_length=500,
                help_text='Square (or near-square) thumbnail for compact UI — '
                          'omnibar charity-cluster pills, control-panel table '
                          'rows, donation cards. Falls back to `logo_url` '
                          'rendered with `object-fit: contain` when blank, '
                          'which can look awkward for wide wordmarks, so '
                          'setting this is recommended for any charity whose '
                          'main logo is not roughly square. Absolute URL or '
                          'site-relative path.',
            ),
        ),
        # Help-text refresh — `logo_url` previously claimed to be
        # square. We now treat it as the official mark in whatever
        # shape the charity ships (wordmark, roundel, etc.). Squashed
        # into this migration so the operator runs a single
        # `manage.py migrate` for the thumbnail change.
        migrations.AlterField(
            model_name='charity',
            name='logo_url',
            field=models.CharField(
                blank=True,
                max_length=500,
                help_text='Official charity logo — whatever aspect ratio the '
                          'charity ships (often a wide wordmark, e.g. '
                          'specialeffect-logo.svg). Used in the /charity page '
                          'header and on the /donations side panel where there '
                          'is room for a full mark. Absolute URL or '
                          'site-relative path.',
            ),
        ),
    ]
