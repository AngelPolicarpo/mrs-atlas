# Generated manually for empresa models

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Empresa',
            fields=[
                ('id', models.UUIDField(db_column='id_empresa', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200, verbose_name='Nome')),
                ('cnpj', models.CharField(blank=True, max_length=18, null=True, unique=True, verbose_name='CNPJ')),
                ('email', models.EmailField(blank=True, max_length=254, null=True, verbose_name='E-mail')),
                ('telefone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Telefone')),
                ('endereco', models.TextField(blank=True, null=True, verbose_name='Endereço')),
                ('status', models.BooleanField(default=True, verbose_name='Status')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('criado_por', models.ForeignKey(blank=True, db_column='criado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='empresas_criadas', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('atualizado_por', models.ForeignKey(blank=True, db_column='atualizado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='empresas_atualizadas', to=settings.AUTH_USER_MODEL, verbose_name='Atualizado por')),
            ],
            options={
                'verbose_name': 'Empresa',
                'verbose_name_plural': 'Empresas',
                'db_table': 'empresa',
                'ordering': ['nome'],
            },
        ),
    ]
