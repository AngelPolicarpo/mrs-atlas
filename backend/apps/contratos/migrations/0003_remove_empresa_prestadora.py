# Generated migration to remove empresa_prestadora field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('contratos', '0002_remove_quantidade_from_contratoservico'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='contrato',
            name='empresa_prestadora',
        ),
    ]
