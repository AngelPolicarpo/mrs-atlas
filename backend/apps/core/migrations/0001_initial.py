# Generated manually for core models

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name='Nacionalidade',
            fields=[
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('id', models.UUIDField(db_column='id_nacionalidade', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, unique=True, verbose_name='Nome')),
                ('codigo_iso', models.CharField(blank=True, max_length=3, null=True, unique=True, verbose_name='Código ISO')),
            ],
            options={
                'verbose_name': 'Nacionalidade',
                'verbose_name_plural': 'Nacionalidades',
                'db_table': 'nacionalidade',
                'ordering': ['nome'],
            },
        ),
        migrations.CreateModel(
            name='AmparoLegal',
            fields=[
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('id', models.UUIDField(db_column='id_amparo', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=100, unique=True, verbose_name='Nome')),
                ('descricao', models.TextField(blank=True, null=True, verbose_name='Descrição')),
            ],
            options={
                'verbose_name': 'Amparo Legal',
                'verbose_name_plural': 'Amparos Legais',
                'db_table': 'amparo_legal',
                'ordering': ['nome'],
            },
        ),
        migrations.CreateModel(
            name='Consulado',
            fields=[
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('id', models.UUIDField(db_column='id_consulado', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('pais', models.CharField(max_length=100, unique=True, verbose_name='País')),
            ],
            options={
                'verbose_name': 'Consulado',
                'verbose_name_plural': 'Consulados',
                'db_table': 'consulado',
                'ordering': ['pais'],
            },
        ),
        migrations.CreateModel(
            name='TipoAtualizacao',
            fields=[
                ('ativo', models.BooleanField(default=True, verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('id', models.UUIDField(db_column='id_tipo_atualizacao', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=50, unique=True, verbose_name='Nome')),
                ('descricao', models.TextField(blank=True, null=True, verbose_name='Descrição')),
            ],
            options={
                'verbose_name': 'Tipo de Atualização',
                'verbose_name_plural': 'Tipos de Atualização',
                'db_table': 'tipo_atualizacao',
                'ordering': ['nome'],
            },
        ),
    ]
