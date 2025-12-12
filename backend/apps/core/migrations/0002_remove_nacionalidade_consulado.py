# Migration to remove Nacionalidade and Consulado tables

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('titulares', '0013_replace_nacionalidade_consulado_with_text'),
    ]

    operations = [
        # Deletar o modelo Nacionalidade
        migrations.DeleteModel(
            name='Nacionalidade',
        ),
        # Deletar o modelo Consulado
        migrations.DeleteModel(
            name='Consulado',
        ),
    ]
