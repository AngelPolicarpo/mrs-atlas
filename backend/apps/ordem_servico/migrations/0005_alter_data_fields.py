# Generated migration for data field changes
import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ordem_servico', '0004_alter_ordemservico_status_tipodespesa_and_more'),
    ]

    operations = [
        # Remove old index on 'data' field
        migrations.RemoveIndex(
            model_name='ordemservico',
            name='ordem_servi_data_4531fe_idx',
        ),
        # Rename 'data' to 'data_abertura'
        migrations.RenameField(
            model_name='ordemservico',
            old_name='data',
            new_name='data_abertura',
        ),
        # Add new field 'data_fechamento'
        migrations.AddField(
            model_name='ordemservico',
            name='data_fechamento',
            field=models.DateField(blank=True, null=True, verbose_name='Data de Fechamento'),
        ),
        # Add centro_custos FK field
        migrations.AddField(
            model_name='ordemservico',
            name='centro_custos',
            field=models.ForeignKey(
                blank=True,
                db_column='id_centro_custos',
                help_text='Centro de custos (empresa prestadora) responsável',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='ordens_servico',
                to='ordem_servico.empresaprestadora',
                verbose_name='Centro de Custos'
            ),
        ),
        # Add index for data_abertura
        migrations.AddIndex(
            model_name='ordemservico',
            index=models.Index(fields=['data_abertura'], name='ordem_servi_data_ab_5780ee_idx'),
        ),
        # Add index for data_fechamento
        migrations.AddIndex(
            model_name='ordemservico',
            index=models.Index(fields=['data_fechamento'], name='ordem_servi_data_fe_f4b121_idx'),
        ),
    ]
