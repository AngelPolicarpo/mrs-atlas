# Generated manually for titulares models

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('accounts', '0001_initial'),
        ('core', '0001_initial'),
        ('empresa', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Titular',
            fields=[
                ('id', models.UUIDField(db_column='id_titular', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200, verbose_name='Nome')),
                ('cpf', models.CharField(blank=True, max_length=14, null=True, unique=True, verbose_name='CPF')),
                ('cnh', models.CharField(blank=True, max_length=14, null=True, unique=True, verbose_name='CNH')),
                ('passaporte', models.CharField(blank=True, max_length=50, null=True, verbose_name='Passaporte')),
                ('rnm', models.CharField(max_length=100, unique=True, verbose_name='RNM')),
                ('sexo', models.CharField(blank=True, choices=[('M', 'Masculino'), ('F', 'Feminino')], max_length=1, null=True, verbose_name='Sexo')),
                ('email', models.EmailField(blank=True, max_length=150, null=True, verbose_name='Email')),
                ('telefone', models.CharField(blank=True, max_length=20, null=True, verbose_name='Telefone')),
                ('pai', models.CharField(blank=True, max_length=200, null=True, verbose_name='Nome do Pai')),
                ('mae', models.CharField(blank=True, max_length=200, null=True, verbose_name='Nome da Mãe')),
                ('data_nascimento', models.DateField(blank=True, null=True, verbose_name='Data de Nascimento')),
                ('data_validade_cnh', models.DateField(blank=True, null=True, verbose_name='Validade da CNH')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('nacionalidade', models.ForeignKey(db_column='id_nacionalidade', on_delete=django.db.models.deletion.PROTECT, related_name='titulares', to='core.nacionalidade', verbose_name='Nacionalidade')),
                ('criado_por', models.ForeignKey(blank=True, db_column='criado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='titulares_criados', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('atualizado_por', models.ForeignKey(blank=True, db_column='atualizado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='titulares_atualizados', to=settings.AUTH_USER_MODEL, verbose_name='Atualizado por')),
            ],
            options={
                'verbose_name': 'Titular',
                'verbose_name_plural': 'Titulares',
                'db_table': 'titular',
                'ordering': ['nome'],
            },
        ),
        migrations.AddIndex(
            model_name='titular',
            index=models.Index(fields=['nome', 'data_nascimento'], name='titular_nome_4e67cb_idx'),
        ),
        migrations.AddIndex(
            model_name='titular',
            index=models.Index(fields=['nacionalidade'], name='titular_id_naci_f8f63c_idx'),
        ),
        migrations.CreateModel(
            name='VinculoTitular',
            fields=[
                ('id', models.UUIDField(db_column='id_vinculo', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('tipo_vinculo', models.CharField(choices=[('EMPRESA', 'Empresa'), ('CONSULADO', 'Consulado'), ('AUTONOMO', 'Autônomo'), ('ESTUDANTE', 'Estudante'), ('OUTRO', 'Outro')], max_length=20, verbose_name='Tipo de Vínculo')),
                ('status', models.BooleanField(default=True, verbose_name='Status')),
                ('data_entrada_pais', models.DateField(blank=True, null=True, verbose_name='Data de Entrada no País')),
                ('data_fim_vinculo', models.DateField(blank=True, null=True, verbose_name='Data Fim do Vínculo')),
                ('observacoes', models.TextField(blank=True, null=True, verbose_name='Observações')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('titular', models.ForeignKey(db_column='id_titular', on_delete=django.db.models.deletion.CASCADE, related_name='vinculos', to='titulares.titular', verbose_name='Titular')),
                ('empresa', models.ForeignKey(blank=True, db_column='id_empresa', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos_titulares', to='empresa.empresa', verbose_name='Empresa')),
                ('amparo', models.ForeignKey(blank=True, db_column='id_amparo', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos', to='core.amparolegal', verbose_name='Amparo Legal')),
                ('consulado', models.ForeignKey(blank=True, db_column='id_consulado', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos', to='core.consulado', verbose_name='Consulado')),
                ('tipo_atualizacao', models.ForeignKey(blank=True, db_column='id_tipo_atualizacao', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos', to='core.tipoatualizacao', verbose_name='Tipo de Atualização')),
                ('criado_por', models.ForeignKey(blank=True, db_column='criado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos_criados', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('atualizado_por', models.ForeignKey(blank=True, db_column='atualizado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vinculos_atualizados', to=settings.AUTH_USER_MODEL, verbose_name='Atualizado por')),
            ],
            options={
                'verbose_name': 'Vínculo do Titular',
                'verbose_name_plural': 'Vínculos dos Titulares',
                'db_table': 'vinculo_titular',
                'ordering': ['-data_criacao'],
            },
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['titular'], name='vinculo_tit_id_titu_a3f9ce_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['tipo_vinculo'], name='vinculo_tit_tipo_vi_d0dbdd_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['status'], name='vinculo_tit_status_cfe56e_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['empresa'], name='vinculo_tit_id_empr_e8de7e_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['data_fim_vinculo'], name='vinculo_tit_data_fi_e22556_idx'),
        ),
        migrations.CreateModel(
            name='Dependente',
            fields=[
                ('id', models.UUIDField(db_column='id_dependente', default=uuid.uuid4, editable=False, primary_key=True, serialize=False, verbose_name='ID')),
                ('nome', models.CharField(max_length=200, verbose_name='Nome')),
                ('passaporte', models.CharField(blank=True, max_length=50, null=True, verbose_name='Passaporte')),
                ('rnm', models.CharField(blank=True, max_length=100, null=True, unique=True, verbose_name='RNM')),
                ('tipo_dependente', models.CharField(blank=True, choices=[('CONJUGE', 'Cônjuge'), ('FILHO', 'Filho(a)'), ('ENTEADO', 'Enteado(a)'), ('PAI_MAE', 'Pai/Mãe'), ('OUTRO', 'Outro')], max_length=50, null=True, verbose_name='Tipo de Dependente')),
                ('sexo', models.CharField(blank=True, choices=[('M', 'Masculino'), ('F', 'Feminino')], max_length=1, null=True, verbose_name='Sexo')),
                ('data_nascimento', models.DateField(blank=True, null=True, verbose_name='Data de Nascimento')),
                ('pai', models.CharField(blank=True, max_length=200, null=True, verbose_name='Nome do Pai')),
                ('mae', models.CharField(blank=True, max_length=200, null=True, verbose_name='Nome da Mãe')),
                ('data_criacao', models.DateTimeField(auto_now_add=True, verbose_name='Data Criação')),
                ('ultima_atualizacao', models.DateTimeField(auto_now=True, verbose_name='Última Atualização')),
                ('titular', models.ForeignKey(db_column='id_titular', on_delete=django.db.models.deletion.CASCADE, related_name='dependentes', to='titulares.titular', verbose_name='Titular')),
                ('nacionalidade', models.ForeignKey(blank=True, db_column='id_nacionalidade', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dependentes', to='core.nacionalidade', verbose_name='Nacionalidade')),
                ('criado_por', models.ForeignKey(blank=True, db_column='criado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dependentes_criados', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('atualizado_por', models.ForeignKey(blank=True, db_column='atualizado_por', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='dependentes_atualizados', to=settings.AUTH_USER_MODEL, verbose_name='Atualizado por')),
            ],
            options={
                'verbose_name': 'Dependente',
                'verbose_name_plural': 'Dependentes',
                'db_table': 'dependente',
                'ordering': ['nome'],
            },
        ),
        migrations.AddIndex(
            model_name='dependente',
            index=models.Index(fields=['titular'], name='dependente_id_titu_a27e31_idx'),
        ),
        migrations.AddIndex(
            model_name='dependente',
            index=models.Index(fields=['passaporte'], name='dependente_passapo_3f14d7_idx'),
        ),
        migrations.AddIndex(
            model_name='dependente',
            index=models.Index(fields=['nacionalidade'], name='dependente_id_naci_30a923_idx'),
        ),
    ]
