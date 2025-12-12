# Generated migration to replace FK nacionalidade/consulado with text fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('titulares', '0012_alter_dependente_sexo_alter_titular_sexo'),
    ]

    operations = [
        # 1. Adicionar novas colunas de texto
        migrations.AddField(
            model_name='titular',
            name='nacionalidade_temp',
            field=models.CharField('Nacionalidade', max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='dependente',
            name='nacionalidade_temp',
            field=models.CharField('Nacionalidade', max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='vinculotitular',
            name='consulado_temp',
            field=models.CharField('Consulado', max_length=100, blank=True, null=True),
        ),
        migrations.AddField(
            model_name='vinculodependente',
            name='consulado_temp',
            field=models.CharField('Consulado', max_length=100, blank=True, null=True),
        ),

        # 2. Copiar dados das FKs para as novas colunas (raw SQL)
        migrations.RunSQL(
            sql="""
                UPDATE titular SET nacionalidade_temp = UPPER((SELECT nome FROM nacionalidade WHERE nacionalidade.id_nacionalidade = titular.id_nacionalidade)) WHERE id_nacionalidade IS NOT NULL;
                UPDATE dependente SET nacionalidade_temp = UPPER((SELECT nome FROM nacionalidade WHERE nacionalidade.id_nacionalidade = dependente.id_nacionalidade)) WHERE id_nacionalidade IS NOT NULL;
                UPDATE vinculo_titular SET consulado_temp = UPPER((SELECT pais FROM consulado WHERE consulado.id_consulado = vinculo_titular.id_consulado)) WHERE id_consulado IS NOT NULL;
                UPDATE vinculo_dependente SET consulado_temp = UPPER((SELECT pais FROM consulado WHERE consulado.id_consulado = vinculo_dependente.id_consulado)) WHERE id_consulado IS NOT NULL;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # 3. Remover colunas FK antigas
        migrations.RemoveField(
            model_name='titular',
            name='nacionalidade',
        ),
        migrations.RemoveField(
            model_name='dependente',
            name='nacionalidade',
        ),
        migrations.RemoveField(
            model_name='vinculotitular',
            name='consulado',
        ),
        migrations.RemoveField(
            model_name='vinculodependente',
            name='consulado',
        ),

        # 4. Renomear colunas temp para nome final
        migrations.RenameField(
            model_name='titular',
            old_name='nacionalidade_temp',
            new_name='nacionalidade',
        ),
        migrations.RenameField(
            model_name='dependente',
            old_name='nacionalidade_temp',
            new_name='nacionalidade',
        ),
        migrations.RenameField(
            model_name='vinculotitular',
            old_name='consulado_temp',
            new_name='consulado',
        ),
        migrations.RenameField(
            model_name='vinculodependente',
            old_name='consulado_temp',
            new_name='consulado',
        ),

        # 5. Remover índices antigos relacionados a nacionalidade (se existirem)
        migrations.RunSQL(
            sql="""
                DROP INDEX IF EXISTS titular_id_naci_a8d111_idx;
                DROP INDEX IF EXISTS dependente_id_naci_ac7402_idx;
                DROP INDEX IF EXISTS vinculo_dep_id_cons_1a3722_idx;
            """,
            reverse_sql=migrations.RunSQL.noop,
        ),

        # 6. Adicionar novos índices para os campos de texto
        migrations.AddIndex(
            model_name='titular',
            index=models.Index(fields=['nacionalidade'], name='titular_nac_text_idx'),
        ),
        migrations.AddIndex(
            model_name='dependente',
            index=models.Index(fields=['nacionalidade'], name='dependente_nac_text_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculotitular',
            index=models.Index(fields=['consulado'], name='vinc_tit_consul_text_idx'),
        ),
        migrations.AddIndex(
            model_name='vinculodependente',
            index=models.Index(fields=['consulado'], name='vinc_dep_consul_text_idx'),
        ),
    ]
