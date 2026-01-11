# Generated migration
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('empresa', '0003_cnpj_nullable'),
    ]

    operations = [
        # Adicionar campo contato
        migrations.AddField(
            model_name='empresa',
            name='contato',
            field=models.CharField(
                blank=True,
                max_length=200,
                null=True,
                verbose_name='Contato'
            ),
        ),
        # Adicionar campo controle
        migrations.AddField(
            model_name='empresa',
            name='controle',
            field=models.CharField(
                blank=True,
                max_length=100,
                null=True,
                verbose_name='Controle'
            ),
        ),
    ]
