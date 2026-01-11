# Generated migration
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ordem_servico', '0009_alter_os_status_and_fields'),
        ('contratos', '0004_update_status_choices'),
    ]

    operations = [
        # Adicionar empresa_contratada ao Contrato
        migrations.AddField(
            model_name='contrato',
            name='empresa_contratada',
            field=models.ForeignKey(
                blank=True,
                db_column='id_empresa_contratada',
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='contratos_como_contratada',
                to='ordem_servico.empresaprestadora',
                verbose_name='Empresa Contratada'
            ),
        ),
        # Adicionar prazo_faturamento ao Contrato
        migrations.AddField(
            model_name='contrato',
            name='prazo_faturamento',
            field=models.PositiveIntegerField(
                blank=True,
                null=True,
                verbose_name='Prazo de Faturamento (dias)',
                help_text='Prazo em dias para faturamento após conclusão do serviço'
            ),
        ),
    ]
