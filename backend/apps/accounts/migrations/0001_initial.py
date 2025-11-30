# Generated manually for new User model

import uuid
import django.contrib.auth.validators
import django.db.models.deletion
import simple_history.models
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
    ]

    operations = [
        migrations.CreateModel(
            name='User',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(db_column='id_usuario', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200, verbose_name='Nome')),
                ('email', models.EmailField(error_messages={'unique': 'Um usuário com este email já existe.'}, max_length=150, unique=True, verbose_name='Email')),
                ('is_staff', models.BooleanField(default=False, help_text='Indica se o usuário pode acessar o admin.', verbose_name='Equipe')),
                ('is_active', models.BooleanField(db_column='ativo', default=True, help_text='Indica se o usuário está ativo. Desmarque ao invés de deletar.', verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('groups', models.ManyToManyField(blank=True, help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.', related_name='user_set', related_query_name='user', to='auth.group', verbose_name='groups')),
                ('user_permissions', models.ManyToManyField(blank=True, help_text='Specific permissions for this user.', related_name='user_set', related_query_name='user', to='auth.permission', verbose_name='user permissions')),
            ],
            options={
                'verbose_name': 'Usuário',
                'verbose_name_plural': 'Usuários',
                'db_table': 'usuario',
                'ordering': ['-data_criacao'],
            },
        ),
        migrations.CreateModel(
            name='HistoricalUser',
            fields=[
                ('password', models.CharField(max_length=128, verbose_name='password')),
                ('last_login', models.DateTimeField(blank=True, null=True, verbose_name='last login')),
                ('is_superuser', models.BooleanField(default=False, help_text='Designates that this user has all permissions without explicitly assigning them.', verbose_name='superuser status')),
                ('id', models.UUIDField(db_column='id_usuario', db_index=True, default=uuid.uuid4, editable=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200, verbose_name='Nome')),
                ('email', models.EmailField(db_index=True, error_messages={'unique': 'Um usuário com este email já existe.'}, max_length=150, verbose_name='Email')),
                ('is_staff', models.BooleanField(default=False, help_text='Indica se o usuário pode acessar o admin.', verbose_name='Equipe')),
                ('is_active', models.BooleanField(db_column='ativo', default=True, help_text='Indica se o usuário está ativo. Desmarque ao invés de deletar.', verbose_name='Ativo')),
                ('data_criacao', models.DateTimeField(blank=True, editable=False, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(blank=True, editable=False, verbose_name='Última Atualização')),
                ('history_id', models.AutoField(primary_key=True, serialize=False)),
                ('history_date', models.DateTimeField(db_index=True)),
                ('history_change_reason', models.CharField(max_length=100, null=True)),
                ('history_type', models.CharField(choices=[('+', 'Created'), ('~', 'Changed'), ('-', 'Deleted')], max_length=1)),
                ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'historical Usuário',
                'verbose_name_plural': 'historical Usuários',
                'ordering': ('-history_date', '-history_id'),
                'get_latest_by': ('history_date', 'history_id'),
            },
            bases=(simple_history.models.HistoricalChanges, models.Model),
        ),
    ]
