# Generated migration
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ordem_servico', '0008_remove_documento_os_valor_total_data_criacao'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        # 1. Remover centro_custos
        migrations.RemoveField(
            model_name='ordemservico',
            name='centro_custos',
        ),
        # 2. Adicionar novos status
        migrations.AlterField(
            model_name='ordemservico',
            name='status',
            field=models.CharField(
                choices=[
                    ('ABERTA', 'Aberta'),
                    ('FINALIZADA', 'Finalizada'),
                    ('FATURADA', 'Faturada'),
                    ('RECEBIDA', 'Recebida'),
                    ('CANCELADA', 'Cancelada')
                ],
                default='ABERTA',
                max_length=20,
                verbose_name='Status'
            ),
        ),
        # 3. Adicionar data_finalizada
        migrations.AddField(
            model_name='ordemservico',
            name='data_finalizada',
            field=models.DateTimeField(
                blank=True,
                null=True,
                verbose_name='Data de Finalização'
            ),
        ),
        # 4. Renomear o campo Python (Django não altera a coluna, apenas o atributo do modelo)
        migrations.RenameField(
            model_name='ordemservico',
            old_name='responsavel',
            new_name='solicitante',
        ),
        # 5. Adicionar colaborador
        migrations.AddField(
            model_name='ordemservico',
            name='colaborador',
            field=models.ForeignKey(
                blank=True,
                db_column='id_colaborador',
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='ordens_colaborador',
                to='accounts.user',
                verbose_name='Colaborador'
            ),
        ),
    ]
